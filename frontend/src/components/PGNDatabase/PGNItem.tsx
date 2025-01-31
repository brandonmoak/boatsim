import React from 'react';
import { PGNDefinition, PGNField } from '../../types';
import { TabType } from './types';
import PGNFieldsTable from './PGNFieldsTable';

interface PGNItemProps {
  pgn: string;
  definition: PGNDefinition;
  isDefault: boolean;
  activeTab: TabType;
  onRemoveDefault: (pgn: string) => void;
  onAddToDefaults: (pgn: string) => void;
  onAddToSimulation: (pgn: string) => void;
  editedValues: Record<string, Record<string, number>>;
  onValueChange: (pgn: string, fieldName: string, value: string) => void;
}

const PGNItem: React.FC<PGNItemProps> = ({
  pgn,
  definition,
  isDefault,
  activeTab,
  onRemoveDefault,
  onAddToDefaults,
  onAddToSimulation,
  editedValues,
  onValueChange
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  // Initialize default values if needed
  React.useEffect(() => {
    if (isDefault && (!editedValues[pgn] || Object.keys(editedValues[pgn]).length === 0)) {
      // Initialize default values for the new PGN using RangeMin values
      const initialValues: Record<string, number> = {};
      definition.Fields.forEach(field => {
        initialValues[field.Name] = field.RangeMin ?? 0;
      });
      
      // Update each field with initial values
      Object.entries(initialValues).forEach(([fieldName, value]) => {
        onValueChange(pgn, fieldName, value.toString());
      });
    }
  }, [pgn, isDefault, definition.Fields, editedValues]);

  const getFieldStep = (field: PGNField) => {
    if (field.Resolution) return field.Resolution;
    if (field.FieldType === 'NUMBER') return 0.1;
    return 1;
  };

  const getFieldMin = (field: PGNField) => {
    if (field.RangeMin !== undefined) return field.RangeMin;
    if (field.Signed) return -(2 ** (field.BitLength - 1));
    return 0;
  };

  const getFieldMax = (field: PGNField) => {
    if (field.RangeMax !== undefined) return field.RangeMax;
    if (field.Signed) return (2 ** (field.BitLength - 1)) - 1;
    return (2 ** field.BitLength) - 1;
  };

  return (
    <div className="pgn-database-item">
      <div 
        className="pgn-database-item-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ cursor: 'pointer' }}
      >
        <div className="pgn-header-content">
          <span className="pgn-number">PGN {pgn}</span>
          <span className="pgn-description">{definition.Description}</span>
          {isDefault && <span className="default-badge">Default</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDefault && activeTab === 'defaults' && (
            <button 
              className="remove-default-button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveDefault(pgn);
              }}
              title="Remove from defaults"
            >
              Remove
            </button>
          )}
          {!isDefault && activeTab === 'all' && (
            <button
              className="add-to-defaults-button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToDefaults(pgn);
              }}
              title="Add to defaults"
            >
              Add to Default
            </button>
          )}
          {activeTab === 'all' && (
            <button
              className="add-to-simulation-button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToSimulation(pgn);
              }}
              title="Add to simulation"
            >
              Add to Simulation
            </button>
          )}
          <span className={`collapse-arrow ${!isCollapsed ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
      </div>
      {!isCollapsed && (
        <PGNFieldsTable 
          fields={definition.Fields}
          pgn={pgn}
          editedValues={editedValues}
          onValueChange={onValueChange}
          isDefault={isDefault}
          activeTab={activeTab}
          getFieldMin={getFieldMin}
          getFieldMax={getFieldMax}
          getFieldStep={getFieldStep}
        />
      )}
    </div>
  );
};

export default PGNItem; 