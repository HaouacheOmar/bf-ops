from urllib.parse import urlencode
import re
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Assignment, Company, Job, Person, Grade, Unite, Gain, Loss, TransferHistory, UniteQuota
from .serializers import (
    AssignmentSerializer, CompanySerializer, JobSerializer,
    PersonSerializer, GradeSerializer, UniteSerializer, UniteQuotaSerializer,
    TransferHistorySerializer, GainSerializer, LossSerializer
)
from .services.stats import company_statistics, job_statistics, unite_statistics
from .services.transfer_suggestions import build_transfer_suggestions


def _normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip().lower()


def _sanitize_code_seed(value, fallback):
    seed = re.sub(r"[^A-Za-z0-9]+", "-", str(value or "").strip().upper()).strip("-")
    return seed or fallback


def _generate_unique_code(model_cls, seed, fallback="AUTO", max_length=50):
    base = _sanitize_code_seed(seed, fallback)
    candidate = base[:max_length]
    suffix = 2

    while model_cls.objects.filter(code=candidate).exists():
        suffix_token = f"-{suffix}"
        trimmed = base[: max_length - len(suffix_token)]
        candidate = f"{trimmed}{suffix_token}"
        suffix += 1

    return candidate


def _get_requested_year(request, *, required=True):
    raw_year = request.query_params.get("year_id") or request.query_params.get("year")
    if not raw_year:
        if required:
            return None, Response(
                {"error": "year_id (or year) parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None, None

    try:
        year = int(raw_year)
    except (TypeError, ValueError):
        return None, Response(
            {"error": "year_id (or year) must be an integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if year <= 0:
        return None, Response(
            {"error": "year must be a positive integer"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return year, None

class JobStatsView(APIView):
    def get(self, request):
        year, error_response = _get_requested_year(request, required=False)
        if error_response is not None:
            return error_response
        
        cache_key = f"stats:jobs:{year if year is not None else 'all'}"
        data = cache.get(cache_key)
        if data is None:
            data = job_statistics(year)
            cache.set(cache_key, data, timeout=3600)
            
        return Response(data)

class UniteStatsView(APIView):
    def get(self, request):
        year, error_response = _get_requested_year(request, required=False)
        if error_response is not None:
            return error_response
            
        cache_key = f"stats:unites:{year if year is not None else 'all'}"
        data = cache.get(cache_key)
        if data is None:
            data = unite_statistics(year)
            cache.set(cache_key, data, timeout=3600)
            
        return Response(data)

@api_view(['GET'])
def company_stats_view(request):
    year, error_response = _get_requested_year(request, required=False)
    if error_response is not None:
        return error_response
    
    cache_key = f"stats:companies:{year if year is not None else 'all'}"
    stats = cache.get(cache_key)
    if stats is None:
        stats = company_statistics(year)
        cache.set(cache_key, stats, timeout=3600)
    
    unite_id = request.GET.get('unite_id')
    company_id = request.GET.get('company_id')
    
    if unite_id:
        stats = [s for s in stats if str(s.get('unite_id')) == str(unite_id)]
    if company_id:
        stats = [s for s in stats if str(s.get('company_id')) == str(company_id)]
        
    return Response({"results": stats})

class UniteQuotaViewSet(viewsets.ModelViewSet):
    queryset = UniteQuota.objects.select_related("unite").all()
    serializer_class = UniteQuotaSerializer

class TransferHistoryViewSet(viewsets.ModelViewSet):
    queryset = TransferHistory.objects.select_related("assignment", "from_unite", "to_unite").all()
    serializer_class = TransferHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'assignment': ['exact'], 'assignment__person': ['exact'], 'assignment__job': ['exact'],
        'assignment__year': ['exact'], 'from_unite': ['exact'], 'to_unite': ['exact'],
    }
    search_fields = ['reason']
    ordering_fields = ['transfer_date', 'from_unite', 'to_unite']

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related("person", "job", "job__company__unite").all()
    serializer_class = AssignmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job', 'job__name', 'year', 'person', 'person__contract_type']
    search_fields = ['person__first_name', 'person__last_name', 'person__matricule', 'job__name']
    ordering_fields = ['created_at', 'year', 'job']

    def perform_create(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'rating', 'created_at']

    def _with_generated_code_if_missing(self, payload):
        data = payload.copy() if hasattr(payload, "copy") else dict(payload)
        if not str(data.get("code", "")).strip():
            data["code"] = _generate_unique_code(Grade, data.get("name"), fallback="GRD")
        return data

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=self._with_generated_code_if_missing(request.data))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=self._with_generated_code_if_missing(request.data), partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not isinstance(request.data, list):
            return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        errors = []

        for index, row in enumerate(request.data):
            row_number = index + 2
            name = str(row.get("name", "")).strip()
            code = str(row.get("code", "")).strip()
            rating_raw = row.get("rating", None)

            if not name:
                errors.append(f"Row {row_number}: Missing grade name.")
                continue

            try:
                rating = int(rating_raw)
            except (TypeError, ValueError):
                errors.append(f"Row {row_number}: Rating must be an integer.")
                continue

            if not code:
                code = _generate_unique_code(Grade, name, fallback="GRD")

            serializer = self.get_serializer(data={"name": name, "code": code, "rating": rating})
            if serializer.is_valid():
                serializer.save()
                created.append(serializer.data)
            else:
                errors.append(f"Row {row_number}: {serializer.errors}")

        if not created and errors:
            return Response({"error": "All rows failed.", "details": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": f"Successfully created {len(created)} grades.",
                "count": len(created),
                "errors": errors if errors else None,
                "results": created,
            },
            status=status.HTTP_201_CREATED,
        )

class UniteViewSet(viewsets.ModelViewSet):
    queryset = Unite.objects.all()
    serializer_class = UniteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

    def list(self, request, *args, **kwargs):
        # FIX: Use urlencode with sorted parameters for a stable cache key
        query_string = urlencode(sorted(request.query_params.items()))
        key = f"unites:{query_string}"
        
        data = cache.get(key)
        if data is None:
            response = super().list(request, *args, **kwargs)
            cache.set(key, response.data, timeout=60)
            return response
        return Response(data)

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['unite']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

    def _with_generated_code_if_missing(self, payload):
        data = payload.copy() if hasattr(payload, "copy") else dict(payload)
        if not str(data.get("code", "")).strip():
            data["code"] = _generate_unique_code(Company, data.get("name"), fallback="COMP")
        return data

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=self._with_generated_code_if_missing(request.data))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=self._with_generated_code_if_missing(request.data), partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not isinstance(request.data, list):
            return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        errors = []
        unites = list(Unite.objects.all())

        for index, row in enumerate(request.data):
            row_number = index + 2
            name = str(row.get("name", "")).strip()
            code = str(row.get("code", "")).strip()
            unite_value = row.get("unite")

            if not name:
                errors.append(f"Row {row_number}: Missing company name.")
                continue

            if unite_value in (None, ""):
                errors.append(f"Row {row_number}: Missing unite.")
                continue

            unite_obj = None
            if str(unite_value).strip().isdigit():
                unite_obj = next((u for u in unites if u.id == int(str(unite_value).strip())), None)
            if unite_obj is None:
                normalized_input = _normalize_text(unite_value)
                unite_obj = next((u for u in unites if _normalize_text(u.name) == normalized_input), None)

            if unite_obj is None:
                errors.append(f"Row {row_number}: Unite '{unite_value}' does not exist.")
                continue

            if not code:
                code = _generate_unique_code(Company, name, fallback="COMP")

            serializer = self.get_serializer(data={"name": name, "code": code, "unite": unite_obj.id})
            if serializer.is_valid():
                serializer.save()
                created.append(serializer.data)
            else:
                errors.append(f"Row {row_number}: {serializer.errors}")

        if not created and errors:
            return Response({"error": "All rows failed.", "details": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "message": f"Successfully created {len(created)} companies.",
                "count": len(created),
                "errors": errors if errors else None,
                "results": created,
            },
            status=status.HTTP_201_CREATED,
        )

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        """Exclude the default holding/unassigned job from API results."""
        return super().get_queryset().exclude(name__iexact="En attente d'affectation")

    def _integrity_error_response(self, exc):
        message = str(exc)
        lower = message.lower()

        if "server_job_name_key" in lower:
            return Response(
                {
                    "error": (
                        "Legacy database constraint still enforces global unique job names. "
                        "Run migrations to apply per-company uniqueness."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "unique_job_name_per_company" in lower:
            return Response(
                {"error": "This job name already exists in the selected company."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "server_job_code_key" in lower or "(code)=" in lower:
            return Response(
                {"error": "Job code must be unique."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"error": "Database integrity error while saving job."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as exc:
            return self._integrity_error_response(exc)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not isinstance(request.data, list):
            return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError as exc:
                return self._integrity_error_response(exc)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except IntegrityError as exc:
            return self._integrity_error_response(exc)

class YearViewSet(viewsets.ViewSet):
    """
    Compatibility endpoint returning distinct fiscal years now sourced from operational data.
    """

    def list(self, request):
        years = set(Assignment.objects.values_list("year", flat=True))
        years.update(UniteQuota.objects.values_list("year", flat=True))
        years = [value for value in years if value is not None]

        ordering = request.query_params.get("ordering", "-year")
        reverse = ordering.startswith("-")
        years.sort(reverse=reverse)

        payload = [
            {
                "id": year,
                "year": year,
                "total_quota": None,
                "is_closed": False,
                "created_at": None,
            }
            for year in years
        ]
        return Response(payload)

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.select_related(
        "grade",
        "unite",
        "company",
        "job",
    ).prefetch_related(
        Prefetch(
            "assignments",
            queryset=Assignment.objects.select_related("job__company__unite").order_by("-year", "-created_at"),
            to_attr="prefetched_assignments",
        )
    )
    serializer_class = PersonSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'matricule']
    ordering_fields = ['last_name', 'first_name', 'created_at']

    def perform_create(self, serializer):
        person = serializer.save()
        Gain.objects.create(
            person=person,
            unite=person.unite,
            company=person.company,
            year=timezone.now().year
        )

    def perform_destroy(self, instance):
        Loss.objects.create(
            person=instance,
            unite=instance.unite,
            company=instance.company,
            year=timezone.now().year
        )
        instance.delete()

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not isinstance(request.data, list):
            return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)
        
        created_count = 0
        updated_count = 0
        errors = []

        for index, item_data in enumerate(request.data):
            matricule = item_data.get('matricule')
            if not matricule:
                errors.append(f"Row {index + 1}: Missing matricule.")
                continue
            
            try:
                # Update if matricule exists, otherwise create
                person, created = Person.objects.update_or_create(
                    matricule=matricule,
                    defaults={
                        'first_name': item_data.get('first_name', ''),
                        'last_name': item_data.get('last_name', ''),
                        'contract_type': item_data.get('contract_type', 'actif'),
                        'grade_id': item_data.get('grade'),
                        'unite_id': item_data.get('unite'),
                        'company_id': item_data.get('company'),
                    }
                )
                if created:
                    created_count += 1
                    Gain.objects.create(
                        person=person,
                        unite=person.unite,
                        company=person.company,
                        year=timezone.now().year
                    )
                else:
                    updated_count += 1
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")

        if errors and created_count == 0 and updated_count == 0:
            return Response({"error": "All rows failed.", "details": errors}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            "message": f"Successfully created {created_count} and updated {updated_count} persons.",
            "errors": errors if errors else None
        }, status=status.HTTP_200_OK)

# Gain/Loss views only need Read-Only access 
class GainViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gain.objects.select_related("person", "unite", "company").all()
    serializer_class = GainSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['unite', 'company', 'year']

class LossViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Loss.objects.select_related("person", "unite", "company").all()
    serializer_class = LossSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['unite', 'company', 'year']

@api_view(['GET'])
def transfer_suggestions(request):
    year, error_response = _get_requested_year(request)
    if error_response is not None:
        return error_response

    transfer_kind = request.GET.get('transfer_kind', 'all').lower()
    if transfer_kind == 'intern':
        transfer_kind = 'internal'
    limit = request.GET.get('limit', 100)

    if transfer_kind not in {'all', 'internal', 'external'}:
        return Response(
            {"error": "transfer_kind must be one of: all, internal, intern, external"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        return Response({"error": "limit must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

    limit = max(1, min(limit, 500))

    suggestions = build_transfer_suggestions(
        year=year,
        transfer_kind=transfer_kind,
        limit=limit,
    )

    return Response({
        "year_id": year,
        "year": year,
        "transfer_kind": transfer_kind,
        "count": len(suggestions),
        "results": suggestions,
    })


def _person_is_eligible_for_job(person, destination_job):
    accepted_grade_ids = set(destination_job.grades.values_list('id', flat=True))
    if accepted_grade_ids:
        return person.grade_id in accepted_grade_ids
    return person.grade_id is None


@api_view(['POST'])
@transaction.atomic
def execute_transfer(request):
    person_id = request.data.get('person_id')
    assignment_id = request.data.get('assignment_id')
    new_unite_id = request.data.get('new_unite_id')
    new_company_id = request.data.get('new_company_id')
    new_job_id = request.data.get('new_job_id')
    reason = request.data.get('reason', 'Transfert Unité')

    try:
        new_unite = Unite.objects.get(id=new_unite_id)
        person = None
        assignment = None
        old_job = None
        old_company = None
        old_unite = None

        if person_id:
            person = Person.objects.select_related("job", "company", "unite").get(id=person_id)
            # Find the active or latest assignment for the person if any
            assignment = Assignment.objects.filter(person=person).order_by("-year", "-created_at").first()
            old_unite = person.unite
            old_company = person.company
            old_job = person.job
        else:
            assignment = Assignment.objects.select_related('job__company__unite').get(id=assignment_id)
            person = assignment.person
            old_job = assignment.job
            old_company = old_job.company
            old_unite = old_company.unite

    except (Assignment.DoesNotExist, Person.DoesNotExist, Unite.DoesNotExist):
        return Response({"error": "Worker or Destination Unite not found."}, status=status.HTTP_404_NOT_FOUND)

    destination_company = None
    destination_job = None

    if old_unite == new_unite and not new_company_id and not new_job_id:
        return Response(
            {"error": "For an internal transfer, please choose a destination company or job."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_company_id:
        try:
            destination_company = Company.objects.get(id=new_company_id)
        except Company.DoesNotExist:
            return Response({"error": "Destination company not found."}, status=status.HTTP_404_NOT_FOUND)

        if destination_company.unite_id != new_unite.id:
            return Response(
                {"error": "Selected company does not belong to the destination unite."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if new_job_id:
        try:
            destination_job = Job.objects.select_related("company").get(id=new_job_id)
        except Job.DoesNotExist:
            return Response({"error": "Destination job not found."}, status=status.HTTP_404_NOT_FOUND)

        if destination_job.company.unite_id != new_unite.id:
            return Response(
                {"error": "Selected job is not linked to the destination unite."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if destination_company and destination_job.company_id != destination_company.id:
            return Response(
                {"error": "Selected job is not linked to the selected company."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        destination_company = destination_job.company

    if not destination_company:
        destination_company, _ = Company.objects.get_or_create(
            unite=new_unite,
            name=f"Pool - {new_unite.name}",
            defaults={"code": f"POOL-{new_unite.code}"},
        )

    if not destination_job:
        destination_job, _ = Job.objects.get_or_create(
            company=destination_company,
            name="En attente d'affectation",
            defaults={"code": f"ATT-{destination_company.id}-{new_unite.code}", "max_workers": 0, "is_in_quota": False},
        )

    if not _person_is_eligible_for_job(person, destination_job) and destination_job.name != "En attente d'affectation":
        return Response(
            {"error": "The worker's grade does not match the destination job requirements."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if (
        old_unite == new_unite
        and getattr(old_company, 'id', None) == destination_company.id
        and getattr(old_job, 'id', None) == destination_job.id
    ):
        return Response(
            {"error": "The worker is already assigned to this destination."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    year_val = assignment.year if assignment else timezone.now().year
    
    if old_unite:
        Loss.objects.create(person=person, year=year_val, unite=old_unite, company=old_company)
    Gain.objects.create(person=person, year=year_val, unite=new_unite, company=destination_company)
    
    if not assignment:
        assignment = Assignment.objects.create(person=person, year=year_val, job=destination_job)
        TransferHistory.objects.create(assignment=assignment, from_unite=old_unite, to_unite=new_unite, reason=reason)
    else:
        TransferHistory.objects.create(assignment=assignment, from_unite=old_unite, to_unite=new_unite, reason=reason)
        assignment.job = destination_job
        assignment.save()

    person.unite = new_unite
    person.company = destination_company
    person.job = destination_job
    person.save()

    return Response({"message": f"Transfert réussi vers l'unité {new_unite.name}."}, status=status.HTTP_200_OK)