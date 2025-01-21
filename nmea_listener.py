import socket
import binascii

def listen_nmea(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(('', port))  # Bind to all interfaces
    print(f"Listening for NMEA data on port {port}...")
    
    while True:
        data, addr = sock.recvfrom(1024)
        try:
            # Try to decode as NMEA 0183 (text)
            decoded = data.decode().strip()
            print(f"Received NMEA 0183: {decoded}")
        except UnicodeDecodeError:
            # If decode fails, treat as NMEA 2000 (binary)
            hex_data = binascii.hexlify(data).decode('ascii')
            print(f"Received NMEA 2000 (hex): {hex_data}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python udp_listener.py <port>")
        print("Example: python udp_listener.py 60001")
        sys.exit(1)
    
    port = int(sys.argv[1])
    listen_nmea(port) 