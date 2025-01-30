import { getSocket } from './socket';

interface PGNConfig {
  PGN: number;
  Fields: Array<{
    Name: string;
    [key: string]: any;
  }>;
  TransmissionInterval?: number;
}

type EmissionIntervals = Record<string, number>;
let activeEmissions: EmissionIntervals = {};

// Required PGNs that should always be emitted
const REQUIRED_PGNS = ['129029', '126992', '129025', '129026'];

// Create a Web Worker for timing
const timerWorker = new Worker(
  new URL('./timer.worker.ts', import.meta.url)
);

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

  // Use volatile emit for high-frequency updates
  console.log('Emitting PGN data:', pgnUpdate);
  socket.volatile.emit('update_pgn_2000', [pgnUpdate]);
};

export const startEmitting = (
  pgnConfigs: Record<string, PGNConfig>,
  getLatestState: () => Record<string, Record<string, number>>,
  selectedPGNs: string[],
  pgnRates: Record<string, number>
) => {
  // Stop any existing emissions
  timerWorker.postMessage({ type: 'stop' });
  
  // Create array of unique PGNs including required PGNs
  const pgnsToEmit = Array.from(new Set([...selectedPGNs, ...REQUIRED_PGNS]));

  console.log('PGNs to emit:', pgnsToEmit);

  // Configure worker for each PGN
  pgnsToEmit.forEach(pgnKey => {
    const config = pgnConfigs[pgnKey];
    if (!config) {
      console.error(`No config found for PGN: ${pgnKey}`);
      return;
    }

    const rate = pgnRates[pgnKey] || 1;
    timerWorker.postMessage({ 
      type: 'start',
      pgnKey,
      interval: 1000 / rate 
    });
  });

  // Handle worker messages
  timerWorker.onmessage = (e) => {
    const { pgnKey } = e.data;
    const config = pgnConfigs[pgnKey];
    if (config) {
      emitPGNData(pgnKey, config, getLatestState());
    }
  };
};

export const stopEmitting = () => {
  timerWorker.postMessage({ type: 'stop' });
};

export const stopEmittingPGN = (pgnKey: string) => {
  if (activeEmissions[pgnKey]) {
    cancelAnimationFrame(activeEmissions[pgnKey]);
    delete activeEmissions[pgnKey];
  }
};

// Add a new function to update rates
export const updatePGNRate = (pgnKey: string, rate: number) => {
  timerWorker.postMessage({ 
    type: 'start',
    pgnKey,
    interval: 1000.0 / rate
  });
}; 