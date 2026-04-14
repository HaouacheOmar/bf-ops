from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("server", "0008_repair_remaining_year_fk_columns"),
    ]

    operations = [
        migrations.AlterField(
            model_name="job",
            name="name",
            field=models.CharField(max_length=200),
        ),
        migrations.AddConstraint(
            model_name="job",
            constraint=models.UniqueConstraint(
                fields=("company", "name"),
                name="unique_job_name_per_company",
            ),
        ),
    ]
