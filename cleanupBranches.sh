#!/bin/sh
# Delete local branches that have been removed from the remote
# Saves the list of deleted branches to deleted_branches.txt

git branch -vv | awk '/: gone]/{print $1}' | tee deleted_branches.txt | xargs -r git branch -D
