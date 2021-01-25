#!/bin/sh


LIST_PREFIX=$1

if [ -z "$LIST_PREFIX" ]; then
	LIST_PREFIX="archive-lists"
fi


# step one, create encrypted backup of lists
echo ".... Archving lists with encryption ...."
(cd lists && encdir.sh json ../${LIST_PREFIX}.tgz | sh)
echo

echo ".... Fixing Name ...."
M=`which multiren`

if [ -z "$M" ]; then
    echo "Please install and compile multiren" >&1
    exit 1
fi

multiren -filename ${LIST_PREFIX}.tgz.enc | sh
echo

echo ".... Moving to G-drive ...."


if ! [ -e $HOME/.gdrive ]; then
	echo "missing ~/.gdrive"
	echo " probably want $HOME/ExistingGdrive or /media/gdrive in ~/.gdrive" >&2
	exit 1
fi

GDRIVE=`cat $HOME/.gdrive`

if ! [ -e ${GDRIVE}/todoarch/ ]; then 
    echo "ERR: symlink broken or gdrive not mounted" >&2
    exit 1
fi

mv -vf ${LIST_PREFIX}*.tgz.enc ${GDRIVE}/todoarch/

