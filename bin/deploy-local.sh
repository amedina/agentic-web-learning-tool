#!/usr/bin/env bash
#
# Copy a worktree's built dist/ into the main repo's root dist/ so the
# unpacked extension Chrome loads from the repo root reflects that build.
#
# Usage:
#   pnpm deploy:local            # deploy the worktree on the CURRENT branch
#   pnpm deploy:local <name>     # deploy the worktree matching <name>
#                                #   (worktree folder name or branch name)
#
set -euo pipefail

MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
ARG="${1:-}"

# Build parallel lists of worktree paths and their checked-out branches.
paths=()
branches=()
current_path=""
while IFS= read -r line; do
  case "$line" in
    "worktree "*) current_path="${line#worktree }" ;;
    "branch refs/heads/"*)
      paths+=("$current_path")
      branches+=("${line#branch refs/heads/}")
      ;;
    "detached")
      paths+=("$current_path")
      branches+=("")
      ;;
    "") current_path="" ;;
  esac
done < <(git worktree list --porcelain)

target=""
if [ -n "$ARG" ]; then
  # Explicit name: match a worktree by folder name or branch — exact first,
  # then substring — so either "my-feature" or its branch resolves.
  for i in "${!paths[@]}"; do
    if [ "$(basename "${paths[$i]}")" = "$ARG" ] || [ "${branches[$i]}" = "$ARG" ]; then
      target="${paths[$i]}"
      break
    fi
  done
  if [ -z "$target" ]; then
    for i in "${!paths[@]}"; do
      if [[ "${paths[$i]}" == *"$ARG"* ]] || [[ "${branches[$i]}" == *"$ARG"* ]]; then
        target="${paths[$i]}"
        break
      fi
    done
  fi
else
  # Default: the worktree checked out on the current branch.
  current_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
  for i in "${!paths[@]}"; do
    if [ -n "$current_branch" ] && [ "${branches[$i]}" = "$current_branch" ]; then
      target="${paths[$i]}"
      break
    fi
  done
fi

if [ -z "$target" ]; then
  if [ -n "$ARG" ]; then
    echo "deploy:local: no worktree matching \"$ARG\". See: git worktree list"
  else
    echo "deploy:local: no worktree for the current branch. Pass a name: pnpm deploy:local <name>"
  fi
  exit 1
fi

if [ "$target" = "$MAIN" ]; then
  echo "deploy:local: current branch is checked out in the main repo, not a worktree. Pass a name: pnpm deploy:local <name>"
  exit 1
fi

if [ ! -d "$target/dist" ]; then
  echo "deploy:local: no dist/ in $target — build it first."
  exit 1
fi

rsync -a "$target/dist/" "$MAIN/dist/"
echo "deploy:local: $target/dist -> $MAIN/dist"
