import { Waypoint } from '../types';
import { waypointApi } from '../services/api';

export async function loadWaypoints(): Promise<Waypoint[]> {
    try {
        const response = await waypointApi.getWaypoints();
        return response.waypoints;
    } catch (error) {
        console.error('Error loading waypoints:', error);
        return [];
    }
}

export async function saveWaypoints(waypoints: Waypoint[]): Promise<void> {
    try {
        await waypointApi.saveWaypoints(waypoints);
    } catch (error) {
        console.error('Error saving waypoints:', error);
        throw error;
    }
} 