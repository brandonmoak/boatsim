import socket
import binascii
import re
import time

def try_start_commands(sock):
    """Try different start commands and log responses"""
    commands = [
        (b'\xA1\x01\x00\x00', "N2K request"),
        (b'\x11\x02\x00\x00', "NMEA 0183 request"),
        (b'\x11\x01\x00\x00', "Alternative request 1"),
        (b'\x91\x01\x00\x00', "Alternative request 2")
    ]
    
    for cmd, desc in commands:
        try:
            print(f"\nTrying {desc}: {binascii.hexlify(cmd).decode()}")
            sock.send(cmd)
            time.sleep(0.5)  # Wait for response
            
            # Check for response
            data = sock.recv(1024)
            if data:
                print(f"Got response: {binascii.hexlify(data).decode()}")
                return cmd  # Return the working command
            
        except socket.error as e:
            print(f"Error with {desc}: {e}")
    
    return None

def connect_tcp(port, host='192.168.34.11', filter_pattern=None):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    print(f"Connecting to {host}:{port}...")
    
    try:
        sock.connect((host, port))
        print(f"Connected to {host}:{port}")
        
        # Try to find working start command
        working_cmd = try_start_commands(sock)
        if working_cmd:
            print(f"\nFound working command: {binascii.hexlify(working_cmd).decode()}")
        else:
            print("\nNo working command found")
            sock.close()
            return
        
        while True:
            try:
                data = sock.recv(1024)
                if not data:
                    break
                
                try:
                    # Try to decode as text
                    decoded = data.decode().strip()
                    
                    # Apply filter if specified
                    if filter_pattern and not re.search(filter_pattern, decoded):
                        continue
                        
                    print(f"Received text: {decoded}")
                except UnicodeDecodeError:
                    # If decode fails, show as hex
                    hex_data = binascii.hexlify(data).decode('ascii')
                    
                    # Apply filter if specified
                    if filter_pattern and not re.search(filter_pattern, hex_data):
                        continue
                        
                    print(f"Received hex: {hex_data}")
            except socket.error as e:
                print(f"Connection error: {e}")
                break
                
    except socket.error as e:
        print(f"Failed to connect: {e}")
    finally:
        sock.close()
        print("Connection closed")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python tcp_listener.py <port> [filter_pattern]")
        print("Example: python tcp_listener.py 2000 'SEARCH'")
        sys.exit(1)
    
    port = int(sys.argv[1])
    filter_pattern = sys.argv[2] if len(sys.argv) == 3 else None
    connect_tcp(port, filter_pattern=filter_pattern) 