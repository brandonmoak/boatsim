import React from 'react';
import { PGNDefinition } from '../types';
import { getDefaultPGNs } from '../utils/pgn_loader';
import Select from 'react-select';

interface PGNDatabaseProps {
  isOpen: boolean;
  onClose: () => void;
  pgnDefinitions: Record<string, PGNDefinition>;
  defaultPGNs: Record<string, Record<string, number>>;
  onUpdateDefaults: (defaults: Record<string, Record<string, number>>) => void;
}

const PGNDatabaseViewer: React.FC<PGNDatabaseProps> = ({ 
  isOpen, 
  onClose, 
  pgnDefinitions,
  defaultPGNs,
  onUpdateDefaults
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'all' | 'defaults'>('all');
  const [selectedPGN, setSelectedPGN] = React.useState<string | null>(null);
  const [editedValues, setEditedValues] = React.useState<Record<string, Record<string, number>>>({});

  // Initialize editedValues when defaultPGNs changes
  React.useEffect(() => {
    setEditedValues(defaultPGNs);
  }, [defaultPGNs]);

  const handleAddDefault = (option: { value: string, label: string } | null) => {
    if (!option?.value) return;
    
    const pgn = option.value;
    const definition = pgnDefinitions[pgn];
    
    // Initialize default values for the new PGN using RangeMin values
    const initialValues: Record<string, number> = {};
    definition.Fields.forEach(field => {
      initialValues[field.Name] = field.RangeMin ?? 0;
    });

    // Create updated defaults object
    const updatedDefaults = {
      ...defaultPGNs,
      [pgn]: initialValues
    };

    // Update parent component
    onUpdateDefaults(updatedDefaults);

    // Clear the selection
    setSelectedPGN(null);
  };

  const handleValueChange = (pgn: string, fieldName: string, value: string) => {
    const numValue = parseFloat(value);
    const newEditedValues = {
      ...editedValues,
      [pgn]: {
        ...(editedValues[pgn] || {}),
        [fieldName]: isNaN(numValue) ? 0 : numValue
      }
    };
    
    setEditedValues(newEditedValues);
    onUpdateDefaults(newEditedValues);
  };

  const handleRemoveDefault = (pgn: string) => {
    const updatedDefaults = { ...defaultPGNs };
    delete updatedDefaults[pgn];
    onUpdateDefaults(updatedDefaults);
  };

  // Remove the defaultPGNs useMemo since it's now passed as a prop
  const pgnOptions = React.useMemo(() => {
    return Object.entries(pgnDefinitions)
      .filter(([pgn]) => !defaultPGNs[pgn])
      .map(([pgn, definition]) => ({
        value: pgn,
        label: `${pgn}: ${definition.Description}`
      }));
  }, [pgnDefinitions, defaultPGNs]);

  if (!isOpen) return null;

  const renderDefaultValue = (pgn: string, fieldName: string, field: any) => {
    const currentValue = editedValues[pgn]?.[fieldName];
    return (
      <input
        type="number"
        value={currentValue !== undefined ? currentValue : ''}
        onChange={(e) => handleValueChange(pgn, fieldName, e.target.value)}
        className="default-value-input"
      />
    );
  };

  const filteredPGNs = Object.entries(pgnDefinitions)
    .filter(([pgn, definition]) => {
      if (activeTab === 'defaults' && !defaultPGNs[pgn]) {
        return false;
      }

      const searchLower = searchTerm.toLowerCase();
      return (
        pgn.toLowerCase().includes(searchLower) ||
        definition.Description.toLowerCase().includes(searchLower) ||
        definition.Fields.some(
          field =>
            field.Name.toLowerCase().includes(searchLower) ||
            (field.Description?.toLowerCase() || '').includes(searchLower)
        )
      );
    })
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const renderFieldType = (field: any) => {
    if (field.EnumValues && Array.isArray(field.EnumValues)) {
      return (
        <div>
          <div>{field.Type}</div>
          <select className="enum-preview">
            {field.EnumValues.map((enumValue: { name: string, value: number }) => (
              <option key={enumValue.value} value={enumValue.value}>
                {enumValue.value}: {enumValue.name}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return field.Type;
  };

  const renderHeaderControls = () => {
    return (
      <div className="pgn-database-header-controls">
        {activeTab === 'all' ? (
          <input
            type="text"
            placeholder="Search PGNs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pgn-search-input"
          />
        ) : (
          <>
            <Select
              className="pgn-select-container"
              classNamePrefix="pgn-select"
              options={pgnOptions}
              value={pgnOptions.find(option => option.value === selectedPGN) || null}
              onChange={handleAddDefault}
              placeholder="Add Default PGN..."
              isClearable
            />
            <button className="save-defaults-button">
              Save Default Values
            </button>
          </>
        )}
        <button onClick={onClose} className="close-button">×</button>
      </div>
    );
  };

  return (
    <div className="pgn-database-overlay">
      <div className="pgn-database-content">
        <div className="pgn-database-header">
          <div className="pgn-database-title">
            <h2>PGN Database</h2>
          </div>
          <div className="pgn-database-tabs">
            <button 
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All PGNs
            </button>
            <button 
              className={`tab-button ${activeTab === 'defaults' ? 'active' : ''}`}
              onClick={() => setActiveTab('defaults')}
            >
              Default PGNs
            </button>
          </div>
          {renderHeaderControls()}
        </div>
        <div className="pgn-database-body">
          {filteredPGNs.map(([pgn, definition]) => (
            <div key={pgn} className="pgn-database-item">
              <div className="pgn-database-item-header">
                <div className="pgn-header-content">
                  <span className="pgn-number">PGN {pgn}</span>
                  <span className="pgn-description">{definition.Description}</span>
                  {defaultPGNs[pgn] && (
                    <span className="default-badge">Default</span>
                  )}
                </div>
                {defaultPGNs[pgn] && (
                  <button 
                    className="close-button"
                    onClick={() => handleRemoveDefault(pgn)}
                    title="Remove from defaults"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="pgn-database-fields">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Units</th>
                      {activeTab === 'defaults' && <th>Value</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {definition.Fields.map((field, index) => (
                      <tr key={index}>
                        <td>{field.Name}</td>
                        <td>{field.Description || '-'}</td>
                        <td>{renderFieldType(field)}</td>
                        <td>{field.Unit || '-'}</td>
                        {activeTab === 'defaults' && (
                          <td>
                            {defaultPGNs[pgn] ? 
                              renderDefaultValue(pgn, field.Name, field) : 
                              '-'
                            }
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PGNDatabaseViewer; 