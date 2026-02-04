#!/bin/bash

# ==============================================================================
# Script: install.sh
# Description: Generates a shell script with aliases/functions to launch
#              System Chrome with AI features and MCP proxy.
# ==============================================================================

# Strict Mode: Exit on error, exit on unset variables, pipe failure check
set -euo pipefail

# --- Terminal Colors ---
# Define color codes for terminal output
RESET="\033[0m"          # Reset to default color
RED="\033[0;31m"         # Red for errors
GREEN="\033[0;32m"       # Green for success
YELLOW="\033[0;33m"      # Yellow for warnings
BLUE="\033[0;34m"        # Blue for information
MAGENTA="\033[0;35m"     # Magenta for important actions
CYAN="\033[0;36m"        # Cyan for prompts
BOLD="\033[1m"           # Bold text
UNDERLINE="\033[4m"      # Underlined text

# Color output functions
print_info() {
  echo -e "${BLUE}${1}${RESET}"
}

print_success() {
  echo -e "${GREEN}${1}${RESET}"
}

print_warning() {
  echo -e "${YELLOW}Warning: ${1}${RESET}"
}

print_error() {
  echo -e "${RED}Error: ${1}${RESET}" >&2
}

print_header() {
  echo -e "${BOLD}${MAGENTA}${1}${RESET}"
}

print_prompt() {
  echo -e "${CYAN}${1}${RESET}"
}

# Check if terminal supports colors
if [[ -t 1 ]] && [[ -n "${TERM:-}" ]] && [[ "${TERM:-}" != "dumb" ]]; then
  COLOR_SUPPORT=true
else
  # Disable colors if terminal doesn't support them
  COLOR_SUPPORT=false
  RESET=""
  RED=""
  GREEN=""
  YELLOW=""
  BLUE=""
  MAGENTA=""
  CYAN=""
  BOLD=""
  UNDERLINE=""
fi

# --- Configuration ---

# Full path for the generated alias/function script file
ALIAS_SCRIPT_PATH="$HOME/bin/chrome_launcher.sh"

# Path to the source library file in the repo
SOURCE_LIB_PATH="$(dirname "$0")/chrome_launcher.sh"

# Global variable for uninstall mode
UNINSTALL_MODE=false

# --- Helper Functions ---

# Function to clean up the generated script
cleanup() {
  print_info "Cleaning up..."

  # Delete launcher script
  if [[ -f "$ALIAS_SCRIPT_PATH" ]]; then
    print_info "Removing launcher script: $ALIAS_SCRIPT_PATH"
    rm -f "$ALIAS_SCRIPT_PATH" || print_warning "Failed to remove launcher script: $ALIAS_SCRIPT_PATH"
  fi

  print_success "Cleanup complete."
}

# Function to display error messages and exit
# Input: $1 - Error message string
error_exit() {
  echo ""
  print_error "Line ${BASH_LINENO[0]}: $1"
  echo -e "${RED}Exiting.${RESET}" >&2
  exit 1
}

# Function to display usage information
display_usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --uninstall                 Remove the generated script and exit"
  echo "  --help                      Display this help message and exit"
  echo ""
}

# Parse command-line arguments
parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --help)
        display_usage
        exit 0
        ;;
      --uninstall)
        UNINSTALL_MODE=true
        shift
        ;;
      *)
        echo "Unknown option: $1"
        display_usage
        exit 1
        ;;
    esac
  done
}

# --- Core Functions ---

# Displays an introductory message to the user
display_intro() {
  print_header "=============================================="
  print_header "       Chrome AI Launcher Setup Script        "
  print_header "=============================================="
  echo ""
}

# Checks if required command-line tools are installed
check_prerequisites() {
  print_info "Checking prerequisites..."
  local tool
  # We need jq for the generated script checks (and possibly other things in future)
  for tool in jq; do
    if ! command -v "$tool" &> /dev/null; then
      error_exit "Tool '$tool' not found. Please install it and try again."
    fi
  done
  print_success "Prerequisites met."
  echo ""
}

# Installs the alias/function script file
# Input: $1 - Full path for the alias script file to be created
install_alias_script() {
  local alias_file_path="$1"

  echo "Installing launcher script: $alias_file_path"

  if [[ ! -f "$SOURCE_LIB_PATH" ]]; then
    error_exit "Source library file not found at: $SOURCE_LIB_PATH"
  fi

  # Ensure directory exists
  mkdir -p "$(dirname "$alias_file_path")"

  # Copy the script
  cp "$SOURCE_LIB_PATH" "$alias_file_path" || error_exit "Failed to copy launcher script."

  # Make the installed script executable (though it is sourced, this is good practice)
  chmod +x "$alias_file_path" || print_warning "Failed to make alias script '$alias_file_path' executable."

  print_success "Launcher script installed successfully"
}

# Displays final instructions to the user on how to activate the aliases/functions
display_outro() {
  print_header "=============================================="
  print_header "              Setup Complete!                 "
  print_header "=============================================="

  # Display launcher information
  print_info "Launcher script: $ALIAS_SCRIPT_PATH"
  print_prompt "To use Chrome in current session, run: \n\t ${BOLD}source \"$ALIAS_SCRIPT_PATH\"${RESET}"

  # Display available commands
  print_header "Available commands after sourcing the launcher script:"
  echo -e "${CYAN}chrome-ai          ${RESET}: System Chrome with AI features"
  echo -e "${CYAN}chrome-mcp-proxy   ${RESET}: Standalone MCP proxy (for use with chrome-ai)"

  print_header "=============================================="
}

# Function to automatically source the alias script or provide instructions
auto_source_alias_script() {
  local script_path="$1"

  # Check if the script exists
  if [[ ! -f "$script_path" ]]; then
    error_exit "Launcher script at $script_path does not exist."
  fi

  # Determine shell config file based on shell name
  local shell_config=""
  case "$SHELL" in
    */bash)
      shell_config="$HOME/.bashrc"
    ;;
    */zsh)
      shell_config="$HOME/.zshrc"
    ;;
  esac

  # If we found a config file, try to add source command
  if [[ -n "$shell_config" ]]; then
    # Check if the source line already exists (with or without file check)
    if ! grep -q "source \"$script_path\"" "$shell_config" && ! grep -q "if \[ -f \"$script_path\" \]; then source \"$script_path\"" "$shell_config"; then
      echo "" >> "$shell_config"
      echo "# Auto-added by Chrome AI setup script" >> "$shell_config"
      echo "if [ -f \"$script_path\" ]; then source \"$script_path\"; fi" >> "$shell_config"
      echo "" >> "$shell_config"
      print_success "Added launcher script to shell config: $shell_config"
    else
      print_info "Source command for $script_path already exists in shell config file: $shell_config"
    fi
  else
    print_warning "Could not determine shell configuration file."
    print_info "To use Chrome aliases, add this to your shell config: source \"$script_path\""
  fi
}

# --- Main Execution Logic ---

main() {
  # Parse command-line arguments
  parse_arguments "$@"

  display_intro

  # If uninstall mode is enabled, clean up and exit
  if [[ "$UNINSTALL_MODE" == "true" ]]; then
    cleanup
    print_success "Uninstall complete."
    exit 0
  fi

  check_prerequisites

  # Install the script
  install_alias_script "$ALIAS_SCRIPT_PATH"
  auto_source_alias_script "$ALIAS_SCRIPT_PATH"
  display_outro

  exit 0
}

# --- Run Script ---
main "$@"
