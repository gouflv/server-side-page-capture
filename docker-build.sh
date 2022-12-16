#!/bin/bash

tag_name=server-side-page-capture

docker rmi $tag_name

docker build -t $tag_name .
