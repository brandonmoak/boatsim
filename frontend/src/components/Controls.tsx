import React, { useState } from 'react';

interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onStart, onStop }) => {
  const [isRunning, setIsRunning] = useState(false);

  const handleStart = () => {
    onStart();
    setIsRunning(true);
  };

  const handleStop = () => {
    onStop();
    setIsRunning(false);
  };

  return (
    <div className="controls">
      <button onClick={handleStart} disabled={isRunning}>
        Start Simulation
      </button>
      <button onClick={handleStop} disabled={!isRunning}>
        Stop Simulation
      </button>
    </div>
  );
};

export default Controls; 