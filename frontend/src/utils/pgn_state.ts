import { PGNState } from '../stores/pgnStore';

// Add this function to get current PGN state values
export const getCurrentPGNValues = (pgn: string, pgnState: PGNState): Record<string, number> => {
// First try to get values from current PGN state
  const currentValues = pgnState[pgn];
  if (currentValues && Object.keys(currentValues).length > 0) {
    return currentValues;
  }
  return {};
};

export function updatePGNState(pgnState: PGNState, pgn: string, fields: Record<string, number>) {
  return {
    ...pgnState,
    [pgn]: {
      ...pgnState[pgn],
      ...fields
    }
  };
}