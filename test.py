import random
import json

companies = [
    {"id": 7, "name": "commandement"},
    {"id": 5, "name": "deuxiemme comp"},
    {"id": 6, "name": "mounawra"},
    {"id": 3, "name": "OPS"},
    {"id": 4, "name": "premiere comp"},
]
grades = [
    {"id": 6, "name": "ajeudant"},
    {"id": 7, "name": "ajeudant chef"},
    {"id": 8, "name": "ajeudant principale"},
    {"id": 9, "name": "aspirant"},
    {"id": 12, "name": "capitaine"},
    {"id": 2, "name": "caporale"},
    {"id": 3, "name": "caporale chef"},
    {"id": 15, "name": "colonnel"},
    {"id": 13, "name": "commandent"},
    {"id": 11, "name": "lieutenant"},
    {"id": 14, "name": "lieutenant colonnel"},
    {"id": 4, "name": "sergent"},
    {"id": 5, "name": "sergent chef"},
    {"id": 1, "name": "soldat"},
    {"id": 10, "name": "sous lieuteant"},
]

job_names = [
    "chef regiment", "chef OPS", "chef premiere comp", "chef deuxiemme comp", "chef mounawra",
    "adjoint commandement", "adjoint OPS", "adjoint premiere comp", "adjoint deuxiemme comp", "adjoint mounawra",
    "secretaire commandement", "secretaire OPS", "secretaire premiere comp", "secretaire deuxiemme comp", "secretaire mounawra"
]

jobs = []
remaining_workers = 300

for i in range(15):
    name = job_names[i]
    code = ''.join([w[0] for w in name.split()]).lower()
    company = random.choice(companies)["id"]
    grade = random.choice(grades)["id"]
    max_for_this = min(remaining_workers - (14 - i), 30)
    max_workers = random.randint(1, max_for_this)
    jobs.append({
        "name": name,
        "code": code,
        "company": company,
        "grade": grade,
        "max_workers": str(max_workers)
    })
    remaining_workers -= max_workers

print(json.dumps(jobs, indent=2, ensure_ascii=False))