# Usa una imagen base de PostgreSQL.
FROM postgres:latest
# Establece el directorio de trabajo dentro del contenedor
WORKDIR /docker-entrypoint-initdb.d
# Copia los scripts de configuración
COPY primary_setup.sh .
COPY replica_setup.sh .
# Expone el puerto por defecto de PostgreSQL
EXPOSE 5432
# Establece los permisos correctos para los scripts
RUN chmod +x primary_setup.sh replica_setup.sh
# Definimos el comando por defecto al iniciar el contenedor.
# Esto no se usa en la práctica, pero es una buena práctica para las imágenes de Docker
CMD ["postgres"]