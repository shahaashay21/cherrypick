#!/bin/bash

kill -9 $(lsof -t -i:3005)
rm -rf /usr/src/Autodeploy

mkdir /usr/src/Autodeploy && cd /usr/src/Autodeploy

curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/Autodeploy/package.json -o package.json -s
curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/Autodeploy/app.js -o app.js -s

npm install
nohup node app.js >> ../autodeploy.out 2>&1 &

rm -rf /usr/src/cherry-pick
mkdir /usr/src/cherry-pick && cd /usr/src/cherry-pick
curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/docker-compose.yml -o docker-compose.yml -s
curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/docker-webscraper.yml -o docker-webscraper.yml -s

docker stop webscrape-container
docker stop mongo-container

docker rm webscrape-container
docker rm mongo-container

docker rmi cherry-pick_webapp

docker-compose up -d