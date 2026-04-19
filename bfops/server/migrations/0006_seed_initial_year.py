from datetime import date

from django.db import migrations


def seed_initial_year_if_empty(apps, schema_editor):
    Year = apps.get_model("server", "Year")
    if not Year.objects.exists():
        Year.objects.create(
            year=date.today().year,
            total_quota=0,
            is_closed=False,
        )


def noop_reverse(apps, schema_editor):
    # Data-safe no-op reverse for initial seeding.
    return


class Migration(migrations.Migration):

    dependencies = [
        ("server", "0005_recreate_missing_year_table"),
    ]

    operations = [
        migrations.RunPython(seed_initial_year_if_empty, reverse_code=noop_reverse),
    ]
