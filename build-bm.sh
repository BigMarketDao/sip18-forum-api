#!/bin/bash -e
#
############################################################

SERVER=spinoza.brightblock.org;
DOCKER_NAME=bigmarket_api


printf "\n\n"
printf "====================================================\n"
printf "Building on: $SERVER as docker container: $DOCKER_NAME \n"

source ~/.profile;
#cd ~/hubgit/bigmarket/bigmarket-api
#git pull https://github.com/radicleart/bigmarket-api.git daoless
docker login;
docker build --build-arg NODE_ENV=testnet -t $DOCKER_NAME .
docker tag mijoco/bigmarket_api mijoco/bigmarket_api
docker push mijoco/bigmarket_api:latest

#docker pull mijoco/bigmarket_api;
docker rm -f bigmarket_api  
docker run -d -t -i --network host -e NODE_ENV=testnet --env-file ~/.env --name $DOCKER_NAME -p 6070:6070 $DOCKER_NAME
docker logs -f $DOCKER_NAME

printf "Finished....\n"
printf "====================================================\n\n"

exit 0;

