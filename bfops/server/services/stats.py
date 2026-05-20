from django.db.models import Count, Q
from ..models import Assignment, Job, UniteQuota


def _assignment_counts_by_job(year=None):
    assignment_qs = Assignment.objects.all()

    if year is not None:
        try:
            year = int(year)
            # Include assignments from this year or earlier, OR assignments with no explicit year
            assignment_qs = assignment_qs.filter(Q(year__lte=year) | Q(year__isnull=True))
        except (ValueError, TypeError):
            pass

    # Snapshot mode: keep only the latest assignment per person up to the given year.
    latest_job_by_person = {}
    latest_assignments = (
        assignment_qs
        .order_by("person_id", "-created_at", "-id")
        .values_list("person_id", "job_id")
    )
    for person_id, job_id in latest_assignments:
        if person_id not in latest_job_by_person:
            latest_job_by_person[person_id] = job_id

    job_counts = {}
    for job_id in latest_job_by_person.values():
        job_counts[job_id] = job_counts.get(job_id, 0) + 1

    return job_counts


def job_statistics(year=None):

    jobs = Job.objects.filter(is_in_quota=True).select_related("company__unite").exclude(name__iexact="En attente d'affectation")
    job_counts = _assignment_counts_by_job(year)
    results = []
    for job in jobs:
        current = job_counts.get(job.id, 0)
        max_workers = job.max_workers
        difference = current - max_workers
        percentage = (difference / max_workers * 100) if max_workers > 0 else 0
        results.append({
            "job_id": job.id,
            "job_name": job.name,
            "company_id": job.company.id if job.company else None,
            "company_name": job.company.name if job.company else None,
            "unite_id": job.company.unite_id if job.company else None,
            "unite_name": job.company.unite.name if job.company and job.company.unite else None,
            "current_workers": current,
            "max_workers": max_workers,
            "difference": difference,
            "percentage": round(percentage, 2),
            "status": (
                "deficit" if difference < 0
                else "surplus" if difference > 0
                else "balanced"
            )
        })
    return results

def unite_statistics(year_id=None):
    """
    Returns a list of unite stats for the given year, using UniteQuota as capacity.
    """
    jobs = Job.objects.filter(is_in_quota=True).select_related("company__unite").exclude(name__iexact="En attente d'affectation")
    job_counts = _assignment_counts_by_job(year_id)

    quota_qs = UniteQuota.objects.select_related("unite")
    if year_id is not None:
        quota_qs = quota_qs.filter(year=year_id)

    quotas = {}
    for quota in quota_qs.order_by("unite_id", "-year", "-id"):
        if quota.unite_id in quotas:
            continue
        quotas[quota.unite_id] = {
            "unite_name": quota.unite.name,
            "quota": quota.quota,
        }

    unite_map = {}
    for unite_id, quota_info in quotas.items():
        unite_map[unite_id] = {
            "unite_id": unite_id,
            "unite_name": quota_info["unite_name"],
            "max_workers": quota_info["quota"],
            "current_workers": 0,
            "jobs": [],
        }

    for job in jobs:
        unite_id = job.company.unite_id if job.company and job.company.unite_id else None
        if unite_id not in unite_map:
            unite_map[unite_id] = {
                "unite_id": unite_id,
                "unite_name": job.company.unite.name if job.company and job.company.unite else None,
                "max_workers": 0,
                "current_workers": 0,
                "jobs": [],
            }
        current_workers = job_counts.get(job.id, 0)
        unite_map[unite_id]["current_workers"] += current_workers
        difference = current_workers - job.max_workers
        percentage = (difference / job.max_workers * 100) if job.max_workers > 0 else 0
        unite_map[unite_id]["jobs"].append({
            "job_id": job.id,
            "job_name": job.name,
            "company_id": job.company.id if job.company else None,
            "company_name": job.company.name if job.company else None,
            "current_workers": current_workers,
            "max_workers": job.max_workers,
            "difference": difference,
            "percentage": round(percentage, 2),
            "status": (
                "deficit" if difference < 0
                else "surplus" if difference > 0
                else "balanced"
            ),
        })

    results = []
    for unite_id, data in unite_map.items():
        max_workers = data["max_workers"]
        current = data["current_workers"]
        difference = current - max_workers
        percentage = (difference / max_workers * 100) if max_workers > 0 else 0
        status = (
            "deficit" if difference < 0
            else "surplus" if difference > 0
            else "balanced"
        )
        results.append({
            "unite_id": unite_id,
            "unite_name": data["unite_name"],
            "current_workers": current,
            "max_workers": max_workers,
            "difference": difference,
            "percentage": round(percentage, 2),
            "status": status,
            "jobs": data["jobs"],
        })
    return results

def company_statistics(year=None):
    """
    Returns a list of company stats for the given year, aggregating jobs in each company.
    """
    jobs = Job.objects.filter(is_in_quota=True).select_related("company__unite").exclude(name__iexact="En attente d'affectation")
    company_map = {}
    
    for job in jobs:
        if not job.company:
            continue
            
        company_id = job.company.id
        if company_id not in company_map:
            company_map[company_id] = {
                "company_id": company_id,
                "company_name": job.company.name,
                "unite_id": job.company.unite_id if job.company.unite else None,
                "unite_name": job.company.unite.name if job.company.unite else None,
                "max_workers": 0,
                "current_workers": 0,
            }
        company_map[company_id]["max_workers"] += job.max_workers

    job_counts = _assignment_counts_by_job(year)
    
    for job in jobs:
        if job.company and job.company.id in company_map:
            company_map[job.company.id]["current_workers"] += job_counts.get(job.id, 0)

    results = []
    for company_id, data in company_map.items():
        max_workers = data["max_workers"]
        current = data["current_workers"]
        difference = current - max_workers
        percentage = (difference / max_workers * 100) if max_workers > 0 else 0
        
        status = (
            "deficit" if difference < 0
            else "surplus" if difference > 0
            else "balanced"
        )
        
        results.append({
            "company_id": company_id,
            "company_name": data["company_name"],
            "unite_id": data["unite_id"],
            "unite_name": data["unite_name"],
            "current_workers": current,
            "max_workers": max_workers,
            "difference": difference,
            "percentage": round(percentage, 2),
            "status": status,
        })
        
    return results