import threading
import time
import math
import socket
from datetime import datetime

SIM_RATE = 1.0  # HZ

# Network configuration
UDP_IP = "127.0.0.1"  # Default IP address
NMEA_0183_PORT = 10110 # Port for NMEA 0183 messages
NMEA_2000_PORT = 10111 # Port for NMEA 2000 messages

class BoatState:
    def __init__(self):
        # Starting position off Nova Scotia coast
        self.latitude = 44.6476
        self.longitude = -63.5728
        self.speed = 100.0  # knots - adjusted to a more realistic sailing speed
        self.heading = 0.0
        
        # Define waypoints for the trajectory
        self.waypoints = [
            (44.6476, -63.5728),  # Halifax Harbor
            (44.5200, -63.4800),  # Eastern Passage
            (44.4000, -63.3000),  # Off Lawrencetown
            (44.3500, -63.1000),  # Off Sheet Harbor
            (44.4500, -62.9000),  # Further out to sea
            (44.6000, -62.7000),  # Loop back
            (44.7500, -63.0000),  # Approaching coast
            (44.6476, -63.5728),  # Back to start
        ]
        self.current_waypoint = 0

    def update_position(self):
        # Calculate next position based on waypoints
        target = self.waypoints[self.current_waypoint]
        dist_to_waypoint = math.sqrt(
            (self.latitude - target[0])**2 + 
            (self.longitude - target[1])**2
        )
        
        # If close to current waypoint, move to next one
        if dist_to_waypoint < 0.005:  # About 100 meters
            self.current_waypoint = (self.current_waypoint + 1) % len(self.waypoints)
            target = self.waypoints[self.current_waypoint]
        
        # Calculate movement vector
        # Convert knots to degrees per second
        # 1 knot = 1 nautical mile per hour = 1.852 km/h
        # 1 degree of latitude = 111.32 km (approximately)
        # So 1 knot ≈ (1.852 / 111.32) = 0.0166 degrees per hour
        # For per second: 0.0166 / 3600 = 4.63e-6 degrees/second
        dt = 1/SIM_RATE  # our simulation timestep in seconds
        move_speed = self.speed * 4.63e-6 * dt
        
        dx = target[0] - self.latitude
        dy = target[1] - self.longitude
        dist = math.sqrt(dx**2 + dy**2)
        if dist > 0:
            self.latitude += (dx/dist) * move_speed
            self.longitude += (dy/dist) * move_speed
            self.heading = math.degrees(math.atan2(dy, dx))
            # No need to recalculate speed as it's now consistently in knots

    def generate_nmea_0183(self):
        """Generate NMEA 0183 sentences for current boat state."""
        # Convert decimal degrees to NMEA degrees (DDMM.MMMM format)
        lat_deg = abs(self.latitude)
        lat_deg_int = int(lat_deg)
        lat_min = (lat_deg - lat_deg_int) * 60
        lat_str = f"{lat_deg_int:02d}{lat_min:06.3f}"
        lat_dir = "N" if self.latitude >= 0 else "S"
        
        lon_deg = abs(self.longitude)
        lon_deg_int = int(lon_deg)
        lon_min = (lon_deg - lon_deg_int) * 60
        lon_str = f"{lon_deg_int:03d}{lon_min:06.3f}"
        lon_dir = "E" if self.longitude >= 0 else "W"
        
        now = datetime.utcnow()
        time_str = now.strftime("%H%M%S")
        date_str = now.strftime("%d%m%y")
        
        rmc = f"$GPRMC,{time_str},A,{lat_str},{lat_dir},{lon_str},{lon_dir},{self.speed:.1f},{self.heading:.1f},{date_str},000.0,W,A"
        checksum = self.calculate_checksum(rmc)
        return f"{rmc}*{checksum}\r\n"
    
    def generate_nmea_2000(self):
        """Generate NMEA 2000 PGN messages."""
        # PGN 129025 - Position, Rapid Update
        # Simple binary format for example (you might want to use a proper NMEA 2000 library)
        lat_raw = int(self.latitude * 1e7)  # Convert to 1e-7 degrees
        lon_raw = int(self.longitude * 1e7)
        
        # Basic binary message (this is a simplified version)
        pgn_129025 = bytearray([
            0x09, 0xF8, 0x01,  # ISO Header
            0x25, 0x90,        # PGN 129025 (0x1F801)
            lat_raw & 0xFF, (lat_raw >> 8) & 0xFF, (lat_raw >> 16) & 0xFF, (lat_raw >> 24) & 0xFF,
            lon_raw & 0xFF, (lon_raw >> 8) & 0xFF, (lon_raw >> 16) & 0xFF, (lon_raw >> 24) & 0xFF
        ])
        return pgn_129025
    
    def calculate_checksum(self, nmea_str):
        """Calculate the checksum for NMEA 0183 sentence."""
        checksum_data = nmea_str.split("$")[-1].split("*")[0]
        checksum = 0
        for char in checksum_data:
            checksum ^= ord(char)
        return f"{checksum:02X}"

class BoatSimulator:
    def __init__(self, socketio):
        self.boat_state = BoatState()
        self.running = False
        self.socketio = socketio
        self.thread = None
        
        # Setup UDP sockets
        self.nmea_0183_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.nmea_2000_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        

    def simulation_loop(self):
        while self.running:
            self.boat_state.update_position()
            
            # Calculate arrow endpoint for visualization
            arrow_length = 0.002  # Reduced from 0.02 to 0.002
            arrow_dx = arrow_length * math.cos(math.radians(self.boat_state.heading))
            arrow_dy = arrow_length * math.sin(math.radians(self.boat_state.heading))
            
            # Generate and send NMEA 0183 data
            nmea_0183 = self.boat_state.generate_nmea_0183()
            self.nmea_0183_socket.sendto(
                nmea_0183.encode(), 
                (UDP_IP, NMEA_0183_PORT)
            )
            print(f"NMEA 0183 (Port {NMEA_0183_PORT}): {nmea_0183.strip()}")
            
            # Generate and send NMEA 2000 data
            nmea_2000 = self.boat_state.generate_nmea_2000()
            self.nmea_2000_socket.sendto(
                nmea_2000, 
                (UDP_IP, NMEA_2000_PORT)
            )
            print(f"NMEA 2000 (Port {NMEA_2000_PORT}): {nmea_2000.hex()}")
            
            # Updated websocket emission with arrow coordinates
            self.socketio.emit('position_update', {
                'lat': self.boat_state.latitude,
                'lon': self.boat_state.longitude,
                'heading': self.boat_state.heading,
                'speed': self.boat_state.speed,
                'arrow_end': {
                    'lat': self.boat_state.latitude + arrow_dx,
                    'lon': self.boat_state.longitude + arrow_dy
                }
            })
            
            time.sleep(1/SIM_RATE)  # Update every second

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self.simulation_loop)
            self.thread.daemon = True
            self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        self.nmea_0183_socket.close()
        self.nmea_2000_socket.close()