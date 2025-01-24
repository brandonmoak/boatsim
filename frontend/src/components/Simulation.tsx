import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BoatPosition, SimulationProps, Waypoint } from '../types';
import { loadPGNConfig } from '../utils/pgn_loader';
import { loadWaypoints} from '../utils/waypoint_loader';

const socket = io('http://localhost:5001');

function Simulation({ 
  isSimulating, 
  onPositionUpdate, 
  initialPosition,
  pgnState,
  onPGNUpdate
}: SimulationProps) {
  const [boatPosition, setBoatPosition] = useState<BoatPosition>(initialPosition);
  const [pgnConfig, setPGNConfig] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(0);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  useEffect(() => {
    Promise.all([
      loadPGNConfig(),
      loadWaypoints()
    ]).then(([pgnConfig, waypointConfig]) => {
      setPGNConfig(pgnConfig);
      setWaypoints(waypointConfig);
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

    // Calculate bearing to waypoint
    const targetLat = currentWaypoint.lat;
    const targetLon = currentWaypoint.lon;
    const bearing = calculateBearing(boatPosition.lat, boatPosition.lon, targetLat, targetLon);
    
    // Calculate distance to waypoint
    const distance = calculateDistance(boatPosition.lat, boatPosition.lon, targetLat, targetLon);
    console.log(`Navigating to waypoint ${currentWaypointIndex}:`, {
      distance: distance.toFixed(3) + ' km',
      bearing: bearing.toFixed(1) + '°',
      target: { lat: targetLat, lon: targetLon },
      current: { lat: boatPosition.lat, lon: boatPosition.lon }
    });

    // Check if we've reached the waypoint (within 0.1 km)
    if (distance < 0.1) {
      console.log(`Reached waypoint ${currentWaypointIndex}`);
      setCurrentWaypointIndex(currentWaypointIndex + 1);
    }

    // Speed in knots (hardcoded for now)
    const speed = 100.0;
    
    // Convert knots to degrees per second
    const speedDegPerSec = (speed * 1.852) / (111.0 * 3600.0);
    
    // Use bearing to waypoint as heading
    const headingRad = (bearing * Math.PI) / 180;
    const deltaLat = speedDegPerSec * Math.cos(headingRad) * deltaTime;
    const deltaLon = speedDegPerSec * Math.sin(headingRad) * deltaTime;
    
    const newPosition = {
      lat: boatPosition.lat + deltaLat,
      lon: boatPosition.lon + deltaLon,
      heading: bearing // Update heading to point towards waypoint
    };

    console.log('setting boat position:', newPosition);
    setBoatPosition(newPosition);
    setLastUpdate(currentTime);
    onPositionUpdate(newPosition);
  };

  // Helper function to calculate bearing between two points
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
             Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  };

  // Helper function to calculate distance between two points (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
             Math.cos(φ1) * Math.cos(φ2) *
             Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  useEffect(() => {
    let simulationInterval: NodeJS.Timeout;

    if (isSimulating) {
      simulationInterval = setInterval(() => {
        console.log('Simulation tick');
        updatePosition();
      }, 1000);
    }

    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [isSimulating, boatPosition, onPositionUpdate]);

  return <div />;
}

export default Simulation;