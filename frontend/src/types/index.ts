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
  onPositionUpdate: (position: BoatPosition) => void;
  initialPosition: BoatPosition;
  onPGNFieldsUpdate: (pgnKey: string, fields: Record<string, number>) => void;
  waypoints: Waypoint[];
}

export interface ControlsProps {
  onStart: () => void;
  onStop: () => void;
  isRunning: boolean;
}

// PGN Types
export interface PGNDefaults {
  [key: string]: PGNDefaultField; 
}

export interface PGNDefaultField {
    [key: string]: number;
}

export interface PGNField {
    Order: number;
    Id: string;
    Name: string;
    Description?: string;
    BitLength: number;
    BitOffset: number;
    BitStart: number;
    Resolution?: number;
    Signed?: boolean;
    Unit?: string;  // Note: it's "Unit" not "Units" in the JSON
    RangeMin?: number;
    RangeMax?: number;
    FieldType: string;
    LookupEnumeration?: string;
    EnumValues?: Record<string, string>;
    PhysicalQuantity?: string;
}

export interface PGNDefinition {
    PGN: number;
    Id: string;
    Description: string;
    Priority?: number;
    Fields: PGNField[];
    Length?: number;
    RepeatingFields?: number;
    Type?: string;
    Complete?: boolean;
    FieldCount?: number;
    TransmissionInterval?: number;
}

// PGN Update Types
export interface PGNUpdate {
  type: 'rate' | 'value';
  field?: string;
  value?: number;
  [key: string]: any;  // Allow additional fields for bulk updates
}

// Add PGNPanel props interface
export interface PGNPanelProps {
  pgnState: Record<string, Record<string, number>>;
  pgnRates: Record<string, number>;
  onPGNFieldsUpdate: (pgnKey: string, fields: Record<string, number>) => void;
  onPGNRateUpdate: (pgnKey: string, rate: number) => void;
  onSelectedPGNsChange: (pgns: string[]) => void;
} 