from django.db import migrations


def _table_exists(cursor, table_name):
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = %s
        )
        """,
        [table_name],
    )
    return cursor.fetchone()[0]


def _table_columns(cursor, table_name):
    cursor.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = %s
        """,
        [table_name],
    )
    return {row[0] for row in cursor.fetchall()}


def _fk_exists(cursor, table_name, fk_name):
    cursor.execute(
        """
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = %s::regclass
          AND contype = 'f'
          AND conname = %s
        """,
        [table_name, fk_name],
    )
    return cursor.fetchone() is not None


def _repair_year_fk_for_table(schema_editor, table_name, fk_name):
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        if not _table_exists(cursor, table_name):
            return

        columns = _table_columns(cursor, table_name)

    if "year" in columns and "year_id" not in columns:
        schema_editor.execute(f"ALTER TABLE {table_name} RENAME COLUMN year TO year_id")

    with connection.cursor() as cursor:
        columns = _table_columns(cursor, table_name)

    if "year_id" not in columns:
        return

    schema_editor.execute(
        f"ALTER TABLE {table_name} ALTER COLUMN year_id TYPE bigint USING year_id::bigint"
    )

    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            SELECT COUNT(*)
            FROM {table_name} t
            JOIN server_year sy ON sy.id = t.year_id
            """
        )
        match_by_id = cursor.fetchone()[0]

        cursor.execute(
            f"""
            SELECT COUNT(*)
            FROM {table_name} t
            JOIN server_year sy ON sy.year = t.year_id
            """
        )
        match_by_year_number = cursor.fetchone()[0]

    if match_by_year_number > match_by_id:
        schema_editor.execute(
            f"""
            INSERT INTO server_year (year, total_quota, is_closed, created_at)
            SELECT DISTINCT t.year_id, 0, FALSE, NOW()
            FROM {table_name} t
            LEFT JOIN server_year sy ON sy.year = t.year_id
            WHERE sy.id IS NULL
            """
        )
        schema_editor.execute(
            f"""
            UPDATE {table_name} t
            SET year_id = sy.id
            FROM server_year sy
            WHERE sy.year = t.year_id
              AND t.year_id <> sy.id
            """
        )

    with connection.cursor() as cursor:
        fk_exists = _fk_exists(cursor, table_name, fk_name)

    if not fk_exists:
        schema_editor.execute(
            f"""
            ALTER TABLE {table_name}
            ADD CONSTRAINT {fk_name}
            FOREIGN KEY (year_id)
            REFERENCES server_year(id)
            DEFERRABLE INITIALLY DEFERRED
            """
        )


def repair_remaining_year_fks(apps, schema_editor):
    _repair_year_fk_for_table(
        schema_editor,
        table_name="server_assignment",
        fk_name="server_assignment_year_id_fk",
    )
    _repair_year_fk_for_table(
        schema_editor,
        table_name="server_gain",
        fk_name="server_gain_year_id_fk",
    )
    _repair_year_fk_for_table(
        schema_editor,
        table_name="server_loss",
        fk_name="server_loss_year_id_fk",
    )


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ("server", "0007_repair_unitequota_year_fk_column"),
    ]

    operations = [
        migrations.RunPython(repair_remaining_year_fks, reverse_code=noop_reverse),
    ]
