from django.urls import path
from .views import (
    CustomTokenObtainPairView, 
    CustomTokenRefreshView, 
    LogoutView,
    CreateUserView,
    CurrentUserView,
    BootstrapFirstAdminView,
    ManagedAccountListCreateView,
    ManagedAccountPasswordUpdateView,
    ManagedAccountDeleteView,
    ForgotPasswordCheckView,
    ForgotPasswordResetView,
)

urlpatterns = [
    path('bootstrap-first-admin/', BootstrapFirstAdminView.as_view(), name='bootstrap_first_admin'),
    path('forgot-password/check/', ForgotPasswordCheckView.as_view(), name='forgot_password_check'),
    path('forgot-password/reset/', ForgotPasswordResetView.as_view(), name='forgot_password_reset'),
    path('accounts/', ManagedAccountListCreateView.as_view(), name='managed_accounts'),
    path('accounts/<int:user_id>/password/', ManagedAccountPasswordUpdateView.as_view(), name='managed_account_update_password'),
    path('accounts/<int:user_id>/', ManagedAccountDeleteView.as_view(), name='managed_account_delete'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login_legacy'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='refresh_legacy'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', CreateUserView.as_view(), name='user_register'),
    path('me/', CurrentUserView.as_view(), name='user_me'),
]
