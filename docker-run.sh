#!/bin/bash

docker run \
  --rm \
  -d \
  -p 7980:8080 \
  server-side-page-capture 
