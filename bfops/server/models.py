from django.db import models

class Grade(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class Unite(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class Company(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=50, unique=True)
    unite = models.ForeignKey(
        Unite,
        on_delete=models.CASCADE,  # CASCADE to delete companies and jobs when Unite is deleted
        null=True,
        blank=True,
        related_name="companies"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

class Job(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,  # CASCADE so jobs delete when Company deletes
        null=True,
        blank=True,
        related_name="jobs"
    )
    grade = models.ForeignKey(Grade, on_delete=models.SET_NULL, null=True, blank=True)
    max_workers = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"],
                name="unique_job_name_per_company",
            ),
        ]

    def __str__(self):
        return self.name

class Year(models.Model):
    year = models.IntegerField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-year"]

    def __str__(self):
        return str(self.year)

class UniteQuota(models.Model):
    year = models.ForeignKey(Year, on_delete=models.CASCADE, related_name="quotas")
    unite = models.ForeignKey(Unite, on_delete=models.CASCADE, related_name="quotas")
    quota = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("year", "unite")
        ordering = ["-year", "unite__name"]

    def __str__(self):
        return f"{self.unite.name} - {self.year.year}: {self.quota}"

class Person(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    national_id = models.CharField(max_length=50, unique=True)
    grade = models.ForeignKey(
        Grade,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="persons"
    )
    unite = models.ForeignKey(
        Unite,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="persons"
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="persons"
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="persons"
    )
    contract_type = models.CharField(
        max_length=20,
        choices=(
            ("actif", "Actif"),
            ("contractuel", "Contractuel"),
        ),
        default="actif"
    )
    CONTRACT_CHOICES = [
        ('actif', 'Actif'),
        ('contractuel', 'Contractuel'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    national_id = models.CharField(max_length=50, unique=True)
    contract_type = models.CharField(max_length=20, choices=CONTRACT_CHOICES, default='actif')
    grade = models.ForeignKey(Grade, on_delete=models.SET_NULL, null=True, blank=True, related_name="persons")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.national_id})"

class Assignment(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="assignments")
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="assignments")
    year = models.ForeignKey(Year, on_delete=models.CASCADE, related_name="assignments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("person", "year")
        ordering = ["-year", "job"]

    def __str__(self):
        return f"{self.person} -> {self.job} ({self.year})"

class TransferHistory(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="transfers")
    
    from_unite = models.ForeignKey(Unite, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_out")
    to_unite = models.ForeignKey(Unite, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_in")
    
    from_company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_out")
    to_company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="transfers_in")
    
    transfer_date = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-transfer_date"]

    def __str__(self):
        return f"{self.assignment.person} moved"

class Gain(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="gains")
    year = models.ForeignKey(Year, on_delete=models.CASCADE, related_name="gains")
    unite = models.ForeignKey(Unite, on_delete=models.SET_NULL, null=True, blank=True, related_name="gains")
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="gains")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Gain: {self.person} - {self.unite.name if self.unite else 'N/A'}"

class Loss(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="losses")
    year = models.ForeignKey(Year, on_delete=models.CASCADE, related_name="losses")
    unite = models.ForeignKey(Unite, on_delete=models.SET_NULL, null=True, blank=True, related_name="losses")
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="losses")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Loss: {self.person} - {self.unite.name if self.unite else 'N/A'}"