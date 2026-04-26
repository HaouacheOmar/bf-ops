from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("server", "0012_remove_year_model"),
    ]

    operations = [
        migrations.AlterField(
            model_name="assignment",
            name="year",
            field=models.PositiveIntegerField(blank=True, db_column="year_id", db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="gain",
            name="year",
            field=models.PositiveIntegerField(blank=True, db_column="year_id", db_index=True, null=True),
        ),
        migrations.AlterField(
            model_name="loss",
            name="year",
            field=models.PositiveIntegerField(blank=True, db_column="year_id", db_index=True, null=True),
        ),
    ]
