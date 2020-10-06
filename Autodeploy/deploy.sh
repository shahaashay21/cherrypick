#!/bin/bash

kill -9 $(lsof -t -i:3005)
rm -rf /usr/src/autodeploy

mkdir /usr/src/autodeploy && cd /usr/src/autodeploy

curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/Autodeploy/package.json -o package.json -s
curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/Autodeploy/app.js -o app.js -s

npm install
nohup node app.js >> ../autodeploy.out 2>&1 &

mkdir /usr/src/cherry-pick && cd /usr/src/cherry-pick
rm docker-compose.yml
rm docker-webscraper.yml
curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/docker-compose.yml -o docker-compose.yml -s
curl -L https://raw.githubusercontent.com/shahaashay21/Cherry-Pick/master/docker-webscraper.yml -o docker-webscraper.yml -s

docker stop webscrape-container

docker rm webscrape-container

docker rmi cherry-pick_webapp

docker-compose up -d --no-recreate