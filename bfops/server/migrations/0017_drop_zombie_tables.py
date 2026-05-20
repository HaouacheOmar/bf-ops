from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('server', '0016_alter_assignment_options_alter_unitequota_options_and_more'),
    ]

    operations = [
        migrations.RunSQL("DROP TABLE IF EXISTS server_jobcompany;"),
    ]
