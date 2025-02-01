import { getSocket } from '../utils/socket';
import { PGNDefinition } from '../types';

export class PGNEmitter {
  private timerWorker: Worker;
  private pgnConfigs: Record<string, PGNDefinition>;
  private getLatestState: () => Record<string, Record<string, number>>;
  private selectedPGNs: string[];
  private pgnRates: Record<string, number>;
  private requiredPGNs: string[];
  private isEmitting: boolean;

  constructor(
    pgnConfigs: Record<string, PGNDefinition>,
    getLatestState: () => Record<string, Record<string, number>>,
    selectedPGNs: string[] = [],
    pgnRates: Record<string, number> = {},
    requiredPGNs: string[] = []
  ) {
    this.pgnConfigs = pgnConfigs;
    this.getLatestState = getLatestState;
    this.selectedPGNs = selectedPGNs;
    this.pgnRates = pgnRates;
    this.requiredPGNs = requiredPGNs;
    this.isEmitting = false;
    
    // Initialize Web Worker
    this.timerWorker = new Worker(
      new URL('../utils/timer.worker.ts', import.meta.url)
    );
    
    this.setupWorkerMessageHandler();
  }

  private setupWorkerMessageHandler(): void {
    this.timerWorker.onmessage = (e) => {
      const { pgnKey } = e.data;
      const config = this.pgnConfigs[pgnKey];
      if (config) {
        const currentState = this.getLatestState();
        this.emitPGNData(pgnKey, config, currentState);
      }
    };
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

    console.log('Emitting PGN:', pgnUpdate);
    socket.volatile.emit('update_pgn_2000', [pgnUpdate]);
  }

  public start(): void {
    if (this.isEmitting) {
      return;
    }
    this.isEmitting = true;

    // Create array of unique PGNs including required PGNs
    const pgnsToEmit = Array.from(new Set([...this.selectedPGNs, ...this.requiredPGNs]));
    console.log('PGNs to emit:', pgnsToEmit);

    // Configure worker for each PGN
    pgnsToEmit.forEach(pgnKey => {
      const config = this.pgnConfigs[pgnKey];
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

  public updateSelectedPGNs(newSelectedPGNs: string[]): void {
    this.selectedPGNs = newSelectedPGNs;
    if (this.isEmitting) {
        this.stop();
        this.start(); // Restart emission with new PGN selection
    }
  }

  public static getInitialRates(pgnConfigs: Record<string, PGNDefinition>): Record<string, number> {
    return Object.keys(pgnConfigs).reduce((acc, pgnKey) => {
      const config = pgnConfigs[pgnKey];
      return {
        ...acc,
        [pgnKey]: config.TransmissionInterval ? 1000 / config.TransmissionInterval : 1
      };
    }, {});
  }
} 