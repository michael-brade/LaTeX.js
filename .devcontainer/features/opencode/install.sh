#!/bin/sh
set -e

echo "Starte OpenCode CLI Installation und Konfiguration..."

# Prüfen, ob npm installiert ist
if ! [ -x "$(command -v npm)" ]; then
    echo "Fehler: 'npm' wurde nicht gefunden! Stellen Sie sicher, dass Node.js im Container installiert ist." >&2
    exit 1
fi

echo "Installing @opencode/cli..."
npm install -g @opencode/cli


# determine path of this install.sh (and opencode.jsonc)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_SRC="$SCRIPT_DIR/opencode.jsonc"

# for root
CONFIG_TARGET_DIR="$HOME/.config/opencode"
mkdir -p "$CONFIG_TARGET_DIR"
cp "$CONFIG_SRC" "$CONFIG_TARGET_DIR"

# für the non-root dev-user (if available)
if [ -n "$_REMOTE_USER_HOME" ]; then
    echo "Schreibe OpenCode Konfiguration für User $_REMOTE_USER nach $_REMOTE_USER_HOME..."

    CONFIG_TARGET_DIR="$_REMOTE_USER_HOME/.config/opencode"
    mkdir -p "$CONFIG_TARGET_DIR"
    cp "$CONFIG_SRC" "$CONFIG_TARGET_DIR"

    # fix rights since this script runs as root
    chown -R "$_REMOTE_USER:$_REMOTE_USER" "$_REMOTE_USER_HOME/.config"
fi

echo "OpenCode CLI erfolgreich eingerichtet!"
