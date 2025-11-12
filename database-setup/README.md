PostgreSQL HA Cluster with Docker Compose
This project deploys a high-availability PostgreSQL cluster with one primary (write) instance and two replicas (read-only) using Docker Compose. The setup utilizes native PostgreSQL streaming replication.

1. Deployment
To deploy the cluster, navigate to the project root directory where your docker-compose.yml file is located and run the following command.

This command builds the Docker images, creates the containers, and starts them in detached mode. The --build flag ensures that the images are rebuilt from their Dockerfiles, incorporating any recent changes.

Bash

docker-compose up --build -d

2. Database Seeding
After the cluster is up and running, you can populate the database with your schema and data. This command executes a SQL script from your local machine inside the primary PostgreSQL container.

docker exec: Executes a command inside a running container.

-i: Keeps STDIN open, allowing the command to read the content of your SQL file.

postgres_primary: The name of the primary container.

psql -U admin -d mydb: The PostgreSQL client command to connect to the mydb database with the admin user.

< seed.sql: Redirects the local seed.sql file as standard input to the psql command.

Bash

docker exec -i postgres_primary psql -U admin -d mydb < seed.sql

3. Interactive Connection
To manually inspect the database, run queries, or troubleshoot issues, you can start an interactive psql session inside the primary container.

docker exec: Executes a command in a running container.

-it: The combination of flags creates an interactive terminal session.

postgres_primary: The name of the target container.

psql -U admin -d mydb: Connects to the mydb database with the admin user.

Bash

docker exec -it postgres_primary psql -U admin -d mydb

4. Clean Installation / Troubleshooting
If you encounter errors or need to start from scratch, you must completely remove all associated Docker resources.

This command stops and removes all containers, networks, and, most importantly, the data volumes associated with the services. This ensures that no corrupted or old data persists from a previous run.

Bash

docker-compose down -v
After running this command, you can safely re-run the deployment command from Step 1 to start with a fresh, clean installation.