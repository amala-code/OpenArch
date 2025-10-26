import React, { useEffect } from "react";
import "./ConnectionPanel.css";

const ConnectionPanel = ({ 
  deviceId, 
  setDeviceId, 
  isConnected, 
  setIsConnected,
  setSensorData,
  autoRefresh,
  setAutoRefresh,
  BACKEND_URL 
}) => {

  // Fetch device data
  const fetchDeviceData = async () => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/device/${deviceId}`);
      const data = await res.json();
      console.log("API Response:", data);
      
      // Handle array response - get the first item
      const deviceData = Array.isArray(data) ? data[0] : data;
      
      setSensorData(deviceData || null);
      setIsConnected(true);
  
      if (!autoRefresh) setAutoRefresh(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsConnected(false);
      setSensorData(null);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    if (autoRefresh && deviceId && isConnected) {
      const interval = setInterval(fetchDeviceData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, deviceId, isConnected]);

  const handleConnect = () => {
    if (deviceId.trim()) {
      fetchDeviceData();
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAutoRefresh(false);
    setSensorData(null);
  };

  return (
    <div className="connection-panel">
      <div className="connection-content">
        <div className="connection-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeWidth="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeWidth="2"/>
          </svg>
          <h3>Device Connection</h3>
        </div>

        <div className="connection-controls">
          <div className="device-input-group">
            <input
              type="text"
              placeholder="Enter Device ID (e.g., device_003)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              disabled={isConnected}
              className="device-input"
            />
            {!isConnected ? (
              <button 
                onClick={handleConnect}
                className="connect-btn"
                disabled={!deviceId.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Connect
              </button>
            ) : (
              <button 
                onClick={handleDisconnect}
                className="disconnect-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                </svg>
                Disconnect
              </button>
            )}
          </div>

          <div className="status-indicator">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {isConnected ? `Connected to ${deviceId}` : 'Not Connected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;