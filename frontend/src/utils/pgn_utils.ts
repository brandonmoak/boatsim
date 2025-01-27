import { BoatPosition } from '../types';

export function createGNSSPositionData(position: BoatPosition, timestamp: Date = new Date()) {
  return {
    pgn: 129029,
    timestamp: timestamp.getTime(),
    fields: {
      SID: 0,  // Sequence ID
      Date: timestamp.getUTCDate(),
      Time: timestamp.getUTCHours() * 10000 + 
            timestamp.getUTCMinutes() * 100 + 
            timestamp.getUTCSeconds(),
      Latitude: position.lat,
      Longitude: position.lon,
      Altitude: 0.0, // Assuming sea level
      GNSS_type: 0, // GPS
      Method: 1, // GNSS fix
      Integrity: 0, // No integrity checking
      Number_of_SVs: 10, // Simulated number of satellites
      HDOP: 1.0, // Horizontal dilution of precision
      PDOP: 1.0, // Position dilution of precision
      GeoidalSeparation: 0.0,
      Reference_Stations: 0,
      Reference_Station_Type: 0,
      Reference_Station_ID: 0
    }
  };
} 