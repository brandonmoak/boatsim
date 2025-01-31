import React from 'react';
import { PGNDefinition } from '../types';

interface PGNDatabaseProps {
  isOpen: boolean;
  onClose: () => void;
  pgnDefinitions: Record<string, PGNDefinition>;
}

const PGNDatabaseViewer: React.FC<PGNDatabaseProps> = ({ isOpen, onClose, pgnDefinitions }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  if (!isOpen) return null;

  const filteredPGNs = Object.entries(pgnDefinitions)
    .filter(([pgn, definition]) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        // Search PGN number
        pgn.toLowerCase().includes(searchLower) ||
        // Search description
        definition.Description.toLowerCase().includes(searchLower) ||
        // Search fields
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

  return (
    <div className="pgn-database-overlay">
      <div className="pgn-database-content">
        <div className="pgn-database-header">
          <h2>PGN Database</h2>
          <div className="pgn-database-header-controls">
            <input
              type="text"
              placeholder="Search PGNs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pgn-search-input"
            />
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>
        <div className="pgn-database-body">
          {filteredPGNs.map(([pgn, definition]) => (
            <div key={pgn} className="pgn-database-item">
              <div className="pgn-database-item-header">
                <span className="pgn-number">PGN {pgn}</span>
                <span className="pgn-description">{definition.Description}</span>
              </div>
              <div className="pgn-database-fields">
                <table>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {definition.Fields.map((field, index) => (
                      <tr key={index}>
                        <td>{field.Name}</td>
                        <td>{field.Description || '-'}</td>
                        <td>{renderFieldType(field)}</td>
                        <td>{field.Unit || '-'}</td>
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