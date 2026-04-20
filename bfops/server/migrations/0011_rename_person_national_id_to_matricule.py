from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("server", "0010_drop_legacy_global_job_name_constraint"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            # Keep database column as `national_id` to avoid destructive DB operations.
            database_operations=[],
            state_operations=[
                migrations.RenameField(
                    model_name="person",
                    old_name="national_id",
                    new_name="matricule",
                ),
                migrations.AlterField(
                    model_name="person",
                    name="matricule",
                    field=models.CharField(db_column="national_id", max_length=50, unique=True),
                ),
            ],
        ),
    ]
