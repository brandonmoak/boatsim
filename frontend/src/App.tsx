import { useState, useEffect, useRef } from 'react';
import './App.css';
// Types
import { 
  BoatState, 
  PGNDefaults, 
  Waypoint,
} from './types';
// Stores
import { usePGNStore, PGNState } from './stores/pgnStore';

// Components
import Map from './components/Map';
import PGNPanel from './components/PGNPanel';
import SimulationController from './components/SimulationController';

// Utils
import { initSocket } from './services/socket';
import { loadPGNConfig } from './utils/pgn_definition_loader';
import { getInitialPGNState, getDefaultPGNs } from './utils/pgn_defaults_loader';
import { loadWaypoints } from './utils/waypoint_loader';
import { PGNEmitter } from './core/PGNEmitter';

// Add this constant at the top of the file with other imports
const SIMULATED_PGNS = ['129029', '126992', '129025', '129026', '128259'];

function App() {
  // Initialize stores
  const {
    pgnState,
    replacePGNState,
    updatePGNFields,
  } = usePGNStore();

  // Create state variables
  const [isSimulating, setIsSimulating] = useState(false);
  const pgnStateRef = useRef(pgnState);
  const [boatState, setBoatState] = useState<BoatState>({ lat: 44.6476, lon: -63.5728, heading: 0, speed_mps: 10 });
  const [selectedPGNs, setSelectedPGNs] = useState<string[]>([]);
  const [pgnRates, setPgnRates] = useState<Record<string, number>>({});
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [defaultPGNs, setDefaultPGNs] = useState<PGNDefaults>({});
  const [pgnEmitter, setPgnEmitter] = useState<PGNEmitter | null>(null);

  useEffect(() => {
    console.log("initializing socket");
    initSocket();
    console.log("socket initialized");
    Promise.all([
      loadPGNConfig(),
      loadWaypoints(),
      getDefaultPGNs()
    ]).then(([config, loadedWaypoints, defaults]) => {
      replacePGNState(getInitialPGNState(config));
      setWaypoints(loadedWaypoints);
      setDefaultPGNs(defaults);
      setSelectedPGNs(Object.keys(defaults));
      setPgnRates(PGNEmitter.getInitialRates(config));

      // Initialize PGNEmitter
      const emitter = new PGNEmitter(
        config,
        () => pgnStateRef.current,
        Object.keys(defaults),
        PGNEmitter.getInitialRates(config),
        SIMULATED_PGNS
      );
      setPgnEmitter(emitter);
      
      console.log('Waypoints:', loadedWaypoints);
    });
  }, []);

  useEffect(() => {
    console.log('pgnState', pgnState);
      pgnStateRef.current = pgnState;
  }, [pgnState]);

  const handleSelectedPGNsChange = (newSelectedPGNs: string[]) => {
    setSelectedPGNs(newSelectedPGNs);
    pgnEmitter?.updateSelectedPGNs(newSelectedPGNs);
  };

  return (
    <div className="App">
      <div className="main-container">
        <div className="map-container">
          <Map 
            boatState={boatState} 
            waypoints={waypoints}
          />
        </div>
        <PGNPanel 
          selectedPGNs={selectedPGNs}
          simulatedPGNs={SIMULATED_PGNS}
          onSelectedPGNsChange={handleSelectedPGNsChange}
          defaultPGNs={defaultPGNs}
          updateDefaultPGNs={(newDefaults: PGNDefaults) => {setDefaultPGNs(newDefaults)}}
          onStart={() => {
            setIsSimulating(true);
            pgnEmitter?.start();
          }}
          onStop={() => {
            setIsSimulating(false);
            pgnEmitter?.stop();
          }}
          isSimulating={isSimulating}
        />
      </div>
      <SimulationController
        isSimulating={isSimulating} 
        waypoints={waypoints}
        boatState={boatState}
        setBoatState={setBoatState}
      />
    </div>
  );
}

export default App; 