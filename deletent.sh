#!/bin/sh

F=`echo ${1} | cut -f 2 -d '/'`
P=`echo ${1} | cut -f 1 -d '/'`


if ! [ -z "$F" ]; then
	echo $F
	echo "mv -v ${P}/${F} ${P}/_${F}"
fi

n=`cat data.json | jq '.deleted |length'`
P=`cat data.json | jq .prefix | cut -f 2 -d '"'`
for((i=0; i<n; i++)); do
	filename=`cat data.json | jq '.deleted['$i']' | cut -f 2 -d '"'`

	echo "if [ -e ${P}/${filename} ]; then"
	echo "mv -v ${P}/${filename} ${P}/_${filename}"
	echo "else"
	echo '  echo file was missing '${P}/${filename}' '
	echo "fi"
done
echo "cat data.json | jq 'del(.deleted)' > data.json.new"
echo "mv -v data.json.new data.json"
