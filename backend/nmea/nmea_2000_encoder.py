class NMEA2000Encoder:
    # Common PGN definitions
    PGN_VESSEL_HEADING = 127250
    PGN_RATE_OF_TURN = 127251
    PGN_SPEED = 128259
    PGN_WATER_DEPTH = 128267
    PGN_POSITION = 129025
    PGN_WIND_DATA = 130306
    PGN_ENGINE_PARAMS = 127488
    PGN_TEMPERATURE = 130312
    PGN_ENGINE_PARAMS_DYNAMIC = 127489
    PGN_ENGINE_PARAMS_STATIC = 127498
    PGN_TRANSMISSION = 127493
    PGN_DC_STATUS = 127508  # Battery Status
    PGN_FLUID_LEVEL = 127505  # Fluid Level

    @staticmethod
    def create_nmea2000_message(pgn, data):
        """Create a complete NMEA 2000 message"""
        # Use 4 bytes for PGN instead of 2
        message = bytearray(4)  # 4 byte header
        message[0:4] = pgn.to_bytes(4, 'little')  # PGN in header
        message.extend(data)    # Append data
        print("message", message)
        return message

    @staticmethod
    def encode_pgn_127250(heading, deviation=0.0, variation=0.0):
        """Vessel Heading"""
        # Convert to radians and pack as bytes
        heading_rad = heading * 0.0174533
        data = bytearray(8)
        data[0:2] = int(heading_rad * 10000).to_bytes(2, 'little')
        data[2:4] = int(deviation * 10000).to_bytes(2, 'little')
        data[4:6] = int(variation * 10000).to_bytes(2, 'little')
        return data

    @staticmethod
    def encode_pgn_128259(speed, speed_through_water=0.0):
        """Speed"""
        # Convert to m/s and pack
        data = bytearray(8)
        data[0:2] = int(speed * 0.514444 * 100).to_bytes(2, 'little')  # SOG
        data[2:4] = int(speed_through_water * 0.514444 * 100).to_bytes(2, 'little')  # STW
        return data

    @staticmethod
    def encode_pgn_127488(rpm, engine_instance=0, boost_pressure=0, tilt_trim=0):
        """Engine Parameters, Rapid Update
        Args:
            rpm: Engine speed in RPM
            engine_instance: Engine number (0 for single engine, 0-n for multiple engines)
            boost_pressure: Turbocharger boost pressure in PSI
            tilt_trim: Engine tilt/trim position in percent (-100 to 100)
        """
        data = bytearray(8)
        data[0] = engine_instance & 0xFF  # Engine instance
        data[1:3] = int(rpm * 4).to_bytes(2, 'little')  # Convert to 1/4 RPM units
        data[3:5] = int(boost_pressure * 6894.76).to_bytes(2, 'little')  # Convert PSI to 100 Pa units
        data[5] = tilt_trim & 0xFF  # Tilt/trim percentage
        data[6:8] = (0xFFFF).to_bytes(2, 'little')  # Reserved bits, set to all 1's
        return data

    @staticmethod
    def encode_pgn_130312(temp, source):
        """Temperature"""
        data = bytearray(8)
        data[0] = source  # 0=sea, 1=outside, 2=inside, 3=engine room, etc.
        data[1:3] = int(temp * 100).to_bytes(2, 'little')
        return data

    @staticmethod
    def encode_pgn_127489(engine_data):
        """Engine Parameters, Dynamic"""
        data = bytearray(26)  # Full message is 26 bytes
        # Engine load (%)
        data[0] = int(engine_data.get('load', 0))
        # Engine torque (%)
        data[1] = int(engine_data.get('torque', 0))
        # Engine oil pressure (kPa)
        oil_pressure = int(engine_data.get('oil_pressure', 0) * 6.89476)  # Convert PSI to kPa
        data[2:4] = oil_pressure.to_bytes(2, 'little')
        # Engine coolant temperature (K)
        coolant_temp = int((engine_data.get('coolant_temp', 0) + 273.15))  # Convert C to K
        data[4:6] = coolant_temp.to_bytes(2, 'little')
        # Engine hours
        hours = int(engine_data.get('hours', 0) * 3600)  # Convert to seconds
        data[6:10] = hours.to_bytes(4, 'little')
        # Engine coolant pressure
        coolant_pressure = int(engine_data.get('coolant_pressure', 0))
        data[10:12] = coolant_pressure.to_bytes(2, 'little')
        # Fuel pressure
        fuel_pressure = int(engine_data.get('fuel_pressure', 0))
        data[12:14] = fuel_pressure.to_bytes(2, 'little')
        return data

    @staticmethod
    def encode_pgn_127493(transmission_data):
        """Transmission Parameters, Dynamic"""
        data = bytearray(8)
        # Gear position (0=neutral, 1=forward, 2=reverse)
        data[0] = transmission_data.get('gear', 0)
        # Oil pressure
        oil_pressure = int(transmission_data.get('oil_pressure', 0))
        data[1:3] = oil_pressure.to_bytes(2, 'little')
        # Oil temperature
        oil_temp = int(transmission_data.get('oil_temp', 0) + 273.15)
        data[3:5] = oil_temp.to_bytes(2, 'little')
        return data

    @staticmethod
    def encode_pgn_129025(latitude, longitude):
        """Generate NMEA 2000 PGN 129025 (Position, Rapid Update) message."""
        # PGN 129025 - Position, Rapid Update
        lat_raw = int(latitude * 1e7)  # Convert to 1e-7 degrees
        lon_raw = int(longitude * 1e7)
        
        # Basic binary message (simplified version)
        pgn_129025 = bytearray([
            0x09, 0xF8, 0x01,  # ISO Header
            0x25, 0x90,        # PGN 129025 (0x1F801)
            lat_raw & 0xFF, (lat_raw >> 8) & 0xFF, (lat_raw >> 16) & 0xFF, (lat_raw >> 24) & 0xFF,
            lon_raw & 0xFF, (lon_raw >> 8) & 0xFF, (lon_raw >> 16) & 0xFF, (lon_raw >> 24) & 0xFF
        ])
        return pgn_129025

    @staticmethod
    def encode_pgn_127508(voltage, current=0.0, temperature=25.0):
        """Battery Status"""
        data = bytearray(8)
        # Convert voltage to millivolts
        data[0:2] = int(voltage * 1000).to_bytes(2, 'little')
        # Convert current to decisamperes
        data[2:4] = int(current * 10).to_bytes(2, 'little')
        # Temperature in Kelvin (0.1K resolution)
        data[4:6] = int((temperature + 273.15) * 10).to_bytes(2, 'little')
        return data

    @staticmethod
    def encode_pgn_127505(level, capacity=100, tank_type=0):
        """Fluid Level
        tank_type: 0=fuel, 1=water, 2=gray water, 3=live well, 4=oil, 5=black water
        """
        data = bytearray(8)
        # Level as percentage (0.004% resolution)
        data[0:2] = int(level * 250).to_bytes(2, 'little')
        # Capacity in liters
        data[2:4] = int(capacity).to_bytes(2, 'little')
        # Tank type
        data[4] = tank_type
        return data

    @staticmethod
    def encode_pgn_128267(depth, offset=0.0):
        """Water Depth"""
        data = bytearray(8)
        data[0:2] = int(depth * 100).to_bytes(2, 'little')  # Depth in centimeters
        data[2:4] = int(offset * 100).to_bytes(2, 'little')  # Offset in centimeters
        return data

    @staticmethod
    def encode_pgn_130306(wind_speed, wind_angle):
        """Wind Data"""
        data = bytearray(8)
        # Wind speed in 0.01 m/s
        data[0:2] = int(wind_speed * 0.514444 * 100).to_bytes(2, 'little')
        # Wind angle in radians * 10000
        data[2:4] = int(wind_angle * 0.0174533 * 10000).to_bytes(2, 'little')
        return data 