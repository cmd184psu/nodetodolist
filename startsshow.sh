#!/bin/sh
cat dot-env-slideshow >.env
cp -v slideshow-data.json data.json
npm start

