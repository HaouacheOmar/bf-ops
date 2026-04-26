from django.db import migrations, models


def remap_year_ids_to_values(apps, schema_editor):
    Year = apps.get_model("server", "Year")
    year_lookup = dict(Year.objects.values_list("id", "year"))

    for model_name in ("UniteQuota", "Assignment", "Gain", "Loss"):
        Model = apps.get_model("server", model_name)
        for instance in Model.objects.all().iterator():
            mapped_year = year_lookup.get(instance.year, instance.year)
            if mapped_year != instance.year:
                Model.objects.filter(pk=instance.pk).update(year=mapped_year)


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("server", "0011_rename_person_national_id_to_matricule"),
    ]

    operations = [
        migrations.AlterField(
            model_name="assignment",
            name="year",
            field=models.PositiveIntegerField(db_column="year_id", db_index=True),
        ),
        migrations.AlterField(
            model_name="gain",
            name="year",
            field=models.PositiveIntegerField(db_column="year_id", db_index=True),
        ),
        migrations.AlterField(
            model_name="loss",
            name="year",
            field=models.PositiveIntegerField(db_column="year_id", db_index=True),
        ),
        migrations.AlterField(
            model_name="unitequota",
            name="year",
            field=models.PositiveIntegerField(db_column="year_id", db_index=True),
        ),
        migrations.RunPython(remap_year_ids_to_values, reverse_code=noop_reverse),
        migrations.DeleteModel(
            name="Year",
        ),
    ]
