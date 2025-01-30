import { useState, useEffect } from 'react';
import './App.css';
// Components
import Map from './components/Map';
import Controls from './components/Controls';
import PGNPanel from './components/PGNPanel';
import Simulation from './components/Simulation';
// Types
import { 
  BoatPosition, 
  PGNUpdate, 
} from './types';
// Utils
import { initSocket } from './utils/socket';
import { loadPGNConfig, getInitialPGNState } from './utils/pgn_loader';
import { startEmitting, stopEmitting, stopEmittingPGN } from './utils/pgn_emitter';


function App() {
  // Create state variables
  const [isSimulating, setIsSimulating] = useState(false);
  const [pgnState, setPGNState] = useState<Record<string, Record<string, number>>>({});
  const [pgnConfig, setPgnConfig] = useState<Record<string, any>>({});
  const [boatPosition, setBoatPosition] = useState<BoatPosition>({ lat: 44.6476, lon: -63.5728, heading: 0 });
  const [selectedPGNs, setSelectedPGNs] = useState<string[]>([]);
  const [pgnRates, setPgnRates] = useState<Record<string, number>>({});

  useEffect(() => {
    initSocket();
    loadPGNConfig().then((config) => {
      setPgnConfig(config);
      setPGNState(getInitialPGNState(config));
      // Initialize rates using TransmissionInterval from config (converting ms to Hz)
      const initialRates = Object.keys(config).reduce((acc, pgn) => {
        const interval = config[pgn]?.TransmissionInterval;
        return {
          ...acc,
          [pgn]: interval ? 1000 / interval : 1
        };
      }, {});
      setPgnRates(initialRates);
    });
  }, []);

  useEffect(() => {
    console.log('PGN state:', pgnState);
  }, [pgnState]);

  const handleStart = () => {
    setIsSimulating(true);
    console.log('Starting simulation');
    startEmitting(pgnConfig, () => pgnState, selectedPGNs, pgnRates);
  };

  const handleStop = () => {
    setIsSimulating(false);
    stopEmitting();
  };

  const handlePGNUpdate = (system: string, update: PGNUpdate) => {
    if (update.type === 'rate' && update.value !== undefined) {
      setPgnRates(prevRates => ({
        ...prevRates,
        [system]: update.value as number
      }));
    } else {
      setPGNState(prevState => ({
        ...prevState,
        [system]: {
          ...prevState[system],
          ...(update as Record<string, number>)
        }
      }));
    }
  };

  const handleSelectedPGNsChange = (newSelectedPGNs: string[]) => {
    setSelectedPGNs(newSelectedPGNs);
    
    if (isSimulating) {
      stopEmitting();
      console.log('Handling selected PGN change:', newSelectedPGNs);
      startEmitting(pgnConfig, () => pgnState, newSelectedPGNs, pgnRates);
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="map-container">
          <Map boatPosition={boatPosition} />
          <Controls 
            onStart={handleStart} 
            onStop={handleStop} 
            isRunning={isSimulating}
          />
        </div>
        <div className="pgn-container">
          <PGNPanel 
            pgnState={pgnState}
            pgnRates={pgnRates}
            onPGNUpdate={handlePGNUpdate}
            onSelectedPGNsChange={handleSelectedPGNsChange}
          />
        </div>
      </div>
      <Simulation 
        isSimulating={isSimulating} 
        onPositionUpdate={setBoatPosition}
        initialPosition={boatPosition}
        pgnState={pgnState}
        onPGNUpdate={(system, updates) => {
          handlePGNUpdate(system, updates);
        }}
      />
    </div>
  );
}

export default App; 