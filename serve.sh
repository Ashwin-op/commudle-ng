#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Commudle Development Server v3.0
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── Colors & Styles ──
R='\033[0m'
B='\033[1m'
D='\033[2m'
CY='\033[0;36m'
GR='\033[0;32m'
YL='\033[1;33m'
RD='\033[0;31m'
MG='\033[0;35m'
WH='\033[1;37m'
BG_BL='\033[44m'
BG_GR='\033[42m'
BG_MG='\033[45m'
BG_CY='\033[46m'

# ── Utility Functions ──
line() { echo -e "${D}${CY}$(printf '%.0s─' {1..70})${R}"; }
step() { echo -e "  ${CY}${B}[$1/${TOTAL_STEPS}]${R} ${WH}$2${R}"; }
ok() { echo -e "       ${GR}✔${R} $1"; }
warn() { echo -e "       ${YL}⚠${R} $1"; }
fail() { echo -e "       ${RD}✘${R} $1"; exit 1; }
info() { echo -e "       ${D}$1${R}"; }
spacer() { echo ""; }

# ── Arrow Key Menu ──
ARROW_RESULT=""
arrow_select() {
  local options=("$@")
  local selected=0
  local count=${#options[@]}

  tput civis 2>/dev/null || true

  while true; do
    for i in "${!options[@]}"; do
      if [ $i -eq $selected ]; then
        echo -e "       ${CY}${B}▸ ${options[$i]}${R}"
      else
        echo -e "       ${D}  ${options[$i]}${R}"
      fi
    done

    read -rsn1 key
    if [[ "$key" == $'\x1b' ]]; then
      read -rsn2 key
      case "$key" in
        '[A') ((selected > 0)) && ((selected--)) ;;
        '[B') ((selected < count - 1)) && ((selected++)) ;;
      esac
    elif [[ "$key" == "" ]]; then
      break
    fi

    tput cuu "$count" 2>/dev/null || echo -ne "\033[${count}A"
  done

  tput cnorm 2>/dev/null || true

  ARROW_RESULT="${options[$selected]}"
}

TOTAL_STEPS=4
ENV_FILE="libs/shared/environments/src/lib/environments.ts"

# ── Clear & Banner ──
clear
echo ""
echo -e "${CY}${B}"
cat << 'BANNER'
     ██████╗ ██████╗ ███╗   ███╗███╗   ███╗██╗   ██╗██████╗ ██╗     ███████╗
    ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██║   ██║██╔══██╗██║     ██╔════╝
    ██║     ██║   ██║██╔████╔██║██╔████╔██║██║   ██║██║  ██║██║     █████╗
    ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██║   ██║██║  ██║██║     ██╔══╝
    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗███████╗
     ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝
BANNER
echo -e "${R}"
echo -e "    ${BG_CY}${WH}  DEV SERVER v3.0  ${R}  ${D}Development Server Launcher${R}"
echo ""
line

# ── System Info ──
spacer
echo -e "  ${D}${CY}SYSTEM${R}"
info "Node     : $(node -v 2>/dev/null || echo 'not found')"
info "npm      : $(npm -v 2>/dev/null || echo 'not found')"
info "OS       : $(uname -s) $(uname -m)"
info "Date     : $(date '+%b %d, %Y  %H:%M:%S')"
info "User     : $(whoami)"
spacer
line

# ── STEP 1: Pre-flight Checks ──
spacer
step 1 "PRE-FLIGHT CHECKS"
spacer

command -v node &> /dev/null && ok "Node.js $(node -v)" || fail "Node.js not found"
command -v npm &> /dev/null && ok "npm $(npm -v)" || fail "npm not found"
npx nx --version &> /dev/null && ok "Nx workspace detected" || fail "Nx not found. Run npm ci"
[ -f "$ENV_FILE" ] && ok "Environment config" || fail "Missing: $ENV_FILE"

spacer
line

