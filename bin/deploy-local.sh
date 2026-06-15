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
# Optional VS Code reinstall:
#   Set DEPLOY_LOCAL_VSIX_PATH in packages/extensions/vscode/.env to opt in. It
#   can be the dist/vscode-npm-advisor directory, or any .vsix path inside it
#   (the version in the filename is ignored). The script installs the NEWEST
#   .vsix in that directory via `code --install-extension <path> --force`, so a
#   version bump never needs an .env edit (reload the VS Code window afterwards).
#   See packages/extensions/vscode/.env.example.
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

# Optionally reinstall the packaged extension into VS Code. Opt-in: only runs
# when DEPLOY_LOCAL_VSIX_PATH is set in packages/extensions/vscode/.env. The
# value is read by matching the key line rather than sourcing .env, so we never
# execute its contents.
env_file="$MAIN/packages/extensions/vscode/.env"
vsix_path=""
if [ -f "$env_file" ]; then
  vsix_line="$(grep -E '^[[:space:]]*DEPLOY_LOCAL_VSIX_PATH[[:space:]]*=' "$env_file" | tail -n1 || true)"
  if [ -n "$vsix_line" ]; then
    vsix_path="${vsix_line#*=}"
    # Trim surrounding whitespace and a single pair of quotes.
    vsix_path="$(printf '%s' "$vsix_path" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")"
  fi
fi

if [ -n "$vsix_path" ]; then
  # Resolve a directory to install from: accept either the dist directory or a
  # (possibly versioned) .vsix path for backward compatibility, then always
  # install the NEWEST .vsix in it. This way a version bump never requires an
  # .env edit, and stale .vsix files from earlier builds are ignored.
  if [ -d "$vsix_path" ]; then
    vsix_dir="$vsix_path"
  else
    vsix_dir="$(dirname "$vsix_path")"
  fi

  newest_vsix="$(ls -t "$vsix_dir"/*.vsix 2>/dev/null | head -n1 || true)"

  if [ -z "$newest_vsix" ]; then
    echo "deploy:local: DEPLOY_LOCAL_VSIX_PATH is set but no .vsix found in $vsix_dir. Skipping install."
  elif ! command -v code >/dev/null 2>&1; then
    echo "deploy:local: 'code' CLI not on PATH. Skipping extension install. (In VS Code: Cmd+Shift+P > 'Shell Command: Install code command in PATH')"
  else
    echo "deploy:local: installing $newest_vsix"
    code --install-extension "$newest_vsix" --force
    echo "deploy:local: installed. Reload VS Code (Cmd+Shift+P > 'Developer: Reload Window') to view changes."
  fi
fi
