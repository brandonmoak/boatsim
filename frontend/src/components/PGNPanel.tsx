import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import pgnsBase from '@canboat/pgns/canboat.json';
import pgnsIK from '@canboat/pgns/pgns-ik.json';
import pgnsNGT from '@canboat/pgns/pgns-ngt.json';
import PGNItem from './PGNItem';
import { PGNDefinition } from '../types';

interface PGNOption {
    value: string;
    label: string;
}

interface PGNPanelProps {
    pgnState: Record<string, Record<string, number>>;
    onPGNUpdate: (pgnKey: string, updates: Record<string, number>) => void;
}

function organizePGNs() {
    const res: Record<string, PGNDefinition[]> = {};
    const all = [...pgnsBase.PGNs, ...pgnsIK.PGNs, ...pgnsNGT.PGNs];
    
    all.forEach(pgn => {
        const pgnKey = pgn.PGN.toString();
        if (!res[pgnKey]) {
            res[pgnKey] = [];
        }
        
        // Ensure Fields is always an array
        pgn.Fields = Array.isArray(pgn.Fields) ? pgn.Fields : [];
        
        // Handle Reserved field names
        let reservedCount = 1;
        pgn.Fields.forEach((field) => {
            if (field.Name === 'Reserved') {
                field.Name = `Reserved${reservedCount++}`;
            }
        });
        
        res[pgnKey].push(pgn as PGNDefinition);
    });
    return res;
}

const PGNPanel: React.FC<PGNPanelProps> = ({ pgnState, onPGNUpdate }) => {
    const [pgnDefinitions, setPgnDefinitions] = useState<Record<string, PGNDefinition[]>>({});
    const [selectedPGNs, setSelectedPGNs] = useState<string[]>([
        '127250', // Vessel Heading
        '127251', // Rate of Turn
        '127257', // Attitude
    ]);

    useEffect(() => {
        const definitions = organizePGNs();
        setPgnDefinitions(definitions);
    }, []);

    const handlePGNChange = (pgnKey: string, field: string, value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        onPGNUpdate(pgnKey, { [field]: numValue });
    };

    const handlePGNSelect = (option: PGNOption | null) => {
        if (option && !selectedPGNs.includes(option.value)) {
            setSelectedPGNs([...selectedPGNs, option.value]);
        }
    };

    const handleRemovePGN = (pgnKey: string) => {
        setSelectedPGNs(selectedPGNs.filter(key => key !== pgnKey));
    };

    const pgnOptions: PGNOption[] = Object.entries(pgnDefinitions).map(([key, defs]) => ({
        value: key,
        label: `${key} - ${defs[0]?.Description || 'Unknown'}`
    }));

    return (
        <div className="pgn-panel">
            <h3>NMEA 2000 Parameters</h3>
            
            {/* PGN Selector */}
            <div className="pgn-selector">
                <Select
                    options={pgnOptions}
                    onChange={handlePGNSelect}
                    value={null}  // Always reset to placeholder
                    placeholder="Add PGN..."
                    className="pgn-select-container"
                    classNamePrefix="pgn-select"
                    isClearable={false}
                />
            </div>

            {/* Selected PGNs */}
            {selectedPGNs.map(pgnKey => {
                const definitions = pgnDefinitions[pgnKey];
                if (!definitions?.[0]) return null;

                return (
                    <div key={pgnKey} className="pgn-container">
                        <button 
                            className="remove-pgn"
                            onClick={() => handleRemovePGN(pgnKey)}
                        >
                            ×
                        </button>
                        <PGNItem 
                            config={definitions[0]}
                            value={pgnState[pgnKey] || {}}
                            onChange={(field, value) => handlePGNChange(pgnKey, field, value)}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default PGNPanel; 