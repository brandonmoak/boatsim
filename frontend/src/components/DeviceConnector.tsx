import React, { useEffect } from 'react';
import './DeviceConnector.css';
import { useDeviceStore } from '../stores/deviceStore';

interface DeviceConnectorProps {
  className?: string;
  onClose?: () => void;
}

const DeviceConnector: React.FC<DeviceConnectorProps> = ({ className, onClose }) => {
  // Get additional state and actions from the store
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
    setTcpDetails
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
      <div className="device-table-header">
        <h3>Connected Devices</h3>
        <div className="header-buttons">
          <button 
            className="add-device-button"
            onClick={() => {
              setIsAddingSerial(!isAddingSerial);
              setIsAddingTcp(false);  // Always close TCP form
            }}
          >
            Add Serial
          </button>
          <button 
            className="add-device-button"
            onClick={() => {
              setIsAddingTcp(!isAddingTcp);
              setIsAddingSerial(false);  // Always close Serial form
            }}
          >
            Add TCP
          </button>
          <button 
            className="close-button"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </div>
      </div>

      {/* Available Serial Devices Form */}
      {isAddingSerial && (
        <div className="available-devices">
          <div className="device-table-header">
            <h4>Available Devices</h4>
            <button 
              className="cancel-button"
              onClick={() => setIsAddingSerial(false)}
            >
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
                        onClick={() => {
                          connectDevice(path);
                          setIsAddingSerial(false);
                        }}
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
      )}

      {/* TCP Connection Form */}
      {isAddingTcp && (
        <div className="available-devices">
          <div className="device-table-header">
            <h4>Add TCP Device</h4>
            <div className="header-buttons">
              <button 
                className="connect-button"
                onClick={() => {
                  connectDevice(`tcp://${tcpDetails.ipAddress}:${tcpDetails.port}`);
                  setIsAddingTcp(false);
                }}
                disabled={isConnecting}
              >
                Connect
              </button>
              <button 
                className="cancel-button"
                onClick={() => setIsAddingTcp(false)}
              >
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
                onChange={(e) => setTcpDetails({ ...tcpDetails, ipAddress: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input
                type="text"
                placeholder="Enter Port"
                value={tcpDetails.port}
                onChange={(e) => setTcpDetails({ ...tcpDetails, port: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Connected Devices Table */}
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
                      onClick={() => disconnectDevice(path)}
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

      {/* Error message with close button */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button 
            className="close-button"
            onClick={() => useDeviceStore.getState().setError(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceConnector; 