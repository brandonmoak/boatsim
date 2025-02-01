import React from 'react';
import { ControlsProps } from '../types';

const Controls: React.FC<ControlsProps> = ({ onStart, onStop, isRunning }) => {
  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // Stop event bubbling
    onStart();
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // Stop event bubbling
    onStop();
  };

  return (
    <div className="controls" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={handleStartClick}
        disabled={isRunning}
      >
        Start Simulation
      </button>
      <button 
        onClick={handleStopClick}
        disabled={!isRunning}
      >
        Stop Simulation
      </button>
    </div>
  );
};

export default Controls; 