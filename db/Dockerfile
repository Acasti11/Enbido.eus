FROM mysql:8.0

COPY init/ /docker-entrypoint-initdb.d/
COPY conf.d/primary.cnf /etc/mysql/conf.d/primary.cnf

EXPOSE 3306

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
CMD mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} || exit 1