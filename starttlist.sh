#!/bin/sh

if [ -e UPDATE ]; then
	cat dot-env-todo >.env
	cp -v todo-data.json data.json
fi
npm start

