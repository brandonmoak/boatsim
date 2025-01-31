import { useEffect, useState } from 'react';
import LatLon from 'geodesy/latlon-spherical.js';
import { BoatState, SimulationProps } from '../types';
import { loadPGNConfig } from '../utils/pgn_loader';
import { 
  createGNSSPositionData, 
  createRapidPositionData, 
  createCOGSOGData, 
  createSystemTimeData 
} from '../utils/pgn_factory';

function Simulation({ 
  isSimulating, 
  onPositionUpdate, 
  initialPosition,
  onPGNFieldsUpdate,
  waypoints
}: SimulationProps) {
  const [boatPosition, setBoatPosition] = useState<BoatState>(initialPosition);
  const [pgnConfig, setPGNConfig] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);

  useEffect(() => {
    Promise.all([
      loadPGNConfig(),
    ]).then(([pgnConfig]) => {
      setPGNConfig(pgnConfig);
    });
  }, []);

  const updatePosition = () => {
    const currentTime = new Date();
    const deltaTime = (currentTime.getTime() - lastUpdate.getTime()) / 1000;
    
    // Get current waypoint
    const currentWaypoint = waypoints[currentWaypointIndex];
    if (!currentWaypoint) {
      console.log('No more waypoints to navigate to');
      return;
    }

    // Validate current position
    if (isNaN(boatPosition.lat) || isNaN(boatPosition.lon)) {
      console.error('Invalid boat position:', boatPosition);
      return;
    }

    // Calculate bearing to waypoint
    const targetLat = currentWaypoint.lat;
    const targetLon = currentWaypoint.lon;
    
    // Validate target position
    if (isNaN(targetLat) || isNaN(targetLon)) {
      console.error('Invalid waypoint position:', currentWaypoint);
      return;
    }

    const bearing = calculateBearing(boatPosition.lat, boatPosition.lon, targetLat, targetLon);
    const distance = calculateDistance(boatPosition.lat, boatPosition.lon, targetLat, targetLon);

    // Log navigation details
    console.log('Navigation update:', {
      currentPosition: { lat: boatPosition.lat, lon: boatPosition.lon },
      targetPosition: { lat: targetLat, lon: targetLon },
      bearing,
      distance,
      deltaTime
    });

    // Check if we've reached the waypoint (within 0.1 km)
    if (distance < 0.1) {
      console.log(`Reached waypoint ${currentWaypointIndex}`);
      setCurrentWaypointIndex(currentWaypointIndex + 1);
      return;
    }

    // Speed in knots (hardcoded for now)
    const speed = 100.0; // Reduced from 100 to make movement more manageable

    // Convert knots to kilometers per second
    const speedKmPerSec = (speed * 1.852) / 3600; // Convert knots to km/s
    
    // Calculate position change
    const distanceToMove = speedKmPerSec * deltaTime;
    
    // Use great circle calculation for new position
    const currentPoint = new LatLon(boatPosition.lat, boatPosition.lon);
    const newPoint = currentPoint.destinationPoint(distanceToMove * 1000, bearing); // Convert km to meters

    const newPosition = {
      lat: newPoint.lat,
      lon: newPoint.lon,
      heading: bearing,
      speed: speed
    };

    // Validate new position before updating
    if (isNaN(newPosition.lat) || isNaN(newPosition.lon)) {
      console.error('Invalid new position calculated:', newPosition);
      return;
    }

    setBoatPosition(newPosition);
    setLastUpdate(currentTime);
    onPositionUpdate(newPosition);

    // Update PGN states
    if (pgnConfig) {
      // Create all PGN messages with the same timestamp
      const currentTime = new Date();
      
      // GNSS Position Data (129029)
      const pgn129029 = createGNSSPositionData(newPosition, currentTime);
      onPGNFieldsUpdate('129029', pgn129029.fields);

      // Rapid Position Data (129025)
      const pgn129025 = createRapidPositionData(newPosition, currentTime);
      onPGNFieldsUpdate('129025', pgn129025.fields);

      // COG & SOG Data (129026)
      const pgn129026 = createCOGSOGData(newPosition, currentTime);
      onPGNFieldsUpdate('129026', pgn129026.fields);

      // System Time (126992)
      const pgn126992 = createSystemTimeData(currentTime);
      onPGNFieldsUpdate('126992', pgn126992.fields);
    }
  };

  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const p1 = new LatLon(lat1, lon1);
    const p2 = new LatLon(lat2, lon2);
    return p1.initialBearingTo(p2);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const p1 = new LatLon(lat1, lon1);
    const p2 = new LatLon(lat2, lon2);
    return p1.distanceTo(p2) / 1000; // Convert meters to kilometers
  };

  useEffect(() => {
    let simulationInterval: NodeJS.Timeout;

    if (isSimulating) {
      console.log('Starting simulation interval');
      simulationInterval = setInterval(() => {
        console.log('Simulation tick');
        updatePosition();
      }, 1000);
    }

    return () => {
      if (simulationInterval) {
        console.log('Clearing simulation interval');
        clearInterval(simulationInterval);
      }
    };
  }, [isSimulating, updatePosition]);

  return <div />;
}

export default Simulation;