from rest_framework import serializers
from .models import Assignment, Company, Job, Person, Grade, Unite, TransferHistory, UniteQuota, Gain, Loss

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
    year_value = serializers.IntegerField(source="assignment.year", read_only=True)

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
            "is_in_quota",
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
        fields = [
            "id",
            "name",
            "code",
            "rating",
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

class PersonSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    grade_name = serializers.CharField(source="grade.name", read_only=True)
    grade_rating = serializers.IntegerField(source="grade.rating", read_only=True)
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
            "matricule",
            "contract_type",
            "grade",
            "grade_name",
            "grade_rating",
            "unite",
            "company",
            "job",
            "unite_name",
            "company_name",
            "job_name"
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def to_internal_value(self, data):
        # Accept legacy national_id payloads while migrating API clients to matricule.
        incoming = data.copy() if hasattr(data, "copy") else data
        if hasattr(incoming, "get"):
            matricule_value = incoming.get("matricule")
            legacy_national_id = incoming.get("national_id")
            if (matricule_value is None or str(matricule_value).strip() == "") and legacy_national_id not in (None, ""):
                incoming["matricule"] = legacy_national_id
        return super().to_internal_value(incoming)

    def _get_latest_assignment(self, obj):
        prefetched_assignments = getattr(obj, "prefetched_assignments", None)
        if prefetched_assignments is not None:
            return prefetched_assignments[0] if prefetched_assignments else None

        return (
            obj.assignments
            .select_related("job__company__unite")
            .order_by("-year", "-created_at")
            .first()
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Keep legacy response compatibility while exposing matricule as canonical.
        data["national_id"] = data.get("matricule", "")
        latest_assignment = self._get_latest_assignment(instance)

        if latest_assignment:
            assignment_job = latest_assignment.job
            assignment_company = assignment_job.company if assignment_job else None
            assignment_unite = assignment_company.unite if assignment_company else None

            if not data.get("job") and assignment_job:
                data["job"] = assignment_job.id
            if not data.get("job_name") and assignment_job:
                data["job_name"] = assignment_job.name

            if not data.get("company") and assignment_company:
                data["company"] = assignment_company.id
            if not data.get("company_name") and assignment_company:
                data["company_name"] = assignment_company.name

            if not data.get("unite") and assignment_unite:
                data["unite"] = assignment_unite.id
            if not data.get("unite_name") and assignment_unite:
                data["unite_name"] = assignment_unite.name

        return data

class AssignmentSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.__str__", read_only=True)
    job_name = serializers.CharField(source="job.name", read_only=True)
    person_matricule = serializers.CharField(source="person.matricule", read_only=True)
    company_id = serializers.IntegerField(source="job.company.id", read_only=True)
    company_name = serializers.CharField(source="job.company.name", read_only=True)
    unite_id = serializers.IntegerField(source="job.company.unite.id", read_only=True)
    unite_name = serializers.CharField(
        source="job.company.unite.name",
        read_only=True,
        default="Aucune unité"
    )
    year_value = serializers.IntegerField(source="year", read_only=True)
    year = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "person",
            "job",
            "person_name",
            "person_matricule",
            "job_name",
            "company_id",
            "company_name",
            "unite_id",
            "unite_name",
            "year_value",
            "created_at",
            "year",
        ]
        extra_kwargs = {
            "year": {"required": False},
        }

    def validate(self, data):
        if data.get("year") in (None, ""):
            data["year"] = self.instance.year if self.instance else None

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
    year_value = serializers.IntegerField(source="year", read_only=True)

    class Meta:
        model = Gain
        fields = ["id", "person_name", "unite_name", "company_name", "year_value", "created_at"]

class LossSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.__str__", read_only=True)
    unite_name = serializers.CharField(source="unite.name", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)
    year_value = serializers.IntegerField(source="year", read_only=True)

    class Meta:
        model = Loss
        fields = ["id", "person_name", "unite_name", "company_name", "year_value", "created_at"]