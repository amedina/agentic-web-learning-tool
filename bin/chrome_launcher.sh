#!/bin/bash
# chrome_launcher.sh
#
# Description:
#   This script defines shell functions/aliases to launch System Chrome
#   with AI features enabled and to run the MCP proxy.
#
# Usage:
#   source /path/to/chrome_launcher.sh
#   chrome-ai [args]
#   chrome-mcp-proxy [debug_port]

# --- Prerequisite Checks ---

# Check if a command is available
# Input: $1 - command name
# Input: $2 - optional hint/installation instruction
psat_check_cmd() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: Command '$cmd' not found."
    if [[ -n "$hint" ]]; then
      echo "Please install it. $hint"
    fi
    return 1
  fi
  return 0
}

# Check if a global npm package is installed
# Input: $1 - package name
# Input: $2 - optional hint
psat_check_npm_pkg() {
  local pkg="$1"
  local hint="$2"

  if ! command -v npm >/dev/null 2>&1; then
     echo "Error: npm is not installed. Cannot check for package '$pkg'."
     echo "Please install Node.js and npm."
     return 1
  fi

  if ! npm list -g "$pkg" --depth=0 >/dev/null 2>&1; then
    echo "Error: Global npm package '$pkg' not found."
    if [[ -n "$hint" ]]; then
      echo "Please install it. $hint"
    fi
    return 1
  fi
  return 0
}

# --- Port Helper Functions ---

# Check if a port is free (Linux specific implementation)
# Input: $1 - Port number
# Returns 0 if free, 1 if in use
psat_is_port_free_linux() {
  local port="$1"

  # Method 1: ss (Socket Statistics - standard on Linux)
  # Preferred over lsof as it shows listening ports even if we can't see the process (docker/root)
  if command -v ss >/dev/null 2>&1; then
    if ss -lptn "sport = :$port" | grep -q ":$port"; then
      return 1
    fi
    # If ss returns nothing, we continue to check other methods or assume free.
    # However, if ss is available, it is usually authoritative for listening ports.
    # We will still let it fall through just in case.
  fi

  # Method 2: netstat
  # Also good for seeing ports used by other users/containers
  if command -v netstat >/dev/null 2>&1; then
    # -tulpn: tcp, udp, listening, numeric, program name
    if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
      return 1
    fi
  fi

  # Method 3: lsof
  # lsof is good but requires sudo to see ports owned by other users/docker in some cases.
  # If lsof returns a PID, it's definitely used.
  if command -v lsof >/dev/null 2>&1; then
    if lsof -i :$port -t >/dev/null 2>&1; then
      return 1
    fi
  fi

  # Method 4: netcat (nc)
  if command -v nc >/dev/null 2>&1; then
    if nc -z -w 1 127.0.0.1 $port >/dev/null 2>&1; then
      return 1
    fi
  fi

  # Method 5: /dev/tcp
  if (echo > /dev/tcp/127.0.0.1/$port) >/dev/null 2>&1; then
    return 1
  fi

  # If none of the above found it, it's probably free
  return 0
}

# Check if a port is free (macOS specific implementation)
# Input: $1 - Port number
# Returns 0 if free, 1 if in use
psat_is_port_free_mac() {
  local port="$1"

  # Method 1: lsof
  if command -v lsof >/dev/null 2>&1; then
    if lsof -i :$port -t >/dev/null 2>&1; then
      return 1
    fi
    return 0
  fi

  # Method 2: netcat (nc) - BSD style
  if command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 $port >/dev/null 2>&1; then
      return 1
    fi
    return 0
  fi

  # Method 3: /dev/tcp
  if (echo > /dev/tcp/127.0.0.1/$port) >/dev/null 2>&1; then
    return 1
  fi

  return 0
}

# Check if a port is free (Platform Dispatcher)
# Input: $1 - Port number
# Returns 0 if free, 1 if in use
psat_is_port_free() {
  local port="$1"
  local os_name
  os_name=$(uname -s)

  if [[ "$os_name" == "Darwin" ]]; then
    psat_is_port_free_mac "$port"
  else
    psat_is_port_free_linux "$port"
  fi
}

