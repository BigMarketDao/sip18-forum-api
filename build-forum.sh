#!/bin/bash -e
#
# Usage: ./deploy.sh testnet
#        ./deploy.sh mainnet

NETWORK=$1
if [ -z "$NETWORK" ]; then
  echo "Usage: $0 [testnet|mainnet]"
  exit 1
fi

DOCKER_NAME=sip18_forum_api_${NETWORK}


printf "\n\n"
printf "====================================================\n"
printf "Building on: as docker container: $DOCKER_NAME \n"

source ~/.profile

docker login
docker build --build-arg NODE_ENV=$NETWORK -t mijoco/sip18_forum_api:$NETWORK .
docker push mijoco/sip18_forum_api:$NETWORK
docker rm -f $DOCKER_NAME || true

# Use different ports if needed (e.g. 6080 for testnet, 6081 for mainnet)
PORT="6080"
if [ "$NETWORK" = "mainnet" ]; then
  PORT="6081"
fi

docker run -d -t -i \
  --network host \
  -e NODE_ENV=$NETWORK \
  --env-file ~/.env \
  --name $DOCKER_NAME \
  -p $PORT:6090 \
  mijoco/sip18_forum_api:$NETWORK

docker logs -f $DOCKER_NAME

printf "Finished....\n"
printf "====================================================\n\n"

exit 0;
