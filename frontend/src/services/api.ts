import { API_HEADERS } from '../config/api';
import { PGNDefaults } from '../types';
import { Waypoint } from '../types';

const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || '';
};

// Device-related API calls
export const deviceApi = {
  async getStatus() {
    const response = await fetch(`${getBackendUrl()}/api/device/status`, {
      headers: API_HEADERS
    });
    if (!response.ok) throw new Error('Failed to fetch device status');
    return response.json();
  },

  async connect(devicePath: string) {
    const response = await fetch(`${getBackendUrl()}/api/device/connect`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ devicePath }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to connect device');
    }
    return response.json();
  },

  async disconnect(devicePath: string) {
    const response = await fetch(`${getBackendUrl()}/api/device/disconnect`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ devicePath }),
    });
    if (!response.ok) throw new Error('Failed to disconnect device');
    return response.json();
  }
};

// PGN-related API calls
export const pgnApi = {
  async saveDefaults(defaults: PGNDefaults) {
    const response = await fetch(`${getBackendUrl()}/api/defaults`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(defaults)
    });
    if (!response.ok) {
      throw new Error(`Failed to save defaults: ${response.statusText}`);
    }
    return response.json();
  },

  async getDefaults() {
    const response = await fetch(`${getBackendUrl()}/api/defaults`, {
      headers: API_HEADERS
    });
    if (!response.ok) {
      throw new Error(`Failed to get defaults: ${response.statusText}`);
    }
    return response.json();
  }
};

export const waypointApi = {
  async getWaypoints() {
    const response = await fetch(`${getBackendUrl()}/api/waypoints`, {
      headers: API_HEADERS
    });
    if (!response.ok) {
      throw new Error(`Failed to get waypoints: ${response.statusText}`);
    }
    return response.json();
  },

  async saveWaypoints(waypoints: Waypoint[]) {
    const response = await fetch(`${getBackendUrl()}/api/waypoints`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ waypoints })
    });
    if (!response.ok) {
      throw new Error(`Failed to save waypoints: ${response.statusText}`);
    }
    return response.json();
  }
}; 