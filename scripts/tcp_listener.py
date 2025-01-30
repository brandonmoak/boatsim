import socket
import binascii
import re

def listen_tcp(port, host='192.168.34.11', filter_pattern=None):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('', port))  # Bind to all interfaces
    sock.listen(1)
    print(f"Listening for TCP connections on port {port}, accepting data from {host}...")
    
    while True:
        conn, addr = sock.accept()
        client_ip = addr[0]
        
        # Only process data from the specified host
        if client_ip != host:
            print(f"Rejected connection from unauthorized IP: {client_ip}")
            conn.close()
            continue
            
        print(f"Accepted connection from {client_ip}")
        
        while True:
            try:
                data = conn.recv(1024)
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
            except socket.error:
                break
                
        conn.close()
        print("Connection closed")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("Usage: python tcp_listener.py <port> [filter_pattern]")
        print("Example: python tcp_listener.py 2000 'SEARCH'")
        sys.exit(1)
    
    port = int(sys.argv[1])
    filter_pattern = sys.argv[2] if len(sys.argv) == 3 else None
    listen_tcp(port, filter_pattern=filter_pattern) 