import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { loadPGNConfig, PGNConfig } from '../utils/pgn_loader';
import PGNItem from './PGNItem';

interface PGNPanelProps {
    socket: Socket;
}

interface PGNData {
    [key: string]: Record<string, number>;
}

interface SystemState {
    [system: string]: Record<string, number>;
}

const PGNPanel: React.FC<PGNPanelProps> = ({ socket }) => {
    const [pgnConfig, setPGNConfig] = useState<Record<string, PGNConfig>>({});
    const [pgnData, setPGNData] = useState<PGNData>({});

    useEffect(() => {
        // Load PGN configuration
        loadPGNConfig().then((config: Record<string, PGNConfig>) => {
            setPGNConfig(config);
        });

        // Listen for state updates
        socket.on('state_update', (state: SystemState) => {
            const newData: PGNData = {};
            Object.entries(pgnConfig).forEach(([key, config]) => {
                newData[key] = state[config.system] ?? {};
            });
            setPGNData(newData);
        });

        return () => {
            socket.off('state_update');
        };
    }, [socket, pgnConfig]);

    const handlePGNChange = (pgnKey: string, field: string, value: string | number) => {
        const config = pgnConfig[pgnKey];
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        socket.emit('update_pgn', {
            pgn_id: config.pgn,
            parameter: field,
            value: numValue
        });
    };

    return (
        <div className="pgn-panel">
            <h3>NMEA 2000 Parameters</h3>
            {Object.entries(pgnConfig).map(([key, config]) => (
                <PGNItem 
                    key={key}
                    config={config}
                    value={pgnData[key]}
                    onChange={(field, value) => handlePGNChange(key, field, value)}
                />
            ))}
        </div>
    );
};

export default PGNPanel; 