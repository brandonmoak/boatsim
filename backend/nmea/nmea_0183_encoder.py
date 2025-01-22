from datetime import datetime

class NMEA0183Encoder:
    @staticmethod
    def calculate_checksum(nmea_str):
        """Calculate the checksum for NMEA 0183 sentence."""
        checksum_data = nmea_str.split("$")[-1].split("*")[0]
        checksum = 0
        for char in checksum_data:
            checksum ^= ord(char)
        return f"{checksum:02X}"

    @staticmethod
    def encode_gprmc(latitude, longitude, speed, heading):
        """Generate NMEA 0183 GPRMC (Recommended Minimum Navigation Information) sentence."""
        # Convert decimal degrees to NMEA degrees (DDMM.MMMM format)
        lat_deg = abs(latitude)
        lat_deg_int = int(lat_deg)
        lat_min = (lat_deg - lat_deg_int) * 60
        lat_str = f"{lat_deg_int:02d}{lat_min:06.3f}"
        lat_dir = "N" if latitude >= 0 else "S"
        
        lon_deg = abs(longitude)
        lon_deg_int = int(lon_deg)
        lon_min = (lon_deg - lon_deg_int) * 60
        lon_str = f"{lon_deg_int:03d}{lon_min:06.3f}"
        lon_dir = "E" if longitude >= 0 else "W"
        
        now = datetime.utcnow()
        time_str = now.strftime("%H%M%S")
        date_str = now.strftime("%d%m%y")
        
        rmc = f"$GPRMC,{time_str},A,{lat_str},{lat_dir},{lon_str},{lon_dir},{speed:.1f},{heading:.1f},{date_str},000.0,W,A"
        checksum = NMEA0183Encoder.calculate_checksum(rmc)
        return f"{rmc}*{checksum}\r\n"

    @staticmethod
    def checksum(sentence):
        """Calculate NMEA 0183 checksum."""
        # Remove $ or ! and everything after *
        s = sentence.strip('$!').split('*')[0]
        # XOR all characters between $ and *
        chk = 0
        for c in s:
            chk ^= ord(c)
        return f"{chk:02X}"  # Return 2-digit hex

    @staticmethod
    def encode_hchdt(heading):
        """Encode HCHDT (Heading - True)"""
        sentence = f"HCHDT,{heading:.1f},T"
        chk = NMEA0183Encoder.checksum(sentence)
        return f"${sentence}*{chk}\r\n"

    @staticmethod
    def encode_vwvhw(heading, speed):
        """Encode VWVHW (Water Speed and Heading)"""
        # Convert speed to km/h for VHW
        speed_kmh = speed * 1.852
        sentence = f"VWVHW,{heading:.1f},T,,M,{speed:.1f},N,{speed_kmh:.1f},K"
        chk = NMEA0183Encoder.checksum(sentence)
        return f"${sentence}*{chk}\r\n"

    @staticmethod
    def encode_wimwv(wind_angle, wind_speed):
        """Encode WIMWV (Wind Speed and Angle)"""
        # R = Relative, T = True
        # A = Valid, V = Invalid
        sentence = f"WIMWV,{wind_angle:.1f},R,{wind_speed:.1f},N,A"
        chk = NMEA0183Encoder.checksum(sentence)
        return f"${sentence}*{chk}\r\n"

    @staticmethod
    def encode_sddbt(depth):
        """Encode SDDBT (Depth Below Transducer)"""
        # Convert to feet and fathoms
        depth_f = depth * 3.28084
        depth_F = depth * 0.546807
        sentence = f"SDDBT,{depth_f:.1f},f,{depth:.1f},M,{depth_F:.1f},F"
        chk = NMEA0183Encoder.checksum(sentence)
        return f"${sentence}*{chk}\r\n" 