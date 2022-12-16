#!/bin/bash

docker run \
  --rm \
  -d \
  --name sspc \
  -p 7980:8080 \
  server-side-page-capture 
