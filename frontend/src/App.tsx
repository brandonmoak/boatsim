import React from 'react';
import { io } from 'socket.io-client';
import Map from './components/Map';
import Controls from './components/Controls';
import PGNPanel from './components/PGNPanel';
import './App.css';

const socket = io('http://localhost:5001');

function App() {
  const handleStart = () => {
    socket.emit('start_simulation');
  };

  const handleStop = () => {
    socket.emit('stop_simulation');
  };

  return (
    <div className="App">
      <Map socket={socket} />
      <Controls onStart={handleStart} onStop={handleStop} />
      <PGNPanel socket={socket} />
    </div>
  );
}

export default App; 