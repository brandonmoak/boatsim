from nmea.nmea_2000_encoder import NMEA2000Encoder
from nmea.nmea_0183_encoder import NMEA0183Encoder

def generate_nmea_2000_messages(pgn_config, pgn_state):
    """Generate all NMEA 2000 PGN messages."""
    messages = []
    
    for pgn_name, config in pgn_config.items():
        pgn = config['pgn']
        encoder_name = f'encode_pgn_{pgn}'
        
        # Try to get the encoder method
        encoder_method = getattr(NMEA2000Encoder, encoder_name, None)
        if not encoder_method:
            print(f"Warning: No encoder method {encoder_name} found for PGN {pgn}")
            continue
        
        try:
            # Get values in the order specified in the YAML parameters
            values = [pgn_state[pgn_name]['values'][param] 
                        for param in config['parameters'].keys()]
            
            # If there's only one parameter, pass it directly
            if len(values) == 1:
                data = encoder_method(values[0])
            else:
                data = encoder_method(*values)
            
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