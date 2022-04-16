#!/bin/sh

SESSION=todo
STARTDIR=/opt/node/todolist
EXEC="npm start"

tmux new-session -d -s $SESSION && tmux send-keys -t $SESSION '(cd '$STARTDIR' && npm start)' Enter
