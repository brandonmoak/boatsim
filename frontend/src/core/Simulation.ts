import LatLon from 'geodesy/latlon-spherical.js';
import { BoatState } from '../types';
import { loadPGNConfig } from '../utils/pgn_definition_loader';
import { 
  createGNSSPositionData, 
  createRapidPositionData, 
  createCOGSOGData, 
  createSystemTimeData,
  createSpeedData
} from '../utils/pgn_factory';
import { usePGNStore } from '../stores/pgnStore';

export class Simulation {
  private lastUpdate: Date;
  private currentWaypointIndex: number;
  private waypoints: Array<{lat: number, lon: number}>;

  constructor(
    waypoints: Array<{lat: number, lon: number}>,
  ) {
    console.log('Initializing simulation!', waypoints);
    this.lastUpdate = new Date();
    this.currentWaypointIndex = 0;
    this.waypoints = waypoints;
  }

  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const p1 = new LatLon(lat1, lon1);
    const p2 = new LatLon(lat2, lon2);
    return p1.initialBearingTo(p2);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const p1 = new LatLon(lat1, lon1);
    const p2 = new LatLon(lat2, lon2);
    return p1.distanceTo(p2) / 1000; // Convert meters to kilometers
  }

  public updatePosition(currentBoatState: BoatState): BoatState {
    const currentTime = new Date();
    const deltaTime = (currentTime.getTime() - this.lastUpdate.getTime()) / 1000;
    
    // Get current waypoint
    const currentWaypoint = this.waypoints[this.currentWaypointIndex];
    if (!currentWaypoint) {
      console.log('No more waypoints to navigate to');
      return currentBoatState;
    }

    // Validate current position
    if (isNaN(currentBoatState.lat) || isNaN(currentBoatState.lon)) {
      console.error('Invalid boat position:', currentBoatState);
      return currentBoatState;
    }

    // Calculate bearing to waypoint
    const targetLat = currentWaypoint.lat;
    const targetLon = currentWaypoint.lon;
    
    // Validate target position
    if (isNaN(targetLat) || isNaN(targetLon)) {
      console.error('Invalid waypoint position:', currentWaypoint);
      return currentBoatState;
    }

    const bearing = this.calculateBearing(currentBoatState.lat, currentBoatState.lon, targetLat, targetLon);
    const distance = this.calculateDistance(currentBoatState.lat, currentBoatState.lon, targetLat, targetLon);

    // Log navigation details
    console.log('Navigation update:', {
      currentPosition: { lat: currentBoatState.lat, lon: currentBoatState.lon },
      targetPosition: { lat: targetLat, lon: targetLon },
      bearing,
      distance,
      deltaTime
    });

    // Check if we've reached the waypoint (within 0.1 km)
    if (distance < 0.1) {
      console.log(`Reached waypoint ${this.currentWaypointIndex}`);
      this.currentWaypointIndex++;
      return currentBoatState;
    }

    // Speed in m/s
    const speed = currentBoatState.speed_mps;

    // Convert m/s to km/s
    const speedKmPerSec = speed / 1000;
    
    // Calculate position change in kilometers
    const distanceToMove = speedKmPerSec * deltaTime;
    
    // Use great circle calculation for new position
    const currentPoint = new LatLon(currentBoatState.lat, currentBoatState.lon);
    const newPoint = currentPoint.destinationPoint(distanceToMove * 1000, bearing); // Convert km to meters

    const newPosition: BoatState = {
      lat: newPoint.lat,
      lon: newPoint.lon,
      heading: bearing,
      speed_mps: speed
    };

    // Validate new position before updating
    if (isNaN(newPosition.lat) || isNaN(newPosition.lon)) {
      console.error('Invalid new position calculated:', newPosition);
      return currentBoatState;
    }

    this.lastUpdate = currentTime;
    this.updatePGNs(newPosition, currentTime);
    return newPosition;
  }

  private updatePGNs(position: BoatState, currentTime: Date) {
    const { updatePGNFields } = usePGNStore.getState();
    // Create all PGN messages with the same timestamp
    const pgn129029 = createGNSSPositionData(position, currentTime);
    updatePGNFields('129029', pgn129029.fields);

    const pgn129025 = createRapidPositionData(position, currentTime);
    updatePGNFields('129025', pgn129025.fields);

    const pgn129026 = createCOGSOGData(position, currentTime);
    updatePGNFields('129026', pgn129026.fields);

    const pgn126992 = createSystemTimeData(currentTime);
    updatePGNFields('126992', pgn126992.fields);

    const pgn128259 = createSpeedData(position, currentTime);
    updatePGNFields('128259', pgn128259.fields);
  }

  public updateWaypoints(newWaypoints: Array<{lat: number, lon: number}>) {
    this.waypoints = newWaypoints;
  }
} 

