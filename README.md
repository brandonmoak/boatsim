## Usage

1. Once the application is running, you'll see a map centered on the Nova Scotia coast
2. Use the controls in the top-right corner to:
   - Start the simulation
   - Stop the simulation
3. The vessel's position will be updated every second, following a predefined route

## Default Configuration

- NMEA 0183 UDP Port: 60001
- NMEA 2000 UDP Port: 60002
- Web Interface Port: 5001
- Default Starting Position: Halifax Harbor (44.6476°N, -63.5728°W)
- Vessel Speed: 10 knots

## Project Structure

- `app.py`: Main Flask application and WebSocket server
- `boat_simulator.py`: Core simulation logic and NMEA message generation
- `udp_listener.py`: Utility for monitoring NMEA messages
- `templates/index.html`: Web interface with map visualization
- `requirements.txt`: Python package dependencies

## Troubleshooting

1. If you get a port in use error:
   - Ensure no other applications are using ports 5001, 60001, or 60002
   - Close any existing instances of the application

2. If the map doesn't load:
   - Check your internet connection (required for loading OpenStreetMap tiles)
   - Ensure JavaScript is enabled in your browser

3. If UDP messages aren't received:
   - Check if your firewall is blocking the UDP ports
   - Verify the UDP listener is running on the correct port

## License

This project is open-source and available under the MIT License.

## Installation (Windows)

1. Install Python 3.8 or higher:
   - Download the latest Python installer from [python.org](https://www.python.org/downloads/)
   - Run the installer and ensure you check "Add Python to PATH"
   - Verify installation by opening Command Prompt and typing: `python --version`

2. Clone the repository:
   ```cmd
   git clone https://github.com/brandonmoak/boatsim.git
   cd boatsim
   ```

3. Create and activate a virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```

4. Install required packages:
   ```cmd
   pip install -r requirement.txt
   ```

5. Configure Windows Firewall (if needed):
   - The simulator needs to allow incoming network traffic on specific ports:
     - Port 60001: Receives NMEA 0183 data (boat position, speed, etc.)
     - Port 60002: Receives NMEA 2000 data (engine data, weather data, etc.)
     - Port 5001: Allows web browser access to the simulator interface
   - If you're having connection issues:
     1. Open "Windows Defender Firewall with Advanced Security"
     2. Select "Inbound Rules" → "New Rule"
     3. Choose "Port" → "UDP" for ports 60001 and 60002
     4. Choose "Port" → "TCP" for port 5001
     5. Allow the connection
     
   Note: Inbound rules allow external programs (like marine navigation software) to connect to your simulator. If you're just running the simulator locally, you might not need to configure the firewall.

6. Start the application:
   ```cmd
   python app.py
   ``` 