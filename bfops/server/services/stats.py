from django.db.models import Count, Sum
from ..models import Assignment, Job, Unite

def job_statistics(year_id):
    """
    Returns a list of job stats for the given year, including deficit/surplus/balanced status.
    """
    queryset = (
        Assignment.objects
        .filter(year_id=year_id)
        .values(
            "job_id",
            "job__name",
            "job__max_workers",
            "job__company__unite_id",
            "job__company__unite__name",
        )
        .annotate(current_workers=Count("id"))
    )

    results = []
    for row in queryset:
        max_workers = row["job__max_workers"]
        current = row["current_workers"]
        difference = current - max_workers
        percentage = (difference / max_workers * 100) if max_workers > 0 else 0
        results.append({
            "job_id": row["job_id"],
            "job_name": row["job__name"],
            "unite_id": row["job__company__unite_id"],
            "unite_name": row["job__company__unite__name"],
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

def unite_statistics(year_id):
    """
    Returns a list of unite stats for the given year, aggregating jobs in each unite.
    """
    # Get all jobs with their unite and max_workers
    jobs = Job.objects.select_related("company__unite").all()
    unite_map = {}
    for job in jobs:
        unite_id = job.company.unite_id if job.company and job.company.unite_id else None
        if unite_id not in unite_map:
            unite_map[unite_id] = {
                "unite_id": unite_id,
                "unite_name": job.company.unite.name if job.company and job.company.unite else None,
                "max_workers": 0,
                "current_workers": 0,
            }
        unite_map[unite_id]["max_workers"] += job.max_workers

    # Count assignments per job for the year
    job_counts = dict(
        Assignment.objects
        .filter(year_id=year_id)
        .values_list("job_id")
        .annotate(count=Count("id"))
    )
    for job in jobs:
        unite_id = job.company.unite_id if job.company and job.company.unite_id else None
        unite_map[unite_id]["current_workers"] += job_counts.get(job.id, 0)

    # Calculate stats for each unite
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
        })
    return results


def job_statistics(year_id):

    queryset = (
        Assignment.objects
        .filter(year_id=year_id)
        .values(
            "job_id",
            "job__name",
            "job__max_workers",
        )
        .annotate(current_workers=Count("id"))
    )

    results = []

    for row in queryset:
        max_workers = row["job__max_workers"]
        current = row["current_workers"]
        difference = current - max_workers

        percentage = (difference / max_workers * 100) if max_workers > 0 else 0

        results.append({
            "job_id": row["job_id"],
            "job_name": row["job__name"],
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