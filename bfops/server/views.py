from urllib.parse import urlencode
from django.core.cache import cache
from django.db import transaction
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Assignment, Company, Job, Year, Person, Grade, Unite, Gain, Loss, TransferHistory, UniteQuota
from .serializers import (
    AssignmentSerializer, CompanySerializer, JobSerializer, YearSerializer, 
    PersonSerializer, GradeSerializer, UniteSerializer, UniteQuotaSerializer,
    TransferHistorySerializer, GainSerializer, LossSerializer
)
from .services.stats import company_statistics, job_statistics, unite_statistics

# --- Statistics API ---
class JobStatsView(APIView):
    def get(self, request):
        year_id = request.query_params.get('year_id')
        if not year_id:
            return Response({"error": "year_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(job_statistics(year_id))

class UniteStatsView(APIView):
    def get(self, request):
        year_id = request.query_params.get('year_id')
        if not year_id:
            return Response({"error": "year_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(unite_statistics(year_id))

@api_view(['GET'])
def company_stats_view(request):
    year_id = request.GET.get('year_id')
    if not year_id:
        return Response({"error": "year_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    stats = company_statistics(year_id)
    
    unite_id = request.GET.get('unite_id')
    company_id = request.GET.get('company_id')
    
    if unite_id:
        stats = [s for s in stats if str(s.get('unite_id')) == str(unite_id)]
    if company_id:
        stats = [s for s in stats if str(s.get('company_id')) == str(company_id)]
        
    return Response({"results": stats})

# --- Main ViewSets ---
class UniteQuotaViewSet(viewsets.ModelViewSet):
    queryset = UniteQuota.objects.select_related("year", "unite").all()
    serializer_class = UniteQuotaSerializer


class TransferHistoryViewSet(viewsets.ModelViewSet):
    queryset = TransferHistory.objects.select_related("assignment", "from_unite", "to_unite", "from_company", "to_company").all()
    serializer_class = TransferHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'assignment': ['exact'], 'assignment__person': ['exact'], 'assignment__job': ['exact'],
        'assignment__year': ['exact'], 'from_unite': ['exact'], 'to_unite': ['exact'],
    }
    search_fields = ['reason']
    ordering_fields = ['transfer_date', 'from_unite', 'to_unite']

    @action(detail=False, methods=['post'], url_path='execute')
    @transaction.atomic
    def execute_transfer(self, request):
        assignment_id = request.data.get('assignment_id')
        new_unite_id = request.data.get('new_unite_id')
        new_company_id = request.data.get('new_company_id')
        reason = request.data.get('reason', 'Transfert')

        if not all([assignment_id, new_unite_id, new_company_id]):
            return Response({"error": "Veuillez fournir l'affectation, l'unité et la compagnie de destination."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = Assignment.objects.select_related('job__company__unite').get(id=assignment_id)
            new_unite = Unite.objects.get(id=new_unite_id)
            new_company = Company.objects.get(id=new_company_id, unite=new_unite) 
        except Assignment.DoesNotExist:
            return Response({"error": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)
        except Unite.DoesNotExist:
            return Response({"error": "Destination Unite not found."}, status=status.HTTP_404_NOT_FOUND)
        except Company.DoesNotExist:
            return Response({"error": "La compagnie sélectionnée n'existe pas ou n'appartient pas à l'unité choisie."}, status=status.HTTP_400_BAD_REQUEST)

        old_job = assignment.job
        old_company = old_job.company
        old_unite = old_company.unite

        # Check only if old_company == new_company to allow internal same-unit transfers
        if old_company == new_company:
            return Response({"error": "Le travailleur est déjà dans cette compagnie."}, status=status.HTTP_400_BAD_REQUEST)

        # Create the pending job inside the selected company
        pending_job, _ = Job.objects.get_or_create(
            company=new_company, 
            name="En attente d'affectation", 
            defaults={"code": f"ATT-{new_company.code}", "max_workers": 999}
        )

        Loss.objects.create(person=assignment.person, year=assignment.year, unite=old_unite, company=old_company)
        Gain.objects.create(person=assignment.person, year=assignment.year, unite=new_unite, company=new_company)

        # Create the TransferHistory record
        TransferHistory.objects.create(
            assignment=assignment, 
            from_unite=old_unite, 
            to_unite=new_unite, 
            from_company=old_company, 
            to_company=new_company, 
            reason=reason
        )

        # Update the Assignment 
        assignment.job = pending_job
        assignment.save()

        return Response({"message": f"Transfert réussi vers la compagnie {new_company.name}."}, status=status.HTTP_200_OK)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related("person", "job", "year").all()
    serializer_class = AssignmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job', 'year', 'person', 'person__contract_type']
    search_fields = ['person__first_name', 'person__last_name', 'job__name']
    ordering_fields = ['created_at', 'year', 'job']

    def perform_create(self, serializer):
        assignment = serializer.save()
        job = assignment.job
        Gain.objects.create(person=assignment.person, year=assignment.year, unite=job.company.unite if job.company else None, company=job.company)

    def perform_destroy(self, instance):
        job = instance.job
        Loss.objects.create(person=instance.person, year=instance.year, unite=job.company.unite if job.company else None, company=job.company)
        instance.delete()

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

class UniteViewSet(viewsets.ModelViewSet):
    queryset = Unite.objects.all()
    serializer_class = UniteSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

    def list(self, request, *args, **kwargs):
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not isinstance(request.data, list):
            return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class YearViewSet(viewsets.ModelViewSet):
    queryset = Year.objects.all()
    serializer_class = YearSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['year', 'created_at']

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all()
    serializer_class = PersonSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'national_id']
    ordering_fields = ['last_name', 'first_name', 'created_at']

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        if not isinstance(request.data, list):
            return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GainViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gain.objects.select_related("person", "unite", "company", "year").all()
    serializer_class = GainSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['unite', 'company', 'year']

class LossViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Loss.objects.select_related("person", "unite", "company", "year").all()
    serializer_class = LossSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['unite', 'company', 'year']