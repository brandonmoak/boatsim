import { useState, useEffect } from 'react';
// import { io } from 'socket.io-client';
import Map from './components/Map';
import Controls from './components/Controls';
import PGNPanel from './components/PGNPanel';
import Simulation from './components/Simulation';
import './App.css';
import { BoatPosition } from './types';
import { loadPGNConfig, getInitialPGNState } from './utils/pgn_loader';

// const socket = io('http://localhost:5001');

function App() {
  // Create state variables
  const [isSimulating, setIsSimulating] = useState(false);
  const [pgnState, setPGNState] = useState<Record<string, Record<string, number>>>({});
  const [boatPosition, setBoatPosition] = useState<BoatPosition>({
    lat: 44.6476,
    lon: -63.5728,
    heading: 0
  });

  useEffect(() => {
    loadPGNConfig().then((config) => {
      setPGNState(getInitialPGNState(config));
    });
  }, []);

  useEffect(() => {
    console.log('PGN state:', pgnState);
  }, [pgnState]);

  const handleBoatPositionUpdate = (newPosition: BoatPosition) => {
    setBoatPosition(newPosition);
  };

  const handleStart = () => {
    setIsSimulating(true);
  };

  const handleStop = () => {
    setIsSimulating(false);
  };

  const handlePGNUpdate = (system: string, updates: Record<string, number>) => {
    console.log('PGN update received:', {system, updates });
    setPGNState(prevState => ({
      ...prevState,
      [system]: {
        ...(prevState[system] || {}),
        ...updates
      }
    }));
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
            onPGNUpdate={handlePGNUpdate}
            isSimulating={isSimulating}
          />
        </div>
      </div>
      <Simulation 
        isSimulating={isSimulating} 
        onPositionUpdate={handleBoatPositionUpdate}
        initialPosition={boatPosition}
        pgnState={pgnState}
        onPGNUpdate={handlePGNUpdate}
      />
    </div>
  );
}

export default App; 