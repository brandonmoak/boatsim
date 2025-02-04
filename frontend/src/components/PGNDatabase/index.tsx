import React, { useState, useMemo } from 'react';
import { TabType } from './types';
import PGNDatabaseHeader from './PGNDatabaseHeader';
import PGNItem from './PGNItem';
import './PGNDatabase.css';
import { pgnApi } from '../../services/api';
import { PGNDefinition } from '../../types';
import { usePGNStore } from '../../stores/pgnStore';

export interface PGNDatabaseProps {
  isOpen: boolean;
  onClose: () => void;
  pgnDefinitions: Record<string, PGNDefinition>;
  selectedPGNs: string[];
  onAddToSimulation: (pgn: string) => void;
}

const PGNDatabase: React.FC<PGNDatabaseProps> = ({
  isOpen,
  onClose,
  pgnDefinitions,
  selectedPGNs,
  onAddToSimulation,
}) => {
  const { addPGNToDefault, removePGNFromDefault, updatePGNDefault, pgnDefault, } = usePGNStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const pgnOptions = useMemo(() => 
    Object.entries(pgnDefinitions).map(([key, def]) => ({
      value: key,
      label: `${key} - ${def.Description}`
    })),
    [pgnDefinitions]
  );

  const handleAddDefault = (option: { pgn: string; description: string } | null) => {
    if (option) {
      addPGNToDefault(option.pgn, pgnDefault[option.pgn]);
    }
  };

  const handleRemoveDefault = (pgn: string) => {
    removePGNFromDefault(pgn);
  };

  const handleValueChange = (pgn: string, fieldName: string, value: string) => {
    const fields = {
      ...pgnDefault[pgn],
      [fieldName]: parseFloat(value)
    }
    updatePGNDefault(pgn, fields);
  };

  const handleAddToDefaults = (pgn: string) => {
    addPGNToDefault(pgn, {});
  };

  const handleSaveDefaults = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await pgnApi.saveDefaults(pgnDefault);
      alert('Default values saved successfully!');
    } catch (error) {
      console.error('Error saving defaults:', error);
      setSaveError('Failed to save defaults. Please try again.');
      alert('Failed to save defaults');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPGNs = useMemo(() => {
    const pgns = activeTab === 'defaults' 
      ? Object.keys(pgnDefault)
      : Object.keys(pgnDefinitions);

    if (!searchTerm) return pgns;

    return pgns.filter(pgn => 
      pgn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pgnDefinitions[pgn]?.Description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, searchTerm, pgnDefault, pgnDefinitions]);

  if (!isOpen) return null;

  return (
    <div className="pgn-database-overlay">
      <div className="pgn-database-content">
        <PGNDatabaseHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          pgnOptions={pgnOptions}
          handleAddDefault={handleAddDefault}
          onClose={onClose}
          onSaveDefaults={handleSaveDefaults}
          isSaving={isSaving}
        />
        {saveError && (
          <div className="error-message">
            {saveError}
          </div>
        )}
        <div className="pgn-database-body">
          {filteredPGNs.map(pgn => (
            <PGNItem
              key={pgn}
              pgn={pgn}
              definition={pgnDefinitions[pgn]}
              isDefault={pgn in pgnDefault}
              activeTab={activeTab}
              onRemoveDefault={handleRemoveDefault}
              onAddToDefaults={handleAddToDefaults}
              onAddToSimulation={onAddToSimulation}
              editedValues={pgnDefault}
              onValueChange={handleValueChange}
              isSelected={(p) => selectedPGNs.includes(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PGNDatabase; 