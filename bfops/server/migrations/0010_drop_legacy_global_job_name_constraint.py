from django.db import migrations


def drop_legacy_global_job_name_constraint(apps, schema_editor):
    # Legacy databases may still contain this global unique constraint,
    # which blocks having the same job name across multiple companies.
    if schema_editor.connection.vendor != "postgresql":
        return

    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "ALTER TABLE server_job DROP CONSTRAINT IF EXISTS server_job_name_key;"
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("server", "0009_allow_duplicate_job_names_across_companies"),
    ]

    operations = [
        migrations.RunPython(
            drop_legacy_global_job_name_constraint,
            noop_reverse,
        ),
    ]
