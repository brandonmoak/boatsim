import { useEffect, useRef, useState } from 'react';
import { Simulation } from '../core/Simulation';
import { BoatState, Waypoint } from '../types';

interface SimulationControllerProps {
  isSimulating: boolean;
  onPGNFieldsUpdate: (system: string, fields: any) => void;
  waypoints: Waypoint[];
  boatState: BoatState;
  setBoatState: (state: BoatState) => void;
}

function SimulationController({ 
  isSimulating, 
  onPGNFieldsUpdate,
  waypoints,
  boatState,
  setBoatState
}: SimulationControllerProps) {
  const simulationRef = useRef<Simulation | null>(null);

  useEffect(() => {
  }, [boatState]);
  
  // Initialize simulation only once when component mounts
  useEffect(() => {
    console.log('Initializing simulation with waypoints:', waypoints);
    // Initialize simulation
    simulationRef.current = new Simulation(
      boatState,
      setBoatState,
      waypoints,
      onPGNFieldsUpdate
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  // Update waypoints when they change
  useEffect(() => {
    if (simulationRef.current) {
      console.log('Updating waypoints:', waypoints);
      simulationRef.current.updateWaypoints(waypoints);
    }
  }, [waypoints]);

  // Handle simulation start/stop
  useEffect(() => {
    if (!simulationRef.current) return;

    if (isSimulating) {
      const intervalId = setInterval(() => {
        console.log('Updating position', boatState);
        const newPosition = simulationRef.current?.updatePosition(boatState);
        if (newPosition) {
          setBoatState(newPosition);
        }
      }, 1000); // 1000ms = 1Hz

      // Cleanup interval when isSimulating changes to false or component unmounts
      return () => clearInterval(intervalId);
    }
  }, [isSimulating, boatState]);

  // Component doesn't need to render anything
  return null;
}

export default SimulationController;