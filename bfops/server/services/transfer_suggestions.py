from collections import defaultdict

from django.db.models import Q
from ..models import Assignment, Job


def _person_matches_destination_job(person_grade_id, accepted_grade_ids):
    if accepted_grade_ids:
        return person_grade_id in accepted_grade_ids
    return person_grade_id is None


def build_transfer_suggestions(year, transfer_kind="all", limit=100):
    """
    - source job must have surplus workers
    - source company must have surplus workers
    - for external transfers, source unite must have surplus workers
    - destination job must have deficit workers
    - person grade must match destination job grade requirements
    """
    transfer_kind = (transfer_kind or "all").lower()
    if transfer_kind == "intern":
        transfer_kind = "internal"
    if transfer_kind not in {"all", "internal", "external"}:
        transfer_kind = "all"

    limit = max(int(limit or 1), 1)

    jobs = list(
        Job.objects.select_related("company__unite")
        .prefetch_related("grades")
        .all()
    )
    if not jobs:
        return []

    assignment_qs = Assignment.objects.select_related("person__grade", "job__company__unite")
    if year is not None:
        try:
            year_val = int(year)
            assignment_qs = assignment_qs.filter(Q(year__lte=year_val) | Q(year__isnull=True))
        except (ValueError, TypeError):
            pass

    assignment_qs = assignment_qs.order_by("person_id", "-created_at", "-id")

    latest_assignments = []
    seen_persons = set()
    for assignment in assignment_qs:
        if assignment.person_id not in seen_persons:
            seen_persons.add(assignment.person_id)
            latest_assignments.append(assignment)

    latest_assignments.sort(key=lambda a: (a.job_id, a.person.last_name, a.person.first_name))
    assignments = latest_assignments

    if not assignments:
        return []

    job_counts = defaultdict(int)
    assignments_by_job = defaultdict(list)
    for assignment in assignments:
        job_counts[assignment.job_id] += 1
        assignments_by_job[assignment.job_id].append(assignment)

    job_by_id = {job.id: job for job in jobs}
    job_grade_map = {job.id: {grade.id for grade in job.grades.all()} for job in jobs}

    job_differences = {}
    company_differences = defaultdict(int)
    unite_differences = defaultdict(int)

    for job in jobs:
        current_workers = job_counts.get(job.id, 0)
        difference = current_workers - job.max_workers
        job_differences[job.id] = difference

        if job.company_id:
            company_differences[job.company_id] += difference

        unite_id = job.company.unite_id if job.company else None
        if unite_id:
            unite_differences[unite_id] += difference

    job_surplus_budget = {
        job_id: diff for job_id, diff in job_differences.items() if diff > 0
    }
    company_surplus_budget = {
        company_id: diff for company_id, diff in company_differences.items() if diff > 0
    }
    unite_surplus_budget = {
        unite_id: diff for unite_id, diff in unite_differences.items() if diff > 0
    }
    destination_need = {
        job_id: -diff for job_id, diff in job_differences.items() if diff < 0
    }

    if not job_surplus_budget or not destination_need:
        return []

    deficit_jobs = [job_by_id[job_id] for job_id in destination_need.keys() if job_id in job_by_id]

    suggestions = []
    sorted_source_job_ids = sorted(
        job_surplus_budget.keys(),
        key=lambda job_id: (
            job_by_id[job_id].company.unite.name.lower() if job_by_id[job_id].company and job_by_id[job_id].company.unite else "",
            job_by_id[job_id].company.name.lower() if job_by_id[job_id].company else "",
            job_by_id[job_id].name.lower(),
        ),
    )

    for source_job_id in sorted_source_job_ids:
        source_assignments = assignments_by_job.get(source_job_id, [])

        for assignment in source_assignments:
            if len(suggestions) >= limit:
                return suggestions

            if job_surplus_budget.get(source_job_id, 0) <= 0:
                break

            source_job = assignment.job
            source_company = source_job.company if source_job else None
            source_unite = source_company.unite if source_company else None

            if not source_company or not source_unite:
                continue

            if company_surplus_budget.get(source_company.id, 0) <= 0:
                continue

            person_grade_id = assignment.person.grade_id

            best_destination = None
            best_transfer_type = None
            best_score = None

            for destination_job in deficit_jobs:
                if destination_need.get(destination_job.id, 0) <= 0:
                    continue

                destination_company = destination_job.company if destination_job else None
                destination_unite = destination_company.unite if destination_company else None

                if not destination_company or not destination_unite:
                    continue

                if destination_company.id == source_company.id:
                    continue

                transfer_type = "internal" if destination_unite.id == source_unite.id else "external"

                if transfer_kind != "all" and transfer_type != transfer_kind:
                    continue

                if transfer_type == "external" and unite_surplus_budget.get(source_unite.id, 0) <= 0:
                    continue

                accepted_grade_ids = job_grade_map.get(destination_job.id, set())
                if not _person_matches_destination_job(person_grade_id, accepted_grade_ids):
                    continue

                score = (
                    0 if transfer_type == "internal" else 1,
                    -destination_need[destination_job.id],
                    destination_company.name.lower(),
                    destination_job.name.lower(),
                )
                if best_score is None or score < best_score:
                    best_score = score
                    best_destination = destination_job
                    best_transfer_type = transfer_type

            if not best_destination or not best_transfer_type:
                continue

            destination_company = best_destination.company
            destination_unite = destination_company.unite

            suggestions.append({
                "assignment_id": assignment.id,
                "person_id": assignment.person_id,
                "person_name": str(assignment.person),
                "person_grade_id": assignment.person.grade_id,
                "person_grade_name": assignment.person.grade.name if assignment.person.grade else None,
                "year_id": assignment.year,
                "year": assignment.year,
                "transfer_type": best_transfer_type,
                "requires_validation": True,
                "source": {
                    "unite_id": source_unite.id,
                    "unite_name": source_unite.name,
                    "company_id": source_company.id,
                    "company_name": source_company.name,
                    "job_id": source_job.id,
                    "job_name": source_job.name,
                },
                "destination": {
                    "unite_id": destination_unite.id,
                    "unite_name": destination_unite.name,
                    "company_id": destination_company.id,
                    "company_name": destination_company.name,
                    "job_id": best_destination.id,
                    "job_name": best_destination.name,
                },
                "new_unite_id": destination_unite.id,
                "new_company_id": destination_company.id,
                "new_job_id": best_destination.id,
                "reason": (
                    f"Suggested {best_transfer_type} transfer "
                    f"from {source_company.name}/{source_job.name} "
                    f"to {destination_company.name}/{best_destination.name}"
                ),
            })

            job_surplus_budget[source_job_id] -= 1
            company_surplus_budget[source_company.id] = company_surplus_budget.get(source_company.id, 0) - 1
            destination_need[best_destination.id] -= 1

            if best_transfer_type == "external":
                unite_surplus_budget[source_unite.id] = unite_surplus_budget.get(source_unite.id, 0) - 1

    return suggestions