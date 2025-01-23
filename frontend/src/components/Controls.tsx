import React from 'react';
import { ControlsProps } from '../types';

const Controls: React.FC<ControlsProps> = ({ onStart, onStop, isRunning }) => {
  return (
    <div className="controls">
      <button 
        onClick={onStart} 
        disabled={isRunning}
      >
        Start Simulation
      </button>
      <button 
        onClick={onStop}
        disabled={!isRunning}
      >
        Stop Simulation
      </button>
    </div>
  );
};

export default Controls; 