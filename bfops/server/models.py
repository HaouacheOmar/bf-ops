from django.db import models

class Grade(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    rating = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-rating", "name"]

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
        on_delete=models.SET_NULL,
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
        on_delete=models.CASCADE,
        related_name="jobs"
    )
    grades = models.ManyToManyField(
            Grade,
            blank=True,
            related_name="jobs"
        )
    max_workers = models.PositiveIntegerField()
    is_in_quota = models.BooleanField(default=True)
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


class UniteQuota(models.Model):
    year = models.PositiveIntegerField(db_index=True, db_column="year_id")
    unite = models.ForeignKey(Unite, on_delete=models.CASCADE, related_name="unite_quotas")
    quota = models.PositiveIntegerField()

    class Meta:
        unique_together = ("year", "unite")
        ordering = ["year", "unite"]

    def __str__(self):
        return f"{self.year} - {self.unite.name}: {self.quota}"


class Person(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    matricule = models.CharField(max_length=50, unique=True, db_column="national_id")
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
            ("reserve", "Reserve"),
        ),
        default="actif"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def national_id(self):
        # Keep legacy attribute compatibility while the canonical field is matricule.
        return self.matricule

    @national_id.setter
    def national_id(self, value):
        self.matricule = value

class Assignment(models.Model):
    person = models.ForeignKey(
        Person,
        on_delete=models.CASCADE,
        related_name="assignments"
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="assignments"
    )
    year = models.PositiveIntegerField(db_index=True, db_column="year_id", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("person", "year")
        indexes = [
            models.Index(fields=["job", "year"]),
        ]

    def __str__(self):
        return f"{self.person} - {self.job} - {self.year if self.year is not None else 'No FY'}"


class TransferHistory(models.Model):
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name="transfers"
    )

    from_unite = models.ForeignKey(
        'Unite',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transfers_from'
    )
    to_unite = models.ForeignKey(
        'Unite',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transfers_to'
    )
    transfer_date = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-transfer_date"]

    def __str__(self):
        return f"{self.assignment.person} moved"


class Gain(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="gains")
    year = models.PositiveIntegerField(db_index=True, db_column="year_id", null=True, blank=True)
    unite = models.ForeignKey(Unite, on_delete=models.SET_NULL, null=True, blank=True, related_name="gains")
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="gains")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Gain: {self.person} - {self.unite.name if self.unite else 'N/A'}"

class Loss(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="losses")
    year = models.PositiveIntegerField(db_index=True, db_column="year_id", null=True, blank=True)
    unite = models.ForeignKey(Unite, on_delete=models.SET_NULL, null=True, blank=True, related_name="losses")
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="losses")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Loss: {self.person} - {self.unite.name if self.unite else 'N/A'}"