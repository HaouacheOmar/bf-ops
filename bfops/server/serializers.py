from rest_framework import serializers
from .models import Assignment, Company, Job, Person, Year, Grade, Unite, TransferHistory, UniteQuota
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
    grade_name = serializers.CharField(
        source="grade.name",
        read_only=True
    )

    class Meta:
        model = Job
        fields = [
            "id",
            "name",
            "code",
            "company",
            "grade",
            "grade_name",
            "max_workers",
            "created_at",
        ]
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
    class Meta:
        model = Person
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "national_id",
            "date_of_birth",
            "hire_date",
            "contract_type",
            "grade",
        ]
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class AssignmentSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(
        source="person.__str__",
        read_only=True
    )
    job_name = serializers.CharField(
        source="job.name",
        read_only=True
    )
    company_name = serializers.CharField(
        source="job.company.name",
        read_only=True
    )
    year_value = serializers.IntegerField(
        source="year.year",
        read_only=True
    )
    class Meta:
        model = Assignment
        fields = [
            "id",
            "person",
            "job",
            "year",
            "contract_type",
            "person_name",
            "job_name",
            "company_name",
            "year_value",
            "created_at",
        ]

    def validate(self, data):
        person = data.get('person')
        job = data.get('job')
        if person and job:
            # If either grade is None, allow only if both are None
            if job.grade_id is not None and person.grade_id is not None:
                if job.grade_id != person.grade_id:
                    raise serializers.ValidationError("Person's grade does not match the required grade for this job.")
            elif job.grade_id is not None or person.grade_id is not None:
                raise serializers.ValidationError("Person's grade does not match the required grade for this job.")
        return data