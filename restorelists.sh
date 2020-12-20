#!/bin/sh

# step one, create new directory to hold restored lists

#if [ -e restored-lists ]; then
#	echo "ERR: restored-lists/ already exists; delete this directory prior to execution" >&2
#	exit 1
#fi


#mkdir restored-lists
#echo "when done, compare lists/ with restored-lists/"
#echo

FILENAME=`basename $1`
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


if [ -z "$FILENAME" ]; then
	echo "ERR: Missing archive to retore lists from" >&2
	echo " probably want archive-lists-somedate.tgz.enc (see $GDRIVE/todoarch/*.enc)" >&2
	exit 1
fi

if ! [ -e $GDRIVE/todoarch/$FILENAME ]; then
	echo "ERR: Filename $GDRIVE/todoarch/$FILENAME does not exist"
	exit 1
fi

# at this point, gdrive is mounted; valid filename to decrypt and unpack identified; restore-lists is created

decdir.sh $GDRIVE/todoarch/$FILENAME | sh


exit 0


echo ".... Archving lists with encryption ...."
(cd lists && encdir.sh json ../archive-lists.tgz | sh)
echo

echo ".... Fixing Name ...."
M=`which multiren`

if [ -z "$M" ]; then
    echo "Please install and compile multiren" >&1
    exit 1
fi

multiren -filename archive-lists.tgz.enc | sh
echo

echo ".... Moving to G-drive ...."


mv -vf archive-lists*.tgz.enc ${GDRIVE}/todoarch/

