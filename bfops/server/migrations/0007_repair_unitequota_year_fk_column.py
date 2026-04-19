from django.db import migrations


def repair_unitequota_year_fk(apps, schema_editor):
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_name = %s
            )
            """,
            ["server_unitequota"],
        )
        table_exists = cursor.fetchone()[0]

    if not table_exists:
        return

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = %s
            """,
            ["server_unitequota"],
        )
        columns = {row[0] for row in cursor.fetchall()}

    # Old broken schema used integer column `year` instead of FK column `year_id`.
    if "year" in columns and "year_id" not in columns:
        schema_editor.execute(
            "ALTER TABLE server_unitequota RENAME COLUMN year TO year_id"
        )

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = %s
            """,
            ["server_unitequota"],
        )
        columns = {row[0] for row in cursor.fetchall()}

    if "year_id" not in columns:
        return

    # Ensure type matches referenced PK type on server_year.id (bigint).
    schema_editor.execute(
        "ALTER TABLE server_unitequota ALTER COLUMN year_id TYPE bigint USING year_id::bigint"
    )

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM server_unitequota uq
            JOIN server_year sy ON sy.id = uq.year_id
            """
        )
        match_by_id = cursor.fetchone()[0]

        cursor.execute(
            """
            SELECT COUNT(*)
            FROM server_unitequota uq
            JOIN server_year sy ON sy.year = uq.year_id
            """
        )
        match_by_year_number = cursor.fetchone()[0]

    # If values look like calendar years, map them to proper FK ids.
    if match_by_year_number > match_by_id:
        schema_editor.execute(
            """
            INSERT INTO server_year (year, total_quota, is_closed, created_at)
            SELECT DISTINCT uq.year_id, 0, FALSE, NOW()
            FROM server_unitequota uq
            LEFT JOIN server_year sy ON sy.year = uq.year_id
            WHERE sy.id IS NULL
            """
        )
        schema_editor.execute(
            """
            UPDATE server_unitequota uq
            SET year_id = sy.id
            FROM server_year sy
            WHERE sy.year = uq.year_id
              AND uq.year_id <> sy.id
            """
        )

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'server_unitequota'::regclass
              AND contype = 'f'
              AND conname = %s
            """,
            ["server_unitequota_year_id_fk"],
        )
        fk_exists = cursor.fetchone() is not None

    if not fk_exists:
        schema_editor.execute(
            """
            ALTER TABLE server_unitequota
            ADD CONSTRAINT server_unitequota_year_id_fk
            FOREIGN KEY (year_id)
            REFERENCES server_year(id)
            DEFERRABLE INITIALLY DEFERRED
            """
        )


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("server", "0006_seed_initial_year"),
    ]

    operations = [
        migrations.RunPython(repair_unitequota_year_fk, reverse_code=noop_reverse),
    ]
