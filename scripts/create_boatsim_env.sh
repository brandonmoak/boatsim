#!/bin/bash

# Define the boatsim config directory
BOATSIM_DIR="$HOME/.boatsim"

# Create the .boatsim directory if it doesn't exist
mkdir -p "$BOATSIM_DIR"

# Define the path to the env file
BOATSIM_ENV="$BOATSIM_DIR/.env"

# Create or overwrite the .env file
cat > "$BOATSIM_ENV" << EOL
# Frontend port
PORT=3002

# Backend port
REACT_APP_BACKEND_PORT=5010

# Backend URL for local development
REACT_APP_BACKEND_URL=http://localhost:\${REACT_APP_BACKEND_PORT}

# Uncomment and modify for production/ngrok
# REACT_APP_BACKEND_URL=https://your-ngrok-url.ngrok-free.app
EOL

echo "Created .boatsim directory at $BOATSIM_DIR"
echo "Created .env file at $BOATSIM_ENV" 