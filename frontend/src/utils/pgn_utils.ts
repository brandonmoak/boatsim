import { BoatPosition } from '../types';

function getDaysSinceEpoch(timestamp: Date): number {
  return Math.floor((timestamp.getTime() - new Date('1980-01-01').getTime()) / (1000 * 60 * 60 * 24));
}

function getSecondsSinceMidnight(timestamp: Date): number {
  return timestamp.getUTCHours() * 3600 + 
         timestamp.getUTCMinutes() * 60 + 
         timestamp.getUTCSeconds();
}

export function createGNSSPositionData(position: BoatPosition, timestamp: Date = new Date()) {
  return {
    pgn: 129029,
    timestamp: timestamp.getTime(),
    fields: {
      SID: 0,  // Sequence ID
      Date: getDaysSinceEpoch(timestamp),
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

export function createRapidPositionData(position: BoatPosition, timestamp: Date = new Date()) {
  return {
    pgn: 129025,
    timestamp: timestamp.getTime(),
    fields: {
      Latitude: position.lat,
      Longitude: position.lon
    }
  };
}

export function createCOGSOGData(position: BoatPosition, timestamp: Date = new Date()) {
  // Convert heading from degrees to radians
  const cogRadians = (position.heading * Math.PI) / 180;
  
  // Calculate SOG from the simulation speed (which is in knots)
  // Convert 100 knots to meters per second (1 knot = 0.514444 m/s)
  const sogMetersPerSecond = 100 * 0.514444;

  return {
    pgn: 129026,
    timestamp: timestamp.getTime(),
    fields: {
      SID: 0,
      COG_Reference: 0, // True (0), Magnetic (1)
      COG: cogRadians,  // Course Over Ground in radians
      SOG: sogMetersPerSecond  // Speed Over Ground in m/s
    }
  };
}

export function createSystemTimeData(timestamp: Date = new Date()) {
  return {
    pgn: 126992,
    timestamp: timestamp.getTime(),
    fields: {
      SID: 0,  // Sequence ID
      Source: 0,  // GPS
      Date: getDaysSinceEpoch(timestamp),
      Time: getSecondsSinceMidnight(timestamp)
    }
  };
} 