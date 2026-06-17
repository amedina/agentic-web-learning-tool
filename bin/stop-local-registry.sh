#!/usr/bin/env bash
#
# Stop the local Verdaccio registry started by setup-local-registry.sh
# (`pnpm local-registry:stop`).

pids=$(lsof -nti:4873 || true)
if [ -n "$pids" ]; then
  echo "$pids" | xargs kill -9
  echo "Stopped local registry on :4873"
else
  echo "No local registry running on :4873"
fi
