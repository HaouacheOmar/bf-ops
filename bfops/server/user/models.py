from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	ROLE_CHOICES = (
		("admin", "Admin"),
		("viewer", "Viewer"),
	)

	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="viewer")
	company = models.ForeignKey(
		"server.Company",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
	)

	def __str__(self):
		return self.username
