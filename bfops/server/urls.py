from django.urls import path
from .views import (
    AssignmentListCreateView, AssignmentDetailView,
    CompanyListCreateView, CompanyDetailView,
    JobListCreateView, JobDetailView,
    YearListCreateView, YearDetailView,
    PersonListCreateView, PersonDetailView,
    GradeListCreateView, GradeDetailView,
    UniteListCreateView, UniteDetailView,
    TransferHistoryListCreateView, TransferHistoryDetailView,
    JobStatsView, UniteStatsView,
)

urlpatterns = [
    path('assignments/', AssignmentListCreateView.as_view(), name='assignment-list-create'),
    path('assignments/<int:pk>/', AssignmentDetailView.as_view(), name='assignment-detail'),
    path('companies/', CompanyListCreateView.as_view(), name='company-list-create'),
    path('companies/<int:pk>/', CompanyDetailView.as_view(), name='company-detail'),
    path('jobs/', JobListCreateView.as_view(), name='job-list-create'),
    path('jobs/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('years/', YearListCreateView.as_view(), name='year-list-create'),
    path('years/<int:pk>/', YearDetailView.as_view(), name='year-detail'),
    path('persons/', PersonListCreateView.as_view(), name='person-list-create'),
    path('persons/<int:pk>/', PersonDetailView.as_view(), name='person-detail'),
    path('grades/', GradeListCreateView.as_view(), name='grade-list-create'),
    path('grades/<int:pk>/', GradeDetailView.as_view(), name='grade-detail'),
    path('unites/', UniteListCreateView.as_view(), name='unite-list-create'),
    path('unites/<int:pk>/', UniteDetailView.as_view(), name='unite-detail'),
    path('transfers/', TransferHistoryListCreateView.as_view(), name='transferhistory-list-create'),
    path('transfers/<int:pk>/', TransferHistoryDetailView.as_view(), name='transferhistory-detail'),
    path('stats/jobs/', JobStatsView.as_view(), name='job-stats'),
    path('stats/unites/', UniteStatsView.as_view(), name='unite-stats'),

    # Add endpoints to match frontend
    path('job-statistics/', JobStatsView.as_view(), name='job-statistics'),
    path('service-statistics/', UniteStatsView.as_view(), name='service-statistics'),
    path('company-statistics/', UniteStatsView.as_view(), name='company-statistics'),
]

