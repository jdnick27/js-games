#!/bin/bash
# Delete stale local branches that no longer have a remote counterpart.

set -e

# Update remote tracking branches and prune deleted ones.
# This ensures that branches marked as [gone] are detected correctly.
git fetch --prune

# Find local branches whose upstream has been removed.
stale_branches=$(git branch -vv | awk '/: gone]/{print $1}')

if [ -z "$stale_branches" ]; then
  echo "No stale branches to delete."
  exit 0
fi

echo "Deleting stale branches:"
for branch in $stale_branches; do
  echo "  $branch"
  git branch -D "$branch"
done