# ── STEP 2: Git Pull ──
spacer
step 2 "GIT PULL"
spacer

REMOTES=($(git remote 2>/dev/null))
if [ ${#REMOTES[@]} -eq 0 ]; then
  warn "No git remotes found, skipping pull"
else
  info "Current branch: ${B}$(git branch --show-current)${R}"
  spacer
  echo -e "       ${YL}Pull latest changes?${R}"
  spacer
  arrow_select "Yes" "No"
  pull_choice="$ARROW_RESULT"
  spacer

  if [ "$pull_choice" = "Yes" ]; then
    echo -e "       ${YL}Select remote:${R}"
    spacer
    arrow_select "${REMOTES[@]}"
    pull_remote="$ARROW_RESULT"
    spacer

    read -p "$(echo -e "       ${MG}▸${R} Branch name ${D}(Enter for current)${R}: ")" pull_branch
    [ -z "$pull_branch" ] && pull_branch=$(git branch --show-current)
    spacer
    info "Running: git pull ${pull_remote} ${pull_branch}"
    git pull "$pull_remote" "$pull_branch"
    spacer
    ok "Pulled ${B}${pull_remote}/${pull_branch}${R}"
  else
    ok "Skipped git pull"
  fi
fi

spacer
line

# ── STEP 3: Environment ──
spacer
step 3 "ENVIRONMENT"
spacer
echo -e "       ${YL}Use ↑↓ arrows to select, Enter to confirm${R}"
spacer

arrow_select "local" "test" "staging" "production"
env_selected="$ARROW_RESULT"

sed -i "" "s/export const environment = environments\['.*'\];/export const environment = environments['$env_selected'];/" "$ENV_FILE"
spacer
ok "Environment → ${B}${env_selected}${R}"
spacer
line

# ── STEP 4: Server Mode ──
spacer
step 4 "SERVER MODE"
spacer
echo -e "       ${YL}Use ↑↓ arrows to select, Enter to confirm${R}"
spacer

arrow_select "Standard (localhost:4200)" "Network (0.0.0.0:4200)" "Custom port"
serve_selected="$ARROW_RESULT"

spacer

case "$serve_selected" in
  "Standard"*)
    serve_host="localhost"
    serve_port="4200"
    serve_cmd="npx nx run commudle-admin:serve"
    ;;
  "Network"*)
    serve_host="0.0.0.0"
    serve_port="4200"
    serve_cmd="npx nx run commudle-admin:serve --host 0.0.0.0"
    ;;
  "Custom"*)
    read -p "$(echo -e "       ${MG}▸${R} Port ${D}(default: 4200)${R}: ")" custom_port
    custom_port=${custom_port:-4200}
    serve_host="localhost"
    serve_port="$custom_port"
    serve_cmd="npx nx run commudle-admin:serve --port $custom_port"
    spacer
    ;;
esac

ok "Mode → ${B}${serve_selected}${R}"
spacer
line

# ── Launch Summary ──
spacer
echo -e "  ${BG_BL}${WH}  LAUNCH SUMMARY  ${R}"
spacer
echo -e "       ┌────────────────┬──────────────────────────────────────┐"
printf "       │ ${D}Environment${R}    │ ${B}%-36s${R}│\n" "$env_selected"
printf "       │ ${D}Host${R}           │ ${B}%-36s${R}│\n" "$serve_host"
printf "       │ ${D}Port${R}           │ ${B}%-36s${R}│\n" "$serve_port"
printf "       │ ${D}URL${R}            │ ${GR}${B}%-36s${R}│\n" "http://${serve_host}:${serve_port}"
echo -e "       └────────────────┴──────────────────────────────────────┘"
spacer
line

# ── Launch ──
spacer
echo -e "  ${BG_GR}${WH}  LAUNCHING SERVER  ${R}"
spacer
ok "Starting development server..."
spacer

$serve_cmd
