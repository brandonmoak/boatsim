from nmea.nmea_2000_encoder import NMEA2000Encoder
from nmea.nmea_0183_encoder import NMEA0183Encoder
from nmea.pgn_config import get_pgn_config

def generate_nmea_2000_messages(pgn_state):
    """Generate all NMEA 2000 PGN messages."""
    messages = []

    for packet in pgn_state:
        pgn = packet['pgn_id']
        values = packet['values']

        print(values)
    
        encoder_name = f'encode_pgn_{pgn}'
        
        # Try to get the encoder method
        encoder_method = getattr(NMEA2000Encoder, encoder_name, None)
        if not encoder_method:
            print(f"Warning: No encoder method {encoder_name} found for PGN {pgn}")
            continue
        
        # encode the values
        try:
            data = encoder_method(**values)
            messages.append(NMEA2000Encoder.create_nmea2000_message(pgn, data))
        except Exception as e:
            print(f"Error encoding PGN {pgn}: {str(e)}")
            continue

    return messages

def generate_nmea_0183_messages(navigation):
    """Generate NMEA 0183 messages."""
    messages = []
    
    # Generate GPRMC (Recommended Minimum Navigation Information)
    rmc = NMEA0183Encoder.encode_gprmc(
        navigation['latitude'],
        navigation['longitude'],
        navigation['speed'],
        navigation['heading']
    )
    messages.append(rmc)
    
    # Generate HCHDT (True Heading)
    hdt = NMEA0183Encoder.encode_hchdt(
        navigation['heading']
    )
    messages.append(hdt)
    
    # Generate VWVHW (Water Speed and Heading)
    vhw = NMEA0183Encoder.encode_vwvhw(
        navigation['heading'],
        navigation['speed']
    )
    messages.append(vhw)
    
    return messages