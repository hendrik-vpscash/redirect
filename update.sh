#!/usr/bin/env bash

# Make sure we're in the correct folder
cd $(dirname $0)

# Update all references
git fetch --al &>/dev/null

# Fetch hashes
UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")

# Check what to do
if [ $LOCAL = $REMOTE ]; then
  # up-to-date
  echo -en ""
elif [ $LOCAL = $BASE ]; then
  # Updates available
  git pull
  pm2 restart all
elif [ $REMOTE = $BASE ]; then
  # Remote outdated
  git push
else
  echo "Diverged!"
  exit 1
fi
