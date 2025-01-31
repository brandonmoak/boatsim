import React from 'react';
import Select from 'react-select';
import { HeaderProps } from './types';

const PGNDatabaseHeader: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  selectedPGN,
  pgnOptions,
  handleAddDefault,
  onClose
}) => {
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
              onChange={handleAddDefault}
              placeholder="Add Default PGN..."
              isClearable={true}
            />
            <button className="save-defaults-button">
              Save Default Values
            </button>
          </>
        )}
        <button onClick={onClose} className="close-button">×</button>
      </div>
    </div>
  );
};

export default PGNDatabaseHeader; 