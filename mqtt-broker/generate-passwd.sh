#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Generate Mosquitto password file for UNS Simulator
#
# Usage (from project root):
#   ./mqtt-broker/generate-passwd.sh
#
# This runs mosquitto_passwd inside the Mosquitto Docker image
# to generate a hashed password file. The passwords default to
# dev-friendly values but can be overridden via environment vars.
# ─────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASSWD_FILE="$SCRIPT_DIR/passwd"

# Default passwords (override via env vars for production)
BACKEND_PASS="${MQTT_BACKBONE_PASSWORD:-uns-backend-dev}"
SIM_PASS="${MQTT_SIM_PASSWORD:-uns-sim-dev}"
CLIENT_PASS="${MQTT_CLIENT_PASSWORD:-uns-client-dev}"

echo "Generating Mosquitto password file..."

docker run --rm -v "$SCRIPT_DIR":/mqtt eclipse-mosquitto:2 sh -c "
  mosquitto_passwd -b -c /mqtt/passwd uns-backend '$BACKEND_PASS' && \
  mosquitto_passwd -b /mqtt/passwd uns-sim '$SIM_PASS' && \
  mosquitto_passwd -b /mqtt/passwd uns-client '$CLIENT_PASS'
"

echo "✅ Password file generated at: $PASSWD_FILE"
echo "   Users: uns-backend, uns-sim, uns-client"
