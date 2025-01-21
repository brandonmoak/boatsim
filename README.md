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