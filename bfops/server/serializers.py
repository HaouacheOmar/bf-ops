from rest_framework import serializers
from .models import Assignment, Company, Job, Person, Year, Grade, Unite, TransferHistory, UniteQuota, Gain, Loss

class UniteQuotaSerializer(serializers.ModelSerializer):
    unite_name = serializers.CharField(source="unite.name", read_only=True)
    class Meta:
        model = UniteQuota
        fields = ["id", "year", "unite", "unite_name", "quota"]

class TransferHistorySerializer(serializers.ModelSerializer):
    from_unite_name = serializers.CharField(source="from_unite.name", read_only=True)
    to_unite_name = serializers.CharField(source="to_unite.name", read_only=True)
    from_company_name = serializers.CharField(source="assignment.job.company.name", read_only=True)
    to_company_name = serializers.SerializerMethodField()
    person_name = serializers.CharField(source="assignment.person.__str__", read_only=True)
    job_name = serializers.CharField(source="assignment.job.name", read_only=True)
    year_value = serializers.IntegerField(source="assignment.year.year", read_only=True)

    class Meta:
        model = TransferHistory
        fields = [
            "id",
            "assignment",
            "person_name",
            "job_name",
            "year_value",
            "from_unite",
            "from_unite_name",
            "from_company_name",
            "to_unite",
            "to_unite_name",
            "to_company_name",
            "transfer_date",
            "reason",
        ]

    def get_to_company_name(self, obj):
        """Extract the destination company name from the to_unite's companies"""
        if obj.to_unite:
            companies = obj.to_unite.companies.all()
            if companies.exists():
                return companies.first().name
        return "-"

class JobSerializer(serializers.ModelSerializer):
    accepted_grades_info = serializers.SerializerMethodField()
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "name",
            "code",
            "company",
            "company_name",
            "grades", 
            "accepted_grades_info", 
            "max_workers",
            "created_at",
        ]

    def get_accepted_grades_info(self, obj):
        return [{"id": g.id, "name": g.name} for g in obj.grades.all()]

    def validate(self, attrs):
        name = attrs.get("name", getattr(self.instance, "name", None))
        company = attrs.get("company", getattr(self.instance, "company", None))

        if name and company:
            duplicate_qs = Job.objects.filter(company=company, name=name)
            if self.instance:
                duplicate_qs = duplicate_qs.exclude(id=self.instance.id)
            if duplicate_qs.exists():
                raise serializers.ValidationError({
                    "name": "This job name already exists in the selected company."
                })

        return attrs

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ["id", "name", "code", "created_at"]

class UniteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unite
        fields = ["id", "name", "code", "created_at"]

class PersonSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source="grade.name", read_only=True)
    class Meta:
        model = Person
        fields = ["id", "first_name", "last_name", "national_id", "contract_type", "grade", "grade_name", "created_at"]

class AssignmentSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.__str__", read_only=True)
    job_name = serializers.CharField(source="job.name", read_only=True)
    company_id = serializers.IntegerField(source="job.company.id", read_only=True)
    company_name = serializers.CharField(source="job.company.name", read_only=True)
    unite_id = serializers.IntegerField(source="job.company.unite.id", read_only=True)
    unite_name = serializers.CharField(
        source="job.company.unite.name",
        read_only=True,
        default="Aucune unité"
    )
    year_value = serializers.IntegerField(source="year.year", read_only=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "person",
            "job",
            "year",
            "person_name",
            "job_name",
            "company_id",
            "company_name",
            "unite_id",
            "unite_name",
            "year_value",
            "created_at",
        ]

    def validate(self, data):
        job = data.get("job")
        person = data.get("person")
        year = data.get("year")
        
        if self.instance:
            if job is None: job = self.instance.job
            if person is None: person = self.instance.person
            if year is None: year = self.instance.year
            current_assignment_id = self.instance.id
        else:
            current_assignment_id = None

        if job and year:
            qs = Assignment.objects.filter(job=job, year=year)
            if current_assignment_id:
                qs = qs.exclude(id=current_assignment_id)
            if qs.count() >= job.max_workers:
                raise serializers.ValidationError(
                    f"Job '{job.name}' has reached its maximum capacity of {job.max_workers} workers for year {year.year}."
                )

        if job and person:
            if job.grade is not None:
                if person.grade is None or person.grade != job.grade:
                    raise serializers.ValidationError(
                        "Person's grade does not match any of the accepted grades for this job."
                    )
            else:
                if person.grade is not None:
                    raise serializers.ValidationError(
                        "This job does not require a grade, but the person is assigned a grade."
                    )
                    
        return data

class GainSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.__str__", read_only=True)
    unite_name = serializers.CharField(source="unite.name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    year_value = serializers.IntegerField(source="year.year", read_only=True)

    class Meta:
        model = Gain
        fields = ["id", "person_name", "unite_name", "company_name", "year_value", "created_at"]

class LossSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.__str__", read_only=True)
    unite_name = serializers.CharField(source="unite.name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    year_value = serializers.IntegerField(source="year.year", read_only=True)

    class Meta:
        model = Loss
        fields = ["id", "person_name", "unite_name", "company_name", "year_value", "created_at"]