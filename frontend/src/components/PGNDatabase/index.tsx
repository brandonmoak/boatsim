import React, { useState, useMemo } from 'react';
import { PGNDatabaseProps, TabType } from './types';
import PGNDatabaseHeader from './PGNDatabaseHeader';
import PGNItem from './PGNItem';
import './PGNDatabase.css';

const PGNDatabase: React.FC<PGNDatabaseProps> = ({
  isOpen,
  onClose,
  pgnDefinitions,
  defaultPGNs,
  onUpdateDefaults,
  selectedPGNs,
  onAddToSimulation,
  getCurrentPGNValues
}) => {
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

  const handleAddDefault = (option: { value: string; label: string } | null) => {
    if (option) {
      const newValues = {
        ...defaultPGNs,
        [option.value]: getCurrentPGNValues(option.value)
      };
      onUpdateDefaults(newValues);
    }
  };

  const handleRemoveDefault = (pgn: string) => {
    const newValues = { ...defaultPGNs };
    delete newValues[pgn];
    onUpdateDefaults(newValues);
  };

  const handleValueChange = (pgn: string, fieldName: string, value: string) => {
    const newValues = {
      ...defaultPGNs,
      [pgn]: {
        ...defaultPGNs[pgn],
        [fieldName]: parseFloat(value)
      }
    };
    onUpdateDefaults(newValues);
  };

  const handleAddToDefaults = (pgn: string) => {
    const newValues = {
      ...defaultPGNs,
      [pgn]: getCurrentPGNValues(pgn)
    };
    onUpdateDefaults(newValues);
  };

  const handleSaveDefaults = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const backendPort = process.env.REACT_APP_BACKEND_PORT;
      const response = await fetch(`http://localhost:${backendPort}/api/defaults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultPGNs)
      });

      if (!response.ok) {
        throw new Error(`Failed to save defaults: ${response.statusText}`);
      }

      // Optional: Update local state with server response if needed
      const savedDefaults = await response.json();
      onUpdateDefaults(savedDefaults);

      // Show success message
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
      ? Object.keys(defaultPGNs)
      : Object.keys(pgnDefinitions);

    if (!searchTerm) return pgns;

    return pgns.filter(pgn => 
      pgn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pgnDefinitions[pgn]?.Description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeTab, searchTerm, defaultPGNs, pgnDefinitions]);

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
              isDefault={pgn in defaultPGNs}
              activeTab={activeTab}
              onRemoveDefault={handleRemoveDefault}
              onAddToDefaults={handleAddToDefaults}
              onAddToSimulation={onAddToSimulation}
              editedValues={defaultPGNs}
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