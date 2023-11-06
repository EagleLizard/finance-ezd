
up-db:
	docker-compose -f ./local-db/docker-compose.yml up -d --remove-orphans
down-db:
	docker-compose -f ./local-db/docker-compose.yml down --rmi all
