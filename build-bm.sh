#!/bin/bash -e
#
############################################################

SERVER=spinoza.brightblock.org;
DOCKER_NAME=sip18_forum_api


printf "\n\n"
printf "====================================================\n"
printf "Building on: $SERVER as docker container: $DOCKER_NAME \n"

source ~/.profile;
#cd ~/hubgit/sip18forum/sip18-forum-api
#git pull https://github.com/radicleart/sip18-forum-api.git daoless
docker login;
docker build --build-arg NODE_ENV=testnet -t mijoco/sip18_forum_api:latest .
docker push mijoco/sip18_forum_api:latest
docker rm -f sip18_forum_api
docker run -d -t -i --network host -e NODE_ENV=testnet --env-file ~/.env --name $DOCKER_NAME -p 6090:6090 mijoco/sip18_forum_api:latest
docker logs -f $DOCKER_NAME

printf "Finished....\n"
printf "====================================================\n\n"

exit 0;

docker build --build-arg NODE_ENV=testnet -t mijoco/sip18_forum_api:latest .
docker push mijoco/sip18_forum_api:latest
docker rm -f sip18_forum_api
docker run -d -t -i --network host -e NODE_ENV=testnet --env-file ~/.env --name $DOCKER_NAME -p 6090:6090 mijoco/sip18_forum_api:latest
