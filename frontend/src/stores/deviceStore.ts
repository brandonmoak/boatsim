import { create } from 'zustand';

interface DeviceStatus {
    status: 'connected' | 'disconnected';
    path: string;
    type: string;  // Adding the type property
    // Add any other device status properties you need
}

interface DeviceStore {
    // State
    devices: Record<string, DeviceStatus>;
    error: string | null;
    isConnecting: boolean;
    isAddingSerial: boolean;
    isAddingTcp: boolean;
    tcpDetails: {
        ipAddress: string;
        port: string;
    };

    // Actions
    setDevices: (devices: Record<string, DeviceStatus>) => void;
    setError: (error: string | null) => void;
    setIsConnecting: (isConnecting: boolean) => void;
    setIsAddingSerial: (isAdding: boolean) => void;
    setIsAddingTcp: (isAdding: boolean) => void;
    setTcpDetails: (details: { ipAddress: string; port: string }) => void;
    clearError: () => void;

    // Async actions
    fetchDeviceStatus: () => Promise<void>;
    connectDevice: (devicePath: string) => Promise<void>;
    disconnectDevice: (devicePath: string) => Promise<void>;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
    // Initial state
    devices: {},
    error: null,
    isConnecting: false,
    isAddingSerial: false,
    isAddingTcp: false,
    tcpDetails: {
        ipAddress: '',
        port: ''
    },

    // Actions
    setDevices: (devices) => set({ devices }),
    setError: (error) => set({ error }),
    setIsConnecting: (isConnecting) => set({ isConnecting }),
    setIsAddingSerial: (isAddingSerial) => set({ isAddingSerial }),
    setIsAddingTcp: (isAddingTcp) => set({ isAddingTcp }),
    setTcpDetails: (tcpDetails) => set({ tcpDetails }),
    clearError: () => set({ error: null }),

    // Async actions
    fetchDeviceStatus: async () => {
        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            const backendPort = process.env.REACT_APP_BACKEND_PORT;
            const response = await fetch(`http://${backendUrl}:${backendPort}/api/device/status`);
            if (!response.ok) throw new Error('Failed to fetch device status');
            const devices = await response.json();
            set({ devices });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch device status' });
        }
    },

    connectDevice: async (devicePath) => {
        set({ isConnecting: true, error: null });
        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            const backendPort = process.env.REACT_APP_BACKEND_PORT;
            const response = await fetch(`http://${backendUrl}:${backendPort}/api/device/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ devicePath }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to connect device');
            }
            await get().fetchDeviceStatus();
        } catch (error) {
            // Ensure we're setting a string as the error
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect device';
            set({ error: errorMessage });
        } finally {
            set({ isConnecting: false });
        }
    },

    disconnectDevice: async (devicePath) => {
        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL;
            const backendPort = process.env.REACT_APP_BACKEND_PORT;
            const response = await fetch(`http://${backendUrl}:${backendPort}/api/device/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ devicePath }),
            });
            if (!response.ok) throw new Error('Failed to disconnect device');
            await get().fetchDeviceStatus();
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to disconnect device' });
        }
    },
})); 