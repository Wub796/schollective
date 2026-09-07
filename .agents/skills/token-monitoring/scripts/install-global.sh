#!/usr/bin/env bash
set -e

# Target paths in user's home directory
GLOBAL_CONFIG_DIR="$HOME/.gemini/config"
GLOBAL_SKILLS_DIR="$GLOBAL_CONFIG_DIR/skills/token-monitoring"
GLOBAL_RULES_DIR="$GLOBAL_CONFIG_DIR/rules"

# Create directories if they don't exist
mkdir -p "$GLOBAL_SKILLS_DIR"
mkdir -p "$GLOBAL_RULES_DIR"

# Resolve script directory to find source files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_ROOT="$(cd "$SKILL_ROOT/../.." && pwd)"

# Copy files
cp "$SKILL_ROOT/SKILL.md" "$GLOBAL_SKILLS_DIR/SKILL.md"
cp "$WORKSPACE_ROOT/.agents/rules/token-monitoring.md" "$GLOBAL_RULES_DIR/token-monitoring.md"

echo "✅ Token Monitoring installed globally to $GLOBAL_CONFIG_DIR"
echo "Antigravity will now automatically apply this rule and skill across all projects on this machine."
