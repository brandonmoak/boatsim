export interface Waypoint {
    name: string;
    lat: number;
    lon: number;
  } 

export interface BoatPosition {
  lat: number;
  lon: number;
  heading: number;
}

export interface SimulationProps {
  isSimulating: boolean;
  onStartSimulation?: () => void;
  onPositionUpdate: (position: BoatPosition) => void;
  initialPosition: BoatPosition;
  pgnState: Record<string, Record<string, number>>;
  onPGNUpdate: (system: string, updates: Record<string, number>) => void;
}

export interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  isRunning: boolean;
} 