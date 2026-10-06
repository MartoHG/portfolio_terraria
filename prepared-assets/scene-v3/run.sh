#!/usr/bin/env bash
# Generates one asset with Codex image generation: ./run.sh <name>
set -u
cd "$(dirname "$0")"
R=/home/marto/Proyectos/portfolioterr
n="$1"
[ -f "raw/$n.png" ] && { echo "skip $n"; exit 0; }
timeout 900 /opt/codex-desktop/resources/codex exec --skip-git-repo-check -s workspace-write -C "$PWD" \
  -i "$R/.skills/terraria-portfolio/references/visual-reference-vertical.png" \
  -i "$R/public/assets/scene-v2/workshop-v2.png" - < "prompts/$n.txt" > "logs/$n.log" 2>&1
[ -f "raw/$n.png" ] && echo "ok $n" || echo "FAIL $n"
