import React from 'react';
import { PGNConfig } from '../utils/pgn_loader';

interface PGNItemProps {
    config: PGNConfig;
    value: Record<string, number>;
    onChange: (field: string, value: string | number) => void;
}

const PGNItem: React.FC<PGNItemProps> = ({ config, value, onChange }) => {
    const currentValues = value || {};
    
    return (
        <div className="pgn-item">
            <div className="pgn-description">{config.description}</div>
            {Object.entries(config.parameters).map(([key, param]) => (
                <div key={key} className="pgn-value">
                    <label>{param.description}:</label>
                    <input
                        type="number"
                        value={currentValues[key] || 0}
                        onChange={(e) => onChange(key, e.target.value)}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                    />
                    {param.unit && <span>{param.unit}</span>}
                </div>
            ))}
        </div>
    );
};

export default PGNItem; 