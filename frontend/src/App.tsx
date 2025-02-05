import { useState, useEffect } from 'react';
import './App.css';
// Types
import { 
  BoatState, 
  Waypoint,
} from './types';
// Stores
import { usePGNStore } from './stores/pgnStore';
import { useEmitterStore } from './stores/emitterStore';

// Components
import Map from './components/Map';
import PGNPanel from './components/PGNPanel';
import SimulationController from './components/SimulationController';
import EmitterController from './components/EmitterController';
import PGNDatabase from './components/PGNDatabase';
import DeviceConnector from './components/DeviceConnector';

// Utils
import { initSocket } from './services/socket';
import { loadPGNConfig } from './utils/pgn_definition_loader';
import { getDefaultPGNs } from './utils/pgn_defaults_loader';
import { loadWaypoints } from './utils/waypoint_loader';

// Add this constant at the top of the file with other imports
const SIMULATED_PGNS = ['129029', '126992', '129025', '129026', '128259'];

function App() {
  // Initialize stores
  const { initializePGNStore } = usePGNStore();
  const { setPGNsToStream, setIsEmitting, streamLog, toggleStreamLog } = useEmitterStore();

  // Create state variables
  const [isSimulating, setIsSimulating] = useState(false);
  const [boatState, setBoatState] = useState<BoatState>({ lat: 44.6476, lon: -63.5728, heading: 0, speed_mps: 10 });
  const [selectedPGNs, setSelectedPGNs] = useState<string[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [hasConnectedDevices, setHasConnectedDevices] = useState(false);

  useEffect(() => {
    initSocket();
    Promise.all([
      loadPGNConfig(),
      loadWaypoints(),
      getDefaultPGNs()
    ]).then(([config, loadedWaypoints, defaults]) => {
      initializePGNStore(config, defaults);
      setWaypoints(loadedWaypoints);
      setSelectedPGNs(Object.keys(defaults));

      const defaultPGNs = Object.keys(defaults);
      const uniquePGNs = Array.from(new Set([...defaultPGNs, ...SIMULATED_PGNS]));
      setPGNsToStream(uniquePGNs);

      console.log('Waypoints:', loadedWaypoints);
    }).catch(error => {
      console.error('Error initializing application:', error);
    });
  }, [initializePGNStore]);

  const handleSelectedPGNsChange = (newSelectedPGNs: string[]) => {
    setSelectedPGNs(newSelectedPGNs);
  };

  const handleConnectionStatusChange = (hasConnections: boolean) => {
    setHasConnectedDevices(hasConnections);
  };

  const handleAddToSimulation = (pgn: string) => {
    if (!selectedPGNs.includes(pgn)) {
      setSelectedPGNs([...selectedPGNs, pgn]);
    }
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
          onStart={() => {setIsSimulating(true); setIsEmitting(true);}}
          onStop={() => {setIsSimulating(false); setIsEmitting(false);}}
          isSimulating={isSimulating}
          onOpenDatabase={() => setIsDatabaseViewerOpen(true)}
          onToggleDeviceMenu={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
          onToggleEmitLogs={toggleStreamLog}
          hasConnectedDevices={hasConnectedDevices}
        />
      </div>
      {isDatabaseViewerOpen && (
        <PGNDatabase
          isOpen={isDatabaseViewerOpen}
          onClose={() => setIsDatabaseViewerOpen(false)}
          pgnDefinitions={usePGNStore.getState().pgnDefinitions}
          selectedPGNs={selectedPGNs}
          onAddToSimulation={handleAddToSimulation}
        />
      )}
      {isDeviceMenuOpen && (
        <DeviceConnector 
          className="device-menu-overlay" 
          onClose={() => setIsDeviceMenuOpen(false)}
          onConnectionStatusChange={handleConnectionStatusChange}
        />
      )}
      <SimulationController
        isSimulating={isSimulating} 
        waypoints={waypoints}
        boatState={boatState}
        setBoatState={setBoatState}
      />
      <EmitterController />
    </div>
  );
}

export default App; 