# Resolve a port, finding an available one and asking user for confirmation if default is busy
# Input: $1 - Desired port
# Input: $2 - Description (e.g. "Chrome Remote Debugging")
# Input: $3 - Variable name to store result
# Returns 0 if successful, 1 if cancelled
psat_resolve_port() {
  local port="$1"
  local desc="$2"
  local var_ref="$3"

  if psat_is_port_free "$port"; then
    eval "$var_ref=$port"
    return 0
  fi

  echo "Error: $desc port $port is in use."

  # Find next available
  local next_port=$((port + 1))
  while ! psat_is_port_free "$next_port"; do
    next_port=$((next_port + 1))
    if [[ $next_port -gt 65535 ]]; then
      echo "No available ports found."
      return 1
    fi
  done

  echo "Suggested alternate port: $next_port"
  # Read from /dev/tty to ensure we get user input even inside a script/function
  read -p "Is it okay to use port $next_port instead? (y/n) " confirm < /dev/tty
  if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    eval "$var_ref=$next_port"
    return 0
  else
    echo "Operation cancelled by user."
    return 1
  fi
}

# --- Chrome AI Helper Functions ---

# Persistent user data directory for the AI profile
export AI_PERSISTENT_PROFILE_DIR="$HOME/.chrome-ai-profile"

