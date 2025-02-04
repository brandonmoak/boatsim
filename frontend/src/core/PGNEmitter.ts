import { getSocket } from '../services/socket';
import { PGNDefinition } from '../types';
import { usePGNStore } from '../stores/pgnStore';
import { useEmitterStore } from '../stores/emitterStore';

export class PGNEmitter {
  private timerWorker: Worker;
  private getLatestState: () => Record<string, Record<string, number>>;
  private pgnRates: Record<string, number>;
  private isEmitting: boolean;
  private pgnDefinitions: Record<string, PGNDefinition>;

  constructor(
    getLatestState: () => Record<string, Record<string, number>>,
    pgnRates: Record<string, number> = {},
  ) {
    const { pgnDefinitions } = usePGNStore.getState();
    this.getLatestState = getLatestState;
    this.pgnRates = pgnRates;
    this.isEmitting = false;
    this.pgnDefinitions = pgnDefinitions;

    // Initialize Web Worker
    this.timerWorker = new Worker(
      new URL('../utils/timer.worker.ts', import.meta.url)
    );
    
    this.setupWorkerMessageHandler();
  }

  private setupWorkerMessageHandler(): void {
    this.timerWorker.onmessage = (e) => {
      const { pgnKey } = e.data;
      const config = this.pgnDefinitions[pgnKey];
      if (config) {
        const currentState = this.getLatestState();
        this.emitPGNData(pgnKey, config, currentState);
      }
    };
  }

  private get_stream_line({timestamp, pgn_name, pgn_id, values}: {timestamp: string, pgn_name: string, pgn_id: number, values: Record<string, number>}): string {
    // Format timestamp to remove 'T' and 'Z' and use space instead
    const formattedTimestamp = timestamp.replace('T', ' ').replace('Z', '');
    
    // Custom JSON formatting without escapes
    const formattedValues = '{' + Object.entries(values)
      .map(([key, value]) => `${key}:${value}`)
      .join(' | ') + '}';
      
    return `${formattedTimestamp} ${pgn_id} ${pgn_name} ${formattedValues}`;
  }

  private emitPGNData(
    pgnKey: string,
    config: PGNDefinition,
    currentValues: Record<string, Record<string, number>>
  ): void {
    const socket = getSocket();
    if (!socket) {
      console.error('Socket not found');
      return;
    }

    const { appendToStreamLog } = useEmitterStore.getState();

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
      pgn_name: config.Id,
      pgn_id: config.PGN,
      values: values
    };

    if (config.PGN === 129029 || config.PGN === 129025) {
      if (values.Latitude === 0 || values.Longitude === 0) { 
        console.log('Latitude or Longitude is 0, skipping PGN emission');
        return;
      }
    }

    // console.log('Emitting PGN:', pgnUpdate);
    const log_string = this.get_stream_line(pgnUpdate);
    appendToStreamLog(log_string);
    socket.volatile.emit('update_pgn_2000', [pgnUpdate]);
  }

  public start(): void {
    if (this.isEmitting) {
      return;
    }
    this.isEmitting = true;

    // Create array of unique PGNs including required PGNs
    const { PGNsToStream } = useEmitterStore.getState();
    console.log('PGNs to emit:', PGNsToStream);

    // Configure worker for each PGN
    PGNsToStream.forEach(pgnKey => {
      const config = this.pgnDefinitions[pgnKey];
      if (!config) {
        console.error(`No config found for PGN: ${pgnKey}`);
        return;
      }

      const rate = this.pgnRates[pgnKey] || 1;
      this.timerWorker.postMessage({ 
        type: 'start',
        pgnKey,
        interval: 1000 / rate 
      });
    });
  }

  public stop(): void {
    this.timerWorker.postMessage({ type: 'stop' });
    this.isEmitting = false;
  }

  public updateRate(pgnKey: string, rate: number): void {
    this.pgnRates[pgnKey] = rate;
    if (this.isEmitting) {
        this.timerWorker.postMessage({ 
            type: 'start',
            pgnKey,
            interval: 1000.0 / rate
        });
    }
  }

  public updateSelectedPGNs(): void {
    if (this.isEmitting) {
        this.stop();
        this.start(); // Restart emission with new PGN selection
    }
  }
} 