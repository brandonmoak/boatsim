#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting NMEA Simulator Setup...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js and try again.${NC}"
    echo -e "${BLUE}You can install Node.js using:${NC}"
    echo "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    exit 1
fi

# Initialize npm project
echo -e "${BLUE}Initializing npm project...${NC}"
npm init -y

# Create React application
echo -e "${BLUE}Setting up React application...${NC}"
npx create-react-app boatsim-ui --template typescript

cd boatsim-ui

# Install React dependencies
echo -e "${BLUE}Installing React dependencies...${NC}"
npm install leaflet @types/leaflet socket.io-client @types/socket.io-client

# Copy the React source files
echo -e "${BLUE}Configuring React application...${NC}"
cp -r ../src/* src/

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${BLUE}To start the application:${NC}"
echo "1. Start the backend: python app.py"
echo "2. In a new terminal, go to boatsim-ui and run: npm start"
echo -e "${BLUE}The application will be available at:${NC} http://localhost:3000" 