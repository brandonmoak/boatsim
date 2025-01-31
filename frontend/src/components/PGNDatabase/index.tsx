import React, { useState, useMemo, useEffect } from 'react';
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
  onAddToSimulation
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPGN, setSelectedPGN] = useState<string | null>(null);

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
        [option.value]: {}
      };
      setSelectedPGN(option.value);
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
      [pgn]: {}
    };
    onUpdateDefaults(newValues);
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
          selectedPGN={selectedPGN}
          pgnOptions={pgnOptions}
          handleAddDefault={handleAddDefault}
          onClose={onClose}
        />
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
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PGNDatabase; 