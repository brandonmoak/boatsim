import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import PGNItem from './PGNItem';
import PGNDatabase from './PGNDatabase';
import DeviceConnector from './DeviceConnector';
import { usePGNStore } from '../stores/pgnStore';

interface PGNOption {
    value: string;
    label: string;
}

// Update PGNPanel props interface
export interface PGNPanelProps {
  selectedPGNs: string[];
  simulatedPGNs: string[];
  onSelectedPGNsChange: (pgns: string[]) => void;
  onStart: () => void;
  onStop: () => void;
  isSimulating: boolean;
}

const PGNPanel = React.memo(({ 
  selectedPGNs,
  onSelectedPGNsChange,
  onStart,
  onStop,
  isSimulating,
  simulatedPGNs,
}: PGNPanelProps) => {

    const { pgnRates, pgnDefinitions } = usePGNStore();
    const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
    const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isListVisible, setIsListVisible] = useState(false);
    const draggingRef = useRef(false);
    const [containerHeight, setContainerHeight] = useState('0px');
    const [hasConnectedDevices, setHasConnectedDevices] = useState(false);

    useEffect(() => {
        // Set initial height when component mounts
        if (isListVisible) {
            setContainerHeight('400px');
        } else {
            setContainerHeight('0px');
        }
    }, [isListVisible]);

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

    useEffect(() => {
        if (!isDragging) {
            setTimeout(() => {
                // @ts-ignore - Global function
                window.refreshMap?.();
            }, 0);
        }
    }, [isDragging]);

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

    const handleConnectionStatusChange = (hasConnections: boolean) => {
        setHasConnectedDevices(hasConnections);
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
                        <button
                            className={`blue-button ${isSimulating ? 'red-button' : ''}`}
                            onClick={isSimulating ? onStop : onStart}
                        >
                            {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                        </button>
                        <button
                            className="blue-button toggle-list-button"
                            onClick={handleVisibilityToggle}
                        >
                            {isListVisible ? 'Hide Simulated PGNs' : 'Show Simulated PGNs'}
                        </button>
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
                            className={`device-button ${hasConnectedDevices ? 'green-button' : 'blue-button'}`}
                            onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
                        >
                            Configure Devices
                        </button>
                    </div>
                </div>

                {isListVisible && (
                    <div className="pgn-panel-content">
                        {selectedPGNs.length === 0 && simulatedPGNs.length === 0 && <div>No PGNs selected</div>}
                        {Array.from(new Set([...selectedPGNs, ...simulatedPGNs]))
                            .sort((a, b) => parseInt(b) - parseInt(a))
                            .map(pgnKey => {
                                const definitions = pgnDefinitions[pgnKey];
                                if (!definitions) {
                                    console.log(`No definition found for PGN ${pgnKey}`);
                                    return null;
                                }

                                const isSimulated = simulatedPGNs.includes(pgnKey);

                                return (
                                    <div key={pgnKey} className="pgn-item-container">
                                        {!isSimulated && (
                                            <button 
                                                className="remove-pgn"
                                                onClick={() => handleRemovePGN(pgnKey)}
                                            >
                                                ×
                                            </button>
                                        )}
                                        <PGNItem 
                                            config={definitions}
                                            rate={pgnRates[pgnKey]}
                                            isSimulated={isSimulated}
                                            pgnKey={pgnKey}
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
                    selectedPGNs={selectedPGNs}
                    onAddToSimulation={handleAddToSimulation}
                />
            )}
            {isDeviceMenuOpen && (
                <DeviceConnector 
                    className="device-menu-overlay" 
                    onClose={() => setIsDeviceMenuOpen(false)}
                    onConnectionStatusChange={handleConnectionStatusChange}
                />
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        JSON.stringify(prevProps.selectedPGNs) === JSON.stringify(nextProps.selectedPGNs) &&
        prevProps.isSimulating === nextProps.isSimulating &&
        prevProps.onStart === nextProps.onStart &&
        prevProps.onStop === nextProps.onStop
    );
});

export default PGNPanel; 