#!/bin/sh

EP=http://localhost:8989

echo "config Test"
curl -ss ${EP}/config' | jq .
