#!/bin/bash

docker run \
  --rm \
  -d \
  --name sspc \
  -p 7980:8080 \
  -m 2G \
  --cpus=2 \
  server-side-page-capture 
