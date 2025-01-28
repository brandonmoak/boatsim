import { getSocket } from './socket';

interface PGNConfig {
  PGN: number;
  Fields: Array<{
    Name: string;
    [key: string]: any;
  }>;
  TransmissionInterval?: number;
}

type EmissionIntervals = Record<string, NodeJS.Timeout>;
const activeEmissions: EmissionIntervals = {};

const GPS_PGN = '129029';

export const emitPGNData = (
  pgnKey: string, 
  config: PGNConfig, 
  currentValues: Record<string, Record<string, number>>
) => {
  const socket = getSocket();
  if (!socket) {
    console.error('Socket not found');
    return;
  }

  const timestamp = new Date().toISOString();
  const values: Record<string, number> = {};

  // Get the current values for each field from current state
  config.Fields.forEach((field) => {
    const fieldValue = currentValues[pgnKey]?.[field.Name];
    if (fieldValue !== undefined) {
      values[field.Name] = fieldValue;
    }
  });

  const pgnUpdate = {
    timestamp,
    pgn_name: pgnKey,
    pgn_id: config.PGN,
    values: values
  };

  console.log('Emitting PGN data:', pgnUpdate);
  socket.emit('update_pgn_2000', [pgnUpdate]);
};

export const startEmitting = (
  pgnConfigs: Record<string, PGNConfig>,
  getLatestState: () => Record<string, Record<string, number>>,
  selectedPGNs: string[],
  pgnRates: Record<string, number>
) => {
  // Stop any PGNs that are no longer selected
  Object.keys(activeEmissions).forEach(pgnKey => {
    if (!selectedPGNs.includes(pgnKey)) {
      clearInterval(activeEmissions[pgnKey]);
      delete activeEmissions[pgnKey];
    }
  });

  // Create array of unique PGNs including GPS
  const pgnsToEmit = selectedPGNs.includes(GPS_PGN) 
    ? selectedPGNs 
    : [...selectedPGNs, GPS_PGN];

  // Start new intervals for selected PGNs that aren't already running
  pgnsToEmit.forEach(pgnKey => {
    if (activeEmissions[pgnKey]) return; // Skip if already emitting

    const config = pgnConfigs[pgnKey];
    if (!config) return;

    // Calculate interval in milliseconds based on rate (Hz)
    const rate = pgnRates[pgnKey] || 1; // Default to 1Hz if no rate specified
    const interval = 1000 / rate; // Convert Hz to milliseconds
    
    activeEmissions[pgnKey] = setInterval(() => {
      emitPGNData(pgnKey, config, getLatestState());
    }, interval);
  });
};

export const stopEmitting = () => {
  Object.values(activeEmissions).forEach(interval => clearInterval(interval));
  Object.keys(activeEmissions).forEach(key => delete activeEmissions[key]);
};

export const stopEmittingPGN = (pgnKey: string) => {
  if (activeEmissions[pgnKey]) {
    clearInterval(activeEmissions[pgnKey]);
    delete activeEmissions[pgnKey];
  }
}; 