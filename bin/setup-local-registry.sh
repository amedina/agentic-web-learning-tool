#!/usr/bin/env bash
#
# Start a throwaway local npm registry (Verdaccio) for publish testing, and
# log in so packages can be published to it.
#
#   pnpm local-registry:start          # start + log in
#   pnpm publish:npm-advisor-mcp:local # publish to it
#   pnpm local-registry:stop           # stop it
#
# The registry serves on http://localhost:4873 with in-memory storage, so
# nothing persists between runs. The publish/unpublish scripts target it via
# an explicit --registry flag, so your shell's default registry is untouched.

# Echo every command being executed and stop on the first error.
set -ex

registry_url=http://localhost:4873

echo "Starting up local npm registry..."

curdir=$(dirname "$(realpath "$0")")

# Start Verdaccio in the background, logging to a temp file. The verdaccio-memory
# in-memory storage plugin is installed into the same npx environment as
# verdaccio (via --package) so the registry can resolve and load it on startup.
tmp_registry_log=$(mktemp)
echo "Registry output file: $tmp_registry_log"
(cd "$HOME" && nohup npx --yes --package verdaccio --package verdaccio-memory verdaccio --config "$curdir/verdaccio-config.yml" &>"$tmp_registry_log" &)

# Wait for Verdaccio to boot (up to ~30s).
for _ in $(seq 1 30); do
  if grep -q 'http address' "$tmp_registry_log" 2>/dev/null; then
    break
  fi
  sleep 1
done

if ! grep -q 'http address' "$tmp_registry_log" 2>/dev/null; then
  echo "Verdaccio did not start in time. Log follows:" >&2
  cat "$tmp_registry_log" >&2
  exit 1
fi

echo "Local registry up and running! ${registry_url}"

# Log in so we can publish (the registry requires an authenticated user).
echo "Logging in..."
npx --yes npm-cli-login -u admin -p password -e test@example.com -r "$registry_url"

echo "Logged in to ${registry_url} as admin."
