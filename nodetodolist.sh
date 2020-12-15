#!/bin/bash

PROG="nodetodolist.sh"
BASE="/opt/node/nodetodolist"
PORT=8000
JSONREPO="jsonrepo"
TOPJSON="toptodolist.json"

# manual parsing to find out, if process should be detached
if ! echo $* | grep -E '(^-d |-d$| -d |--daemonize$|--daemonize )' > /dev/null; then
	exec node ${BASE}/server.js  > /var/log/${PROG}.log 2>&1 
else
	exec node ${BASE}/server.js > /var/log/${PROG}.log 2>&1 <&- &
	retval=$?
	pid=$!

	echo $pid > /var/run/${PROG}.pid

	[ $retval -eq 0 ] || exit $retval
	#if [ ! -z "$ES_STARTUP_SLEEP_TIME" ]; then
	  #  sleep $ES_STARTUP_SLEEP_TIME
  	#fi
  	if ! ps -p $pid > /dev/null ; then
  		exit 1
  	fi
	exit 0
fi

exit $?







