import { PGNDefinition } from '../../types';



export type TabType = 'all' | 'defaults';

export interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pgnOptions: Array<{ value: string; label: string }>;
  handleAddDefault: (option: { pgn: string; description: string } | null) => void;
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