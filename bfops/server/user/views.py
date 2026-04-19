from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User
from .serializers import (
    UserCreateSerializer,
    UserSerializer,
    FirstAdminBootstrapSerializer,
    ManagedAccountSerializer,
    ManagedAccountCreateSerializer,
    ManagedAccountPasswordSerializer,
    ForgotPasswordCheckSerializer,
    ForgotPasswordResetSerializer,
)

class IsAdminUserRole(BasePermission):

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '') == 'admin')

class CreateUserView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]

class CurrentUserView(RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class BootstrapFirstAdminView(CreateAPIView):
    serializer_class = FirstAdminBootstrapSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class ManagedAccountListCreateView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def get(self, request):
        users = User.objects.all().order_by('id')
        serializer = ManagedAccountSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ManagedAccountCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(ManagedAccountSerializer(user).data, status=status.HTTP_201_CREATED)


class ManagedAccountPasswordUpdateView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        serializer = ManagedAccountPasswordSerializer(data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class ManagedAccountDeleteView(APIView):
    permission_classes = (IsAuthenticated, IsAdminUserRole)

    def delete(self, request, user_id):
        user = get_object_or_404(User, id=user_id)

        if request.user.id == user.id:
            return Response({'detail': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        if user.role == 'admin' and User.objects.filter(role='admin').count() <= 1:
            return Response({'detail': 'You cannot delete the last admin account.'}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ForgotPasswordCheckView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        serializer = ForgotPasswordCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        user = serializer.context['user']

        if user.role == 'admin':
            return Response(
                {
                    'username': username,
                    'role': user.role,
                    'can_reset': True,
                    'message': 'This account is admin. You can set a new password.',
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'username': username,
                'role': user.role,
                'can_reset': False,
                'message': 'This account is guest. Please check with your manager.',
            },
            status=status.HTTP_200_OK,
        )


class ForgotPasswordResetView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        serializer = ForgotPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password changed successfully. You can login now.'}, status=status.HTTP_200_OK)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            

            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=refresh_token,
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

        return response

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_cookie = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh'))
        
        if refresh_cookie:
            data = request.data.copy()
            data['refresh'] = refresh_cookie
            request._full_data = data
            
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            rotated_refresh_token = response.data.get('refresh')
            
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )

            if rotated_refresh_token:
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                    value=rotated_refresh_token,
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )
        return response

class LogoutView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []
    
    def post(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh'))

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        return response