# Detect a system Chrome/Chromium executable with priority: Dev -> Canary -> Stable
_psat_find_system_chrome() {
  local os_name
  os_name="$(uname -s)"

  # Try Dev channel first
  local dev_candidates=(
    # Linux
    "$(command -v google-chrome-unstable 2>/dev/null || true)"  # Dev/Unstable on Linux
    "$(command -v google-chrome-dev 2>/dev/null || true)"       # Some distros
    "$(command -v chromium-nightly 2>/dev/null || true)"        # Nightly builds on some distros

    # macOS
    "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev"
  )

  for c in "${dev_candidates[@]}"; do
    if [[ -n "${c}" && -x "${c}" ]]; then
      echo "${c}"
      return 0
    fi
  done

  # Then Canary channel
  local canary_candidates=(
    # Linux (rarely available, but check in case it's installed via custom repos)
    "$(command -v google-chrome-canary 2>/dev/null || true)"

    # macOS
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
  )

  for c in "${canary_candidates[@]}"; do
    if [[ -n "${c}" && -x "${c}" ]]; then
      echo "${c}"
      return 0
    fi
  done

  # Finally Stable (and Chromium as fallback)
  local stable_candidates=(
    # Linux
    "$(command -v google-chrome-stable 2>/dev/null || true)"
    "$(command -v google-chrome 2>/dev/null || true)"
    "$(command -v chromium 2>/dev/null || true)"
    "$(command -v chromium-browser 2>/dev/null || true)"

    # macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  )

  for c in "${stable_candidates[@]}"; do
    if [[ -n "${c}" && -x "${c}" ]]; then
      echo "${c}"
      return 0
    fi
  done

  # Additional fallbacks at typical paths (Linux)
  local more=(
    "/usr/bin/google-chrome-unstable"
    "/usr/bin/google-chrome-canary"
    "/usr/bin/google-chrome"
    "/usr/bin/google-chrome-stable"
    "/snap/bin/chromium"
  )
  for c in "${more[@]}"; do
    if [[ -x "${c}" ]]; then
      echo "${c}"
      return 0
    fi
  done

  return 1
}

# Core launcher that always uses the persistent profile dir
_psat_launch_system_chrome_ai() {
  local chrome_bin
  if ! chrome_bin="$( _psat_find_system_chrome )"; then
    echo "Error: Could not find a system-installed Chrome/Chromium executable." >&2
    echo "Tried Dev, Canary, then Stable channel names and macOS app locations." >&2
    return 1
  fi

  mkdir -p "$AI_PERSISTENT_PROFILE_DIR"

  local os_name
  os_name="$(uname -s)"

  local common_flags=(
    --user-data-dir="$AI_PERSISTENT_PROFILE_DIR"
    --no-default-browser-check
    --no-first-run
    --disable-sync
    --silent-debugger-extension-api
    --disable-infobars
    --start-maximized
    --enable-features="PromptApiForGeminiNano,PromptApiForGeminiNanoMultimodalInput,OptimizationGuideOnDeviceModel,OptimizationGuideOnDeviceModelBypassPerfRequirement,OnDeviceModelPerformanceParams:compatible_on_device_performance_classes/*,RewriterApiForGeminiNano,WriterApiForGeminiNano,LanguageDetectionApi,TranslationApi,ExperimentalTranslationApi,EnableAIFeatures,SummarizationApiForGeminiNano,ProofreaderApiForGeminiNano,EnableOnDeviceModel,AIModeOmniboxEntryPoint,AIProofreadingAPI,AIRewriterAPI,AIWriterAPI"
  )

  # Detect a human-friendly channel label for logging
  local channel="stable"
  case "$chrome_bin" in
    *"Google Chrome Dev"*|*"google-chrome-unstable"*|*"google-chrome-dev"*|*"chromium-nightly"*) channel="dev" ;;
    *"Google Chrome Canary"*|*"google-chrome-canary"*) channel="canary" ;;
    *"Chromium"*|*"chromium"*) channel="chromium" ;;
    *) channel="stable" ;;
  esac

  echo "Launching system Chrome with persistent AI profile..."
  echo "  Channel:    $channel"
  echo "  Executable: $chrome_bin"
  echo "  Profile:    $AI_PERSISTENT_PROFILE_DIR"
  if [[ $# -gt 0 ]]; then
    echo "  Arguments:  $*"
  fi

  # Launch in background to match behavior of generated launcher
  if [[ "$os_name" == "Darwin" || "$os_name" == "Linux" ]]; then
    "$chrome_bin" "${common_flags[@]}" "$@" >/dev/null 2>&1 &
  else
    echo "Error: Unsupported OS '$os_name'" >&2
    return 1
  fi
  local chrome_pid=$!
  echo "Chrome launched (PID: $chrome_pid) using persistent profile."
}

# --- Convenience Functions/Aliases ---

# chrome-ai command
chrome-ai() {
  # Resolve ports
  local debug_port=9222
  psat_resolve_port 9222 "Chrome Remote Debugging" debug_port || return 1

  echo "Launching Chrome AI with remote debugging on port $debug_port..."
  _psat_launch_system_chrome_ai --remote-debugging-port="$debug_port" "$@"
}

# chrome-mcp-proxy command
# Starts the MCP proxy standalone, connecting to an existing Chrome instance
chrome-mcp-proxy() {
  local debug_port="${1:-9222}"
  local os_name
  os_name=$(uname -s)
  local install_hint=""
  local jq_hint=""

  if [[ "$os_name" == "Darwin" ]]; then
     install_hint="Run: npm install -g"
     jq_hint="Run: brew install jq"
  else
     install_hint="Run: sudo npm install -g"
     jq_hint="Run: sudo apt install jq"
  fi

  # Check prerequisites
  psat_check_cmd "jq" "$jq_hint" || return 1
  psat_check_cmd "mcp-proxy" "$install_hint mcp-proxy" || return 1
  psat_check_npm_pkg "chrome-devtools-mcp" "$install_hint chrome-devtools-mcp" || return 1

  echo "Starting MCP Proxy connecting to Chrome at port $debug_port..."

  # Resolve proxy port
  # Default to 4000 to avoid conflicts with common dev ports like 3000
  local proxy_port=4000
  psat_resolve_port 4000 "MCP Proxy" proxy_port || return 1

  echo "MCP Proxy running on port $proxy_port"
  echo "MCP Server URL: http://localhost:$proxy_port/mcp"
  echo "Press Ctrl+C to stop the proxy."

  mcp-proxy --port "$proxy_port" --stateless -- chrome-devtools-mcp -u "http://127.0.0.1:$debug_port"
}
