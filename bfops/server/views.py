from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import TransferHistory
from .serializers import TransferHistorySerializer
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache

from .models import Assignment, Company, Job, Year, Person, Grade, Unite
from .serializers import AssignmentSerializer, CompanySerializer, JobSerializer, YearSerializer, PersonSerializer, GradeSerializer, UniteSerializer


@api_view(["POST"])
def bulk_create_jobs(request):
	if not isinstance(request.data, list):
		return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)
	from .serializers import JobSerializer
	serializer = JobSerializer(data=request.data, many=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
def bulk_create_persons(request):
	if not isinstance(request.data, list):
		return Response({"error": "Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)
	serializer = PersonSerializer(data=request.data, many=True)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
from rest_framework import generics
from .models import Assignment, Company, Job, Year, Person, Grade, Unite, UniteQuota
from .serializers import AssignmentSerializer, CompanySerializer, JobSerializer, YearSerializer, PersonSerializer, GradeSerializer, UniteSerializer, UniteQuotaSerializer

class UniteQuotaListCreateView(generics.ListCreateAPIView):
	queryset = UniteQuota.objects.select_related("year", "unite").all()
	serializer_class = UniteQuotaSerializer

class UniteQuotaDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = UniteQuota.objects.all()
	serializer_class = UniteQuotaSerializer

# List/Create:   /api/transfers/   (GET, POST)
# Detail:        /api/transfers/<id>/   (GET, PUT, PATCH, DELETE)
class TransferHistoryListCreateView(generics.ListCreateAPIView):
	queryset = TransferHistory.objects.select_related("assignment", "from_unite", "to_unite").all()
	serializer_class = TransferHistorySerializer
	filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
	filterset_fields = {
		'assignment': ['exact'],
		'assignment__person': ['exact'],
		'assignment__job': ['exact'],
		'assignment__year': ['exact'],
		'from_unite': ['exact'],
		'to_unite': ['exact'],
	}
	search_fields = ['reason']
	ordering_fields = ['transfer_date', 'from_unite', 'to_unite']

class TransferHistoryDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = TransferHistory.objects.all()
	serializer_class = TransferHistorySerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from .services.stats import job_statistics, unite_statistics
# --- Statistics API ---
class JobStatsView(APIView):
	def get(self, request):
		year_id = request.query_params.get('year_id')
		if not year_id:
			return Response({"error": "year_id is required"}, status=400)
		stats = job_statistics(year_id)
		return Response(stats)

class UniteStatsView(APIView):
	def get(self, request):
		year_id = request.query_params.get('year_id')
		if not year_id:
			return Response({"error": "year_id is required"}, status=400)
		stats = unite_statistics(year_id)
		return Response(stats)




# List/Create:   /api/assignments/   (GET, POST)
# Detail:        /api/assignments/<id>/   (GET, PUT, PATCH, DELETE)
class AssignmentListCreateView(generics.ListCreateAPIView):
	queryset = Assignment.objects.select_related(
		"person", "job", "year"
	).all()
	serializer_class = AssignmentSerializer
	filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
	filterset_fields = {
		'job': ['exact'],
		'year': ['exact'],
		'person': ['exact'],
		'contract_type': ['exact'],
	}
	search_fields = ['person__first_name', 'person__last_name', 'job__name']
	ordering_fields = ['created_at', 'year', 'job']
class GradeListCreateView(generics.ListCreateAPIView):
	queryset = Grade.objects.all()
	serializer_class = GradeSerializer
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ['name', 'code']
	ordering_fields = ['name', 'created_at']

class GradeDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Grade.objects.all()
	serializer_class = GradeSerializer

class UniteListCreateView(generics.ListCreateAPIView):
	queryset = Unite.objects.all()
	serializer_class = UniteSerializer
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ['name', 'code']
	ordering_fields = ['name', 'created_at']

class UniteDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Unite.objects.all()
	serializer_class = UniteSerializer

	def list(self, request, *args, **kwargs):
		key = f"assignments:{hash(frozenset(request.query_params.items()))}"
		data = cache.get(key)
		if data is None:
			response = super().list(request, *args, **kwargs)
			cache.set(key, response.data, timeout=60)
			return response
		return Response(data)


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Assignment.objects.all()
	serializer_class = AssignmentSerializer

# List/Create:   /api/companies/   (GET, POST)
# Detail:        /api/companies/<id>/   (GET, PUT, PATCH, DELETE)
class CompanyListCreateView(generics.ListCreateAPIView):
	queryset = Company.objects.all()
	serializer_class = CompanySerializer
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ['name', 'code']
	ordering_fields = ['name', 'created_at']

class CompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Company.objects.all()
	serializer_class = CompanySerializer



# List/Create:   /api/jobs/   (GET, POST)
# Detail:        /api/jobs/<id>/   (GET, PUT, PATCH, DELETE)
class JobListCreateView(generics.ListCreateAPIView):
	queryset = Job.objects.all()
	serializer_class = JobSerializer
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ['name', 'code']
	ordering_fields = ['name', 'created_at']

class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Job.objects.all()
	serializer_class = JobSerializer

# List/Create:   /api/years/   (GET, POST)
# Detail:        /api/years/<id>/   (GET, PUT, PATCH, DELETE)
class YearListCreateView(generics.ListCreateAPIView):
	queryset = Year.objects.all()
	serializer_class = YearSerializer
	filter_backends = [filters.OrderingFilter]
	ordering_fields = ['year', 'created_at']

class YearDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Year.objects.all()
	serializer_class = YearSerializer

# List/Create:   /api/persons/   (GET, POST)
# Detail:        /api/persons/<id>/   (GET, PUT, PATCH, DELETE)
class PersonListCreateView(generics.ListCreateAPIView):
	queryset = Person.objects.all()
	serializer_class = PersonSerializer
	filter_backends = [filters.SearchFilter, filters.OrderingFilter]
	search_fields = ['first_name', 'last_name', 'national_id']
	ordering_fields = ['last_name', 'first_name', 'created_at']

class PersonDetailView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Person.objects.all()
	serializer_class = PersonSerializer
