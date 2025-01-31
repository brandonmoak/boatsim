import { useState, useEffect, useRef } from 'react';
import './App.css';
// Components
import Map from './components/Map';
import PGNPanel from './components/PGNPanel';
import Simulation from './components/Simulation';
import PGNDatabase from './components/PGNDatabase';
// Types
import { 
  BoatState, 
  Waypoint,
  PGNDefinition
} from './types';
// Utils
import { initSocket } from './utils/socket';
import { loadPGNConfig, getInitialPGNState, getDefaultPGNs } from './utils/pgn_loader';
import { startEmitting, stopEmitting} from './utils/pgn_emitter';
import { loadWaypoints } from './utils/waypoint_loader';


function App() {
  // Create state variables
  const [isSimulating, setIsSimulating] = useState(false);
  const [pgnState, setPGNState] = useState<Record<string, Record<string, number>>>({});
  const pgnStateRef = useRef(pgnState);
  const [pgnConfig, setPgnConfig] = useState<Record<string, any>>({});
  const [boatState, setBoatState] = useState<BoatState>({ lat: 44.6476, lon: -63.5728, heading: 0, speed_mps: 10 });
  const [selectedPGNs, setSelectedPGNs] = useState<string[]>([]);
  const [pgnRates, setPgnRates] = useState<Record<string, number>>({});
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
  const [defaultPGNs, setDefaultPGNs] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    initSocket();
    Promise.all([
      loadPGNConfig(),
      loadWaypoints(),
      getDefaultPGNs()
    ]).then(([config, loadedWaypoints, defaults]) => {
      setPgnConfig(config);
      setPGNState(getInitialPGNState(config));
      setWaypoints(loadedWaypoints);
      setDefaultPGNs(defaults);
      setSelectedPGNs(Object.keys(defaults));
      
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

  // Function to update defaults that we can pass down
  const updateDefaultPGNs = (newDefaults: Record<string, Record<string, number>>) => {
    setDefaultPGNs(newDefaults);
    // TODO: When backend is ready, make API call here
  };

  const handleAddToSimulation = (pgn: string) => {
    console.log('Adding PGN to simulation:', pgn);
    if (!selectedPGNs.includes(pgn)) {
      const newSelectedPGNs = [...selectedPGNs, pgn];
      handleSelectedPGNsChange(newSelectedPGNs);
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
          <button 
            className="database-button"
            onClick={() => setIsDatabaseViewerOpen(true)}
          >
            View PGN Database
          </button>
          <PGNPanel 
            pgnState={pgnState}
            pgnRates={pgnRates}
            selectedPGNs={selectedPGNs}
            onPGNFieldsUpdate={handlePGNFieldsUpdate}
            onPGNRateUpdate={handlePGNRateUpdate}
            onSelectedPGNsChange={handleSelectedPGNsChange}
          />
          <PGNDatabase
            isOpen={isDatabaseViewerOpen}
            onClose={() => setIsDatabaseViewerOpen(false)}
            pgnDefinitions={pgnConfig}
            defaultPGNs={defaultPGNs}
            onUpdateDefaults={updateDefaultPGNs}
            onAddToSimulation={handleAddToSimulation}
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