#!/bin/sh
cat dot-env-todo >.env
cp -v todo-data.json data.json
npm start

