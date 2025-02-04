import React from 'react';
import Select from 'react-select';
import { HeaderProps } from './types';

const PGNDatabaseHeader: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  pgnOptions,
  handleAddDefault,
  onClose,
  onSaveDefaults,
  isSaving
}) => {
  const handleSelectChange = (option: { value: string; label: string } | null) => {
    if (option) {
      handleAddDefault({
        pgn: option.value,
        description: option.label
      });
    }
  };

  return (
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
              value={null}
              onChange={handleSelectChange}
              placeholder="Add Default PGN..."
              isClearable={true}
              isDisabled={isSaving}
            />
            <button 
              className="save-defaults-button"
              onClick={onSaveDefaults}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Default Values'}
            </button>
          </>
        )}
        <button onClick={onClose} className="close-button" disabled={isSaving}>×</button>
      </div>
    </div>
  );
};

export default PGNDatabaseHeader; 