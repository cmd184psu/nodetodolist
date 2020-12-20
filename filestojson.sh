#!/bin/sh

# usage: ./filestojson.sh > jpg.json

find . -iname "*.jpg" -follow | grep -iv recycle | sort > filelisting.txt

LEN=`cat filelisting.txt | wc -l`

i=0
echo "["
while IFS= read -r line; do
    
    line=${line:2}
    echo "\"$line\""

    if [ $i -lt `expr $LEN - 1` ]; then   
        echo ","
    fi    
    #echo "$i :: $line"



#    if [ "$i" == "0" ]; then
#       echo "terminate early, just testing"
#        exit 0
#    fi

    i=`expr ${i} + 1`
done < filelisting.txt

echo "]"
