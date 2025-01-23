import React, { useState, useEffect } from 'react';
import { loadPGNConfig, PGNConfig } from '../utils/pgn_loader';
import PGNItem from './PGNItem';

interface PGNPanelProps {
    pgnState: Record<string, Record<string, number>>;
    onPGNUpdate: (pgnKey: string, updates: Record<string, number>) => void;
}

const PGNPanel: React.FC<PGNPanelProps> = ({ pgnState, onPGNUpdate }) => {
    const [pgnConfig, setPGNConfig] = useState<Record<string, PGNConfig>>({});

    useEffect(() => {
        loadPGNConfig().then((config) => {
            setPGNConfig(config);
        });
    }, []);

    const handlePGNChange = (pgnKey: string, field: string, value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        onPGNUpdate(pgnKey, { [field]: numValue });
    };

    return (
        <div className="pgn-panel">
            <h3>NMEA 2000 Parameters</h3>
            {Object.entries(pgnConfig).map(([key, config]) => (
                <PGNItem 
                    key={key}
                    config={config}
                    value={pgnState[key] || {}}
                    onChange={(field, value) => handlePGNChange(key, field, value)}
                />
            ))}
        </div>
    );
};

export default PGNPanel; 