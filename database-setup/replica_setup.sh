#!/bin/bash
set -e

# Solo si el directorio de datos está vacío, realiza el backup.
# Esto evita sobrescribir datos en reinicios del contenedor.
if [ -z "$(ls -A "$PGDATA")" ]; then
    echo "Starting base backup from primary..."
    PGPASSWORD=replicator pg_basebackup -h primary -D "$PGDATA" -U replicator --wal-method=stream -P
    echo "Base backup complete."
fi