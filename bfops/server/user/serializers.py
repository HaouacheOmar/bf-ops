from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'company']
        read_only_fields = ['id']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'role', 'company']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'viewer'),
            company=validated_data.get('company', None)
        )
        return user


class FirstAdminBootstrapSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password']

    def validate(self, attrs):
        if User.objects.filter(role='admin').exists():
            raise serializers.ValidationError('Bootstrap endpoint is disabled because an admin already exists.')
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            role='admin',
            is_staff=True,
            is_superuser=True,
        )
        return user


class ManagedAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role']
        read_only_fields = ['id']


class ManagedAccountCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='viewer')

    class Meta:
        model = User
        fields = ['username', 'password', 'role']

    def create(self, validated_data):
        role = validated_data.get('role', 'viewer')
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=role,
            is_staff=(role == 'admin'),
        )
        return user


class ManagedAccountPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=8)

    def save(self, **kwargs):
        user = self.context['user']
        user.set_password(self.validated_data['password'])
        user.save(update_fields=['password'])
        return user


class ForgotPasswordCheckSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('Username not found.') from exc

        self.context['user'] = user
        return value


class ForgotPasswordResetSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        username = attrs['username']
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError({'username': 'Username not found.'}) from exc

        if user.role != 'admin':
            raise serializers.ValidationError({'detail': 'Only admin accounts can reset password here.'})

        self.context['user'] = user
        return attrs

    def save(self, **kwargs):
        user = self.context['user']
        user.set_password(self.validated_data['password'])
        user.save(update_fields=['password'])
        return user
