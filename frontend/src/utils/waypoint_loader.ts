import waypointsConfig from '../config/waypoints.yaml';
import { Waypoint } from '../types';

export function loadWaypoints(): Waypoint[] {
    return waypointsConfig.waypoints;
} 