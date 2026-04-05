from django.db import migrations


def recreate_year_table_if_missing(apps, schema_editor):
    Year = apps.get_model("server", "Year")
    db_table = Year._meta.db_table
    existing_tables = schema_editor.connection.introspection.table_names()

    if db_table not in existing_tables:
        schema_editor.create_model(Year)


def noop_reverse(apps, schema_editor):
    # Intentionally no-op: this migration is a repair step.
    return


class Migration(migrations.Migration):

    dependencies = [
        ("server", "0004_remove_assignment_contract_type_remove_job_grade_and_more"),
    ]

    operations = [
        migrations.RunPython(recreate_year_table_if_missing, reverse_code=noop_reverse),
    ]
