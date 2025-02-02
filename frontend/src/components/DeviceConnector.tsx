import React, { useEffect } from 'react';
import './DeviceConnector.css';
import { useDeviceStore } from '../stores/deviceStore';

interface Device {
  type: string;
  status: string;
}

interface DeviceConnectorProps {
  className?: string;
  onClose?: () => void;
}

// Add these new component definitions before the main DeviceConnector component
const DeviceTableHeader: React.FC<{
  title: string;
  children?: React.ReactNode;
}> = ({ title, children }) => (
  <div className="device-table-header">
    <h3>{title}</h3>
    <div className="header-buttons">
      {children}
    </div>
  </div>
);

const SerialDevicesForm: React.FC<{
  availableDevices: [string, Device][];
  isConnecting: boolean;
  onConnect: (path: string) => void;
  onCancel: () => void;
}> = ({ availableDevices, isConnecting, onConnect, onCancel }) => (
  <div className="available-devices">
    <div className="device-table-header">
      <h4>Available Devices</h4>
      <button className="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
    {availableDevices.length === 0 ? (
      <div className="no-devices">No available devices found</div>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Device Path</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {availableDevices.map(([path, device]) => (
            <tr key={path}>
              <td>{device.type}</td>
              <td>{path}</td>
              <td>
                <button
                  className="connect-button"
                  onClick={() => onConnect(path)}
                  disabled={isConnecting}
                >
                  Connect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const TcpDeviceForm: React.FC<{
  tcpDetails: { ipAddress: string; port: string };
  isConnecting: boolean;
  onConnect: () => void;
  onCancel: () => void;
  onTcpDetailsChange: (details: { ipAddress: string; port: string }) => void;
}> = ({ tcpDetails, isConnecting, onConnect, onCancel, onTcpDetailsChange }) => (
  <div className="available-devices">
    <div className="device-table-header">
      <h4>Add TCP Device</h4>
      <div className="header-buttons">
        <button className="connect-button" onClick={onConnect} disabled={isConnecting}>
          Connect
        </button>
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
    <div className="tcp-form">
      <div className="form-group">
        <label>IP Address</label>
        <input
          type="text"
          placeholder="Enter IP Address"
          value={tcpDetails.ipAddress}
          onChange={(e) => onTcpDetailsChange({ ...tcpDetails, ipAddress: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Port</label>
        <input
          type="text"
          placeholder="Enter Port"
          value={tcpDetails.port}
          onChange={(e) => onTcpDetailsChange({ ...tcpDetails, port: e.target.value })}
        />
      </div>
    </div>
  </div>
);

const ConnectedDevicesTable: React.FC<{
  connectedDevices: [string, Device][];
  isConnecting: boolean;
  onDisconnect: (path: string) => void;
}> = ({ connectedDevices, isConnecting, onDisconnect }) => (
  <div className="device-table device-table-dynamic">
    {connectedDevices.length === 0 ? (
      <div className="no-devices">No devices connected</div>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Device Path</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {connectedDevices.map(([path, device]) => (
            <tr key={path}>
              <td>{device.type}</td>
              <td>{path}</td>
              <td>
                <span className={`device-status ${device.status}`}>
                  {device.status}
                </span>
              </td>
              <td>
                <button
                  onClick={() => onDisconnect(path)}
                  className="disconnect-button"
                  disabled={isConnecting}
                >
                  Disconnect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const ErrorMessage: React.FC<{
  error: string;
  onClose: () => void;
}> = ({ error, onClose }) => (
  <div className="error-message">
    <span>{error}</span>
    <button className="close-button" onClick={onClose}>
      ×
    </button>
  </div>
);

// Update the main DeviceConnector component to use these new components
const DeviceConnector: React.FC<DeviceConnectorProps> = ({ className, onClose }) => {
  const {
    devices,
    error,
    isConnecting,
    isAddingSerial,
    isAddingTcp,
    tcpDetails,
    fetchDeviceStatus,
    connectDevice,
    disconnectDevice,
    clearError,
    setIsAddingSerial,
    setIsAddingTcp,
    setTcpDetails,
    setError
  } = useDeviceStore();

  // Fetch device status periodically
  useEffect(() => {
    fetchDeviceStatus();
    const interval = setInterval(fetchDeviceStatus, 1000);
    return () => clearInterval(interval);
  }, [fetchDeviceStatus]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // Modify the click-away handler to stop if clicking the Configure Devices button
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.device-button')) {
        return; // Don't close if clicking the Configure Devices button
      }
      if (!target.closest('.device-connector')) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const connectedDevices = Object.entries(devices).filter(
    ([_, device]) => device.status === 'connected'
  );
  const availableDevices = Object.entries(devices).filter(
    ([_, device]) => device.status === 'disconnected'
  );

  return (
    <div className={`device-connector device-connector-dynamic ${className || ''}`}>
      <DeviceTableHeader title="Connected Devices">
        <button
          className="add-device-button"
          onClick={() => {
            setIsAddingSerial(!isAddingSerial);
            setIsAddingTcp(false);
          }}
        >
          Add Serial
        </button>
        <button
          className="add-device-button"
          onClick={() => {
            setIsAddingTcp(!isAddingTcp);
            setIsAddingSerial(false);
          }}
        >
          Add TCP
        </button>
        <button className="close-button" onClick={() => onClose?.()}>
          ×
        </button>
      </DeviceTableHeader>

      {isAddingSerial && (
        <SerialDevicesForm
          availableDevices={availableDevices}
          isConnecting={isConnecting}
          onConnect={(path) => {
            connectDevice(path);
            setIsAddingSerial(false);
          }}
          onCancel={() => setIsAddingSerial(false)}
        />
      )}

      {isAddingTcp && (
        <TcpDeviceForm
          tcpDetails={tcpDetails}
          isConnecting={isConnecting}
          onConnect={() => {
            connectDevice(`tcp://${tcpDetails.ipAddress}:${tcpDetails.port}`);
            setIsAddingTcp(false);
          }}
          onCancel={() => setIsAddingTcp(false)}
          onTcpDetailsChange={setTcpDetails}
        />
      )}

      <ConnectedDevicesTable
        connectedDevices={connectedDevices}
        isConnecting={isConnecting}
        onDisconnect={disconnectDevice}
      />

      {error && (
        <ErrorMessage
          error={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

export default DeviceConnector; 