from django.db.models import Count
from ..models import Assignment, Job

def job_statistics(year_id):
    """
    Returns a list of job stats for the given year, including deficit/surplus/balanced status.
    """
    jobs = Job.objects.select_related("company__unite").all()
    job_counts = dict(
        Assignment.objects
        .filter(year_id=year_id)
        .values_list("job_id")
        .annotate(count=Count("id"))
    )
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

def unite_statistics(year_id):
    """
    Returns a list of unite stats for the given year, aggregating jobs in each unite.
    """
    jobs = Job.objects.select_related("company__unite").all()
    job_counts = dict(
        Assignment.objects
        .filter(year_id=year_id)
        .values_list("job_id")
        .annotate(count=Count("id"))
    )
    unite_map = {}
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
        unite_map[unite_id]["max_workers"] += job.max_workers
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

def company_statistics(year_id):
    """
    Returns a list of company stats for the given year, aggregating jobs in each company.
    """
    jobs = Job.objects.select_related("company__unite").all()
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

    job_counts = dict(
        Assignment.objects
        .filter(year_id=year_id)
        .values_list("job_id")
        .annotate(count=Count("id"))
    )
    
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