#!/usr/bin/env bash
docker stop $(docker ps --filter status=running -q)
docker rm $(docker ps -aq)
docker volume rm $(docker volume ls -q --filter dangling=true)
docker rmi $(docker images -a -q)
