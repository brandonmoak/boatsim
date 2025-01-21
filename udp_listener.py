import socket

def listen_nmea(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(('', port))  # Bind to all interfaces
    print(f"Listening for NMEA data on port {port}...")
    
    while True:
        data, addr = sock.recvfrom(1024)
        print(f"Received: {data.decode().strip()}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python udp_listener.py <port>")
        print("Example: python udp_listener.py 60001")
        sys.exit(1)
    
    port = int(sys.argv[1])
    listen_nmea(port) 