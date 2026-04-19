from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'assignments', views.AssignmentViewSet, basename='assignment')
router.register(r'companies', views.CompanyViewSet, basename='company')
router.register(r'jobs', views.JobViewSet, basename='job')
router.register(r'years', views.YearViewSet, basename='year')
router.register(r'persons', views.PersonViewSet, basename='person')
router.register(r'grades', views.GradeViewSet, basename='grade')
router.register(r'unites', views.UniteViewSet, basename='unite')
router.register(r'unite-quotas', views.UniteQuotaViewSet, basename='unitequota')
router.register(r'transfers', views.TransferHistoryViewSet, basename='transferhistory')
router.register(r'gains', views.GainViewSet, basename='gain')
router.register(r'losses', views.LossViewSet, basename='loss')

urlpatterns = [
    path('', include(router.urls)),

    path('transfers-execute/', views.execute_transfer, name='execute-transfer'),
    path('transfers-suggestions/', views.transfer_suggestions, name='transfer-suggestions'),
    
    path('stats/jobs/', views.JobStatsView.as_view(), name='job-stats'),
    path('stats/unites/', views.UniteStatsView.as_view(), name='unite-stats'),
    path('stats/companies/', views.company_stats_view, name='company-stats'),

    path('job-statistics/', views.JobStatsView.as_view(), name='job-statistics'),
    path('service-statistics/', views.UniteStatsView.as_view(), name='service-statistics'),
    path('company-statistics/', views.company_stats_view, name='company-statistics'),
]