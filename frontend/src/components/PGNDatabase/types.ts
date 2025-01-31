import { PGNDefinition } from '../../types';

export interface PGNDatabaseProps {
  isOpen: boolean;
  onClose: () => void;
  pgnDefinitions: Record<string, PGNDefinition>;
  defaultPGNs: Record<string, Record<string, number>>;
  onUpdateDefaults: (newDefaults: Record<string, Record<string, number>>) => void;
  selectedPGNs: string[];
  onAddToSimulation: (pgn: string) => void;
  getCurrentPGNValues: (pgn: string) => Record<string, number>;
}

export type TabType = 'all' | 'defaults';

export interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pgnOptions: Array<{ value: string; label: string }>;
  handleAddDefault: (option: { value: string; label: string } | null) => void;
  onClose: () => void;
  onSaveDefaults: () => void;
  isSaving: boolean;
}

export interface PGNItemProps {
  pgn: string;
  definition: PGNDefinition;
  isDefault: boolean;
  activeTab: TabType;
  onRemoveDefault: (pgn: string) => void;
  onAddToDefaults: (pgn: string) => void;
  onAddToSimulation: (pgn: string) => void;
  editedValues: Record<string, Record<string, number>>;
  onValueChange: (pgn: string, fieldName: string, value: string) => void;
  isSelected: (pgn: string) => boolean;
} 