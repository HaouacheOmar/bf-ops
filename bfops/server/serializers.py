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
            "to_unite",
            "to_unite_name",
            "transfer_date",
            "reason",
        ]

class JobSerializer(serializers.ModelSerializer):
    # Added a custom field to return the names and IDs of all accepted grades
    accepted_grades_info = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id",
            "name",
            "code",
            "company",
            "grades", # Use this to send a list of grade IDs when creating/updating
            "accepted_grades_info", # Read-only friendly output for the frontend
            "max_workers",
            "created_at",
        ]

    def get_accepted_grades_info(self, obj):
        return [{"id": g.id, "name": g.name} for g in obj.grades.all()]

class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = [
            "id",
            "name",
            "code",
            "created_at",
        ]

class UniteSerializer(serializers.ModelSerializer):
    companies_count = serializers.IntegerField(
        source="companies.count",
        read_only=True
    )
    class Meta:
        model = Unite
        fields = [
            "id",
            "name",
            "code",
            "companies_count",
            "created_at",
        ]

class CompanySerializer(serializers.ModelSerializer):
    jobs_count = serializers.IntegerField(
        source="jobs.count",
        read_only=True
    )
    unite = serializers.PrimaryKeyRelatedField(queryset=Unite.objects.all(), required=False, allow_null=True)
    unite_name = serializers.CharField(source="unite.name", read_only=True)
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "code",
            "unite",
            "unite_name",
            "jobs_count",
            "created_at",
        ]

class YearSerializer(serializers.ModelSerializer):
    unite_quotas = UniteQuotaSerializer(many=True, read_only=True)
    class Meta:
        model = Year
        fields = [
            "id",
            "year",
            "total_quota",
            "is_closed",
            "created_at",
            "unite_quotas",
        ]

class PersonSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    unite_name = serializers.CharField(source="unite.name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    job_name = serializers.CharField(source="job.name", read_only=True)

    class Meta:
        model = Person
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "national_id",
            "contract_type",
            "grade",
            "unite",
            "company",
            "job",
            "unite_name",
            "company_name",
            "job_name"
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class AssignmentSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.__str__", read_only=True)
    job_name = serializers.CharField(source="job.name", read_only=True)
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
            "company_name",
            "unite_id",
            "unite_name",
            "year_value",
            "created_at",
        ]

    def validate(self, data):
        person = data.get('person')
        job = data.get('job')
        
        if person and job:
            accepted_grades = job.grades.all()
            
            if accepted_grades.exists():
                # If the job has required grades, the person MUST have one of them
                if not person.grade or person.grade not in accepted_grades:
                    raise serializers.ValidationError(
                        "Person's grade does not match any of the accepted grades for this job."
                    )
            else:
                # If the job requires NO grade, but the person has one
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