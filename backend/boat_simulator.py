import threading
import time
import math
import socket
from datetime import datetime 

from nmea.pgn_config import get_pgn_config, get_id_to_name_mapping
from nmea.messages import generate_nmea_0183_messages, generate_nmea_2000_messages

SIM_RATE = 1.0  # HZ

# Network configuration
UDP_IP = "127.0.0.1"  # Default IP address
NMEA_0183_PORT = 10110 # Port for NMEA 0183 messages
NMEA_2000_PORT = 10111 # Port for NMEA 2000 messages

class BoatState:
    def __init__(self, socketio):
        self.socketio = socketio
        self.pgn_config = get_pgn_config()
        self.id_to_name_mapping = get_id_to_name_mapping()
        
        # Navigation state (current only)
        self.navigation = {
            'latitude': 44.6476,
            'longitude': -63.5728,
            'speed': 10.0,  # knots
            'heading': 0.0,
            'depth': 50.0  # meters
        }
        
        # Track last update timestamp
        self.last_update = datetime.now()
        
        # Initialize PGN state (current values only)
        self.pgn_state = {}
        for pgn_name, config in self.pgn_config.items():
            self.pgn_state[pgn_name] = {
                'values': {param: 0 for param in config['parameters']},
                'last_update': None
            }

    def update_pgn_value(self, pgn_id: int, parameter: str, value: float) -> bool:
        """Update a PGN value by its ID using the mapping"""
        pgn_name = self.id_to_name_mapping.get(pgn_id)
        return self.update_pgn(pgn_name, value, parameter)

    def update_pgn(self, pgn_name: str, value: float, parameter: str) -> bool:
        """Update a PGN value and store in history"""
        if pgn_name not in self.pgn_config:
            print(f"Unknown PGN name: {pgn_name}")
            return False
        
        if parameter not in self.pgn_config[pgn_name]['parameters']:
            print(f"Unknown parameter {parameter} for PGN {pgn_name}")
            return False
        
        # Update the value
        self.pgn_state[pgn_name]['values'][parameter] = value
        self.pgn_state[pgn_name]['last_update'] = datetime.now().isoformat()
        
        # Emit updated state
        self.emit_state()
        
        return True

    def emit_state(self):
        """Emit the complete state including PGN values"""
        state = {
            'navigation': {
                'latitude': self.navigation['latitude'],
                'longitude': self.navigation['longitude'],
                'heading': self.navigation['heading'],
                'speed': self.navigation['speed'],
                'depth': self.navigation['depth'],
            },
            'pgn_values': self.pgn_state
        }
        self.socketio.emit('state_update', state)


    def update_position(self):
        """Update vessel position"""
        current_time = datetime.now()
        delta_time = (current_time - self.last_update).total_seconds()
        
        # Convert knots to degrees per second
        speed_deg_per_sec = (self.navigation['speed'] * 1.852) / (111.0 * 3600.0)
        
        # Calculate position changes
        delta_lat = speed_deg_per_sec * math.cos(math.radians(self.navigation['heading']))
        delta_lon = speed_deg_per_sec * math.sin(math.radians(self.navigation['heading']))
        
        # Update current position
        self.navigation['latitude'] += delta_lat
        self.navigation['longitude'] += delta_lon
        
        self.last_update = current_time
        self.emit_state()


class BoatSimulator:
    def __init__(self, socketio):
        # Setup UDP broadcast sockets first
        self.nmea_0183_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.nmea_2000_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        # Then create BoatState with the socket to the frontend
        self.boat_state = BoatState(socketio)
        self.running = False
        self.socketio = socketio
        self.thread = None
        
        # Start the simulation immediately
        self.start()

    def simulation_loop(self):
        """Main simulation loop."""
        print("Starting simulation loop...")
        while self.running:
            # Update boat state
            print("Updating boat state...")
            self.boat_state.update_position()
            
            # Generate and send NMEA messages
            nmea_0183_messages = generate_nmea_0183_messages(self.boat_state.navigation)
            nmea_2000_messages = generate_nmea_2000_messages(self.boat_state.pgn_config, self.boat_state.pgn_state)
            print(f"Generated {len(nmea_0183_messages)} NMEA 0183 messages and {len(nmea_2000_messages)} NMEA 2000 messages.")
            
            # Send NMEA 0183 messages
            for message in nmea_0183_messages:
                self.nmea_0183_socket.sendto(
                    message.encode(),
                    (UDP_IP, NMEA_0183_PORT)
                )
            
            # Send NMEA 2000 messages
            for message in nmea_2000_messages:
                self.nmea_2000_socket.sendto(
                    message,
                    (UDP_IP, NMEA_2000_PORT)
                )
            
            # Sleep for update interval
            time.sleep(1/SIM_RATE)
        print("Simulation loop ended.")

    def start(self):
        """Start the simulation."""
        if not self.running:
            print("Starting simulator...")
            self.running = True
            self.thread = threading.Thread(target=self.simulation_loop)
            self.thread.daemon = True
            self.thread.start()
            print(f"Simulator thread started: {self.thread.is_alive()}")

    def stop(self):
        """Stop the simulation."""
        print("Stopping simulator...")
        self.running = False
        if self.thread:
            self.thread.join()
        self.nmea_0183_socket.close()
        self.nmea_2000_socket.close()