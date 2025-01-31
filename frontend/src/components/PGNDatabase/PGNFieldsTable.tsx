import React from 'react';
import { PGNField } from '../../types';
import { TabType } from './types';

interface PGNFieldsTableProps {
  fields: PGNField[];
  pgn: string;
  editedValues: Record<string, Record<string, number>>;
  onValueChange: (pgn: string, fieldName: string, value: string) => void;
  isDefault: boolean;
  activeTab: TabType;
  getFieldMin: (field: PGNField) => number;
  getFieldMax: (field: PGNField) => number;
  getFieldStep: (field: PGNField) => number;
}

const PGNFieldsTable: React.FC<PGNFieldsTableProps> = ({
  fields,
  pgn,
  editedValues,
  onValueChange,
  isDefault,
  activeTab,
  getFieldMin,
  getFieldMax,
  getFieldStep
}) => {
  const renderFieldType = (field: PGNField) => {
    if (field.EnumValues && Array.isArray(field.EnumValues)) {
      return (
        <div>
          <select className="enum-preview">
            {field.EnumValues.map((enumValue) => (
              <option key={enumValue.value} value={enumValue.value}>
                {enumValue.value}: {enumValue.name}
              </option>
            ))}
          </select>
        </div>
      );
    }
    return field.FieldType;
  };

  return (
    <div className="pgn-fields-table">
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
          {fields.map((field, index) => (
            <tr key={index}>
              <td>{field.Name}</td>
              <td>{field.Description || '-'}</td>
              <td>{renderFieldType(field)}</td>
              <td>{field.Unit || '-'}</td>
              {activeTab === 'defaults' && (
                <td>
                  {isDefault && (
                    <input
                      type="number"
                      value={editedValues[pgn]?.[field.Name] ?? ''}
                      onChange={(e) => onValueChange(pgn, field.Name, e.target.value)}
                      min={getFieldMin(field)}
                      max={getFieldMax(field)}
                      step={getFieldStep(field)}
                      className="default-value-input"
                    />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PGNFieldsTable; 