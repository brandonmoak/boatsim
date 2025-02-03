import { useEffect, useRef, useState } from 'react';
import { Simulation } from '../core/Simulation';
import { BoatState, Waypoint } from '../types';
import { usePGNStore } from '../stores/pgnStore';

interface SimulationControllerProps {
  isSimulating: boolean;
  waypoints: Waypoint[];
  boatState: BoatState;
  setBoatState: (state: BoatState) => void;
}

function SimulationController({ 
  isSimulating, 
  waypoints,
  boatState,
  setBoatState
}: SimulationControllerProps) {

  const { pgnState } = usePGNStore();
  const simulationRef = useRef<Simulation | null>(null);

  useEffect(() => {
  }, [boatState]);
  
  // Initialize simulation only once when component mounts
  useEffect(() => {
    console.log('Initializing simulation with waypoints:', waypoints);
    // Initialize simulation
    simulationRef.current = new Simulation(
      waypoints,
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

  useEffect(() =>{
    // Take the speed from the pgnState and update the boatState
    setBoatState({
      ...boatState,
      speed_mps: pgnState['128259']['Speed Water Referenced']
    });
  }, [pgnState])

  // Handle simulation start/stop
  useEffect(() => {
    if (!simulationRef.current) return;

    if (isSimulating) {
      const intervalId = setInterval(() => {
        console.log('Updating position', boatState);
        simulationRef.current?.updatePosition(boatState);
      }, 1000); // 1000ms = 1Hz

      // Cleanup interval when isSimulating changes to false or component unmounts
      return () => clearInterval(intervalId);
    }
  }, [isSimulating, boatState]);

  // Component doesn't need to render anything
  return null;
}

export default SimulationController;