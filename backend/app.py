from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import socket

from nmea.messages import generate_nmea_2000_messages

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Network configuration
UDP_IP = "127.0.0.1"  # Default IP address
NMEA_0183_PORT = 10110 # Port for NMEA 0183 messages
NMEA_2000_PORT = 10111 # Port for NMEA 2000 messages

nmea_0183_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
nmea_2000_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

@socketio.on('update_pgn_0183')
def handle_pgn_update(data):
    pgn_id = data.get('pgn_id')
    parameter = data.get('values')
    value = data.get('value')

@socketio.on('update_pgn_2000')
def handle_pgn_update(data):
    print('Received PGN update:', data)
    for pgn in data:
        print(pgn['pgn_id'], pgn['values'])
    
    messages = generate_nmea_2000_messages(data)

    for message in messages:
        nmea_2000_socket.sendto(
            message,
            (UDP_IP, NMEA_2000_PORT)
        )

if __name__ == "__main__":
    socketio.run(app, debug=True, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)