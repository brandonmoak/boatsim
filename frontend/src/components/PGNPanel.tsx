import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import PGNItem from './PGNItem';
import { PGNDefinition } from '../types';
import { loadPGNConfig } from '../utils/pgn_definition_loader';
import { getDefaultPGNArray } from '../utils/pgn_defaults_loader';
import { 
  PGNPanelProps 
} from '../types';
import PGNDatabase from './PGNDatabase';
import Controls from './Controls';
import NavigationDisplay from './NavigationDisplay';

interface PGNOption {
    value: string;
    label: string;
}

const PGNPanel = React.memo(({ 
  pgnState, 
  pgnRates, 
  selectedPGNs,
  onPGNFieldsUpdate,
  onPGNRateUpdate, 
  onSelectedPGNsChange,
  defaultPGNs,
  updateDefaultPGNs,
  getCurrentPGNValues,
  onStart,
  onStop,
  isSimulating,
  boatState
}: PGNPanelProps) => {
    
    const [pgnDefinitions, setPgnDefinitions] = useState<Record<string, PGNDefinition>>({});
    const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isListVisible, setIsListVisible] = useState(true);
    const draggingRef = useRef(false);
    const [containerHeight, setContainerHeight] = useState('400px');

    useEffect(() => {
        console.log('Loading PGN definitions...');
        loadPGNConfig().then(definitions => {
            console.log('PGN definitions loaded:', definitions);
            setPgnDefinitions(definitions);
        });
    }, []);

    useEffect(() => {
        // Set initial height when component mounts
        if (isListVisible) {
            setContainerHeight('400px');
        } else {
            setContainerHeight('0px');
        }
    }, [isListVisible]);

    const handlePGNChange = (pgnKey: string, field: string, value: number) => {
        onPGNFieldsUpdate(pgnKey, { [field]: value });
    };

    const handleRateChange = (pgnKey: string, value: number) => {
        onPGNRateUpdate(pgnKey, value);
    };

    const handlePGNSelect = (option: PGNOption | null) => {
        if (option && !selectedPGNs.includes(option.value)) {
            onSelectedPGNsChange([...selectedPGNs, option.value]);
        }
    };

    const handleRemovePGN = (pgnKey: string) => {
        onSelectedPGNsChange(selectedPGNs.filter(key => key !== pgnKey));
    };

    const handleAddToSimulation = (pgn: string) => {
        if (!selectedPGNs.includes(pgn)) {
            onSelectedPGNsChange([...selectedPGNs, pgn]);
        }
    };

    const pgnOptions: PGNOption[] = Object.entries(pgnDefinitions).map(([key, defs]) => ({
        value: key,
        label: `${key} - ${defs?.Description || 'Unknown'}`
    }));

    // Add debug logging
    console.log('Rendering PGNPanel with:', {
        selectedPGNs,
        pgnState,
        pgnRates,
        definitionsLoaded: Object.keys(pgnDefinitions).length > 0
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        draggingRef.current = true;
        
        const startY = e.clientY;
        const container = document.querySelector('.pgn-container') as HTMLElement;
        if (!container) return;
        
        const startHeight = container.getBoundingClientRect().height;
        
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current) return;
            
            const deltaY = startY - e.clientY;
            const newHeight = Math.max(100, Math.min(window.innerHeight * 0.8, startHeight + deltaY));
            setContainerHeight(`${newHeight}px`);
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            draggingRef.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleVisibilityToggle = () => {
        setIsListVisible(!isListVisible);
        // Call the global refresh function after state change
        setTimeout(() => {
            // @ts-ignore - Global function
            window.refreshMap?.();
        }, 0);
    };

    return (
        <div 
            className={`pgn-container ${!isListVisible ? 'collapsed' : ''}`}
            style={{ height: containerHeight }}
        >
            {isListVisible && <div className="pgn-resize-handle" onMouseDown={handleMouseDown} />}
            <div className="pgn-panel">  
                <div className="pgn-panel-header">
                    <div className="pgn-header-left">
                        <Controls 
                            onStart={onStart}
                            onStop={onStop}
                            isRunning={isSimulating}
                        />
                    </div>
                    <div className="pgn-header-center">
                        {isListVisible && (
                            <div className="pgn-selector">
                                <Select
                                    options={pgnOptions}
                                    onChange={handlePGNSelect}
                                    value={null}
                                    placeholder="Add NMEA 2000 PGN"
                                    className="pgn-select-container"
                                    classNamePrefix="pgn-select"
                                    isClearable={false}
                                />
                            </div>
                        )}
                    </div>
                    <div className="pgn-header-right">
                        <button 
                            className="database-button blue-button"
                            onClick={() => setIsDatabaseViewerOpen(true)}
                        >
                            View PGN Database
                        </button>
                        <button
                            className="toggle-list-button blue-button"
                            onClick={handleVisibilityToggle}
                        >
                            {isListVisible ? 'Hide PGNs' : 'Show PGNs'}
                        </button>
                    </div>
                </div>

                {isListVisible && (
                    <div className="pgn-panel-content">
                        {selectedPGNs.length === 0 && <div>No PGNs selected</div>}
                        {selectedPGNs
                            .sort((a, b) => parseInt(b) - parseInt(a))
                            .map(pgnKey => {
                                const definitions = pgnDefinitions[pgnKey];
                                if (!definitions) {
                                    console.log(`No definition found for PGN ${pgnKey}`);
                                    return null;
                                }

                                return (
                                    <div key={pgnKey} className="pgn-item-container">
                                        <button 
                                            className="remove-pgn"
                                            onClick={() => handleRemovePGN(pgnKey)}
                                        >
                                            ×
                                        </button>
                                        <PGNItem 
                                            config={definitions}
                                            value={pgnState[pgnKey] || {}}
                                            rate={pgnRates[pgnKey]}
                                            onValueChange={(field, value) => handlePGNChange(pgnKey, field, value)}
                                            onRateChange={(value) => handleRateChange(pgnKey, value)}
                                        />
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>
            {isDatabaseViewerOpen && (
                <PGNDatabase
                    isOpen={isDatabaseViewerOpen}
                    onClose={() => setIsDatabaseViewerOpen(false)}
                    pgnDefinitions={pgnDefinitions}
                    defaultPGNs={defaultPGNs}
                    onUpdateDefaults={updateDefaultPGNs}
                    selectedPGNs={selectedPGNs}
                    onAddToSimulation={handleAddToSimulation}
                    getCurrentPGNValues={getCurrentPGNValues}
                />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        JSON.stringify(prevProps.pgnState) === JSON.stringify(nextProps.pgnState) &&
        JSON.stringify(prevProps.pgnRates) === JSON.stringify(nextProps.pgnRates) &&
        JSON.stringify(prevProps.selectedPGNs) === JSON.stringify(nextProps.selectedPGNs) &&
        prevProps.isSimulating === nextProps.isSimulating &&
        prevProps.onStart === nextProps.onStart &&
        prevProps.onStop === nextProps.onStop
    );
});

export default PGNPanel; 