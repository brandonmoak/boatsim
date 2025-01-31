import { useState, useEffect, useRef } from 'react';
import './App.css';
// Components
import Map from './components/Map';
import PGNPanel from './components/PGNPanel';
import Simulation from './components/Simulation';
// Types
import { 
  BoatState, 
  Waypoint
} from './types';
// Utils
import { initSocket } from './utils/socket';
import { loadPGNConfig, getInitialPGNState } from './utils/pgn_loader';
import { startEmitting, stopEmitting} from './utils/pgn_emitter';
import { loadWaypoints } from './utils/waypoint_loader';


function App() {
  // Create state variables
  const [isSimulating, setIsSimulating] = useState(false);
  const [pgnState, setPGNState] = useState<Record<string, Record<string, number>>>({});
  const pgnStateRef = useRef(pgnState);
  const [pgnConfig, setPgnConfig] = useState<Record<string, any>>({});
  const [boatState, setBoatState] = useState<BoatState>({ 
    lat: 44.6476, 
    lon: -63.5728, 
    heading: 0,
    speed_mps: 10
  });
  const [selectedPGNs, setSelectedPGNs] = useState<string[]>([]);
  const [pgnRates, setPgnRates] = useState<Record<string, number>>({});
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  useEffect(() => {
    initSocket();
    Promise.all([
      loadPGNConfig(),
      loadWaypoints()
    ]).then(([config, loadedWaypoints]) => {
      setPgnConfig(config);
      setPGNState(getInitialPGNState(config));
      setWaypoints(loadedWaypoints);
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

  useEffect(() => {
    console.log('Boat state:', boatState);
  }, [boatState]);

  useEffect(() => {
    pgnStateRef.current = pgnState;
  }, [pgnState]);

  const handleStart = () => {
    setIsSimulating(true);
    console.log('Starting simulation');
    startEmitting(pgnConfig, () => pgnStateRef.current, selectedPGNs, pgnRates);
  };

  const handleStop = () => {
    setIsSimulating(false);
    stopEmitting();
  };

  const handlePGNFieldsUpdate = (system: string, fields: Record<string, number>) => {
    // If the PGN is 128259, update the boat state with either water or ground referenced speed
    console.log('PGN fields update:', system, fields);
    if (system === '128259') {
      const speed = fields['Speed Water Referenced'] ?? fields['Speed Ground Referenced'];
      if (typeof speed !== 'undefined') {
        console.log('Speed data received:', speed);
        setBoatState(prevState => ({
          ...prevState,
          speed_mps: speed
        }));
      }
    }

    setPGNState(prevState => ({
      ...prevState,
      [system]: {
        ...prevState[system],
        ...fields
      }
    }));
  };

  const handlePGNRateUpdate = (system: string, rate: number) => {
    setPgnRates(prevRates => ({
      ...prevRates,
      [system]: rate
    }));
    
    if (isSimulating) {
      stopEmitting();
      startEmitting(pgnConfig, () => pgnStateRef.current, selectedPGNs, {
        ...pgnRates,
        [system]: rate
      });
    }
    console.log('PGN rate updated:', system, rate);
  };

  const handleSelectedPGNsChange = (newSelectedPGNs: string[]) => {
    setSelectedPGNs(newSelectedPGNs);
    
    if (isSimulating) {
      stopEmitting();
      console.log('Handling selected PGN change:', newSelectedPGNs);
      startEmitting(pgnConfig, () => pgnStateRef.current, newSelectedPGNs, pgnRates);
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="map-container">
          <Map 
            boatState={boatState} 
            waypoints={waypoints}
            onStart={handleStart}
            onStop={handleStop}
            isSimulating={isSimulating}
          />
        </div>
        <div className="pgn-container">
          <PGNPanel 
            pgnState={pgnState}
            pgnRates={pgnRates}
            onPGNFieldsUpdate={handlePGNFieldsUpdate}
            onPGNRateUpdate={handlePGNRateUpdate}
            onSelectedPGNsChange={handleSelectedPGNsChange}
          />
        </div>
      </div>
      <Simulation 
        isSimulating={isSimulating} 
        onPGNFieldsUpdate={handlePGNFieldsUpdate}
        waypoints={waypoints}
        boatState={boatState}
        setBoatState={setBoatState}
      />
    </div>
  );
}

export default App; 