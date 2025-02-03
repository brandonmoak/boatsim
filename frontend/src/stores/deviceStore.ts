import { create } from 'zustand';
import { deviceApi } from '../services/api';

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
            const devices = await deviceApi.getStatus();
            console.log("devices", devices);
            set({ devices });
        } catch (error) {
            console.error('Error fetching device status:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to fetch device status' });
        }
    },

    connectDevice: async (devicePath) => {
        set({ isConnecting: true, error: null });
        try {
            await deviceApi.connect(devicePath);
            await get().fetchDeviceStatus();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect device';
            set({ error: errorMessage });
        } finally {
            set({ isConnecting: false });
        }
    },

    disconnectDevice: async (devicePath) => {
        try {
            await deviceApi.disconnect(devicePath);
            await get().fetchDeviceStatus();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect device';
            set({ error: errorMessage });
        }
    },
})); 