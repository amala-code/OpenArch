

import React from "react";
import "./SensorPanel.css";

const SensorPanel = ({ sensorData, isConnected }) => {

  const getStatusColor = (value, type) => {
    if (type === 'temp') {
      if (value < 160) return '#4ECDC4';
      if (value < 180) return '#FFD93D';
      return '#FF6B6B';
    }
    if (type === 'oxygen') {
      if (value > 20) return '#4ECDC4';
      if (value > 18) return '#FFD93D';
      return '#FF6B6B';
    }
    return '#4ECDC4';
  };

  // Calculate average temperature
//   const getAverageTemp = () => {
//     if (!sensorData) return '0.0';
//     const temps = [
//       sensorData.Temp1,
//       sensorData.Temp2,
//       sensorData.Temp3,
//       sensorData.Temp4
//     ].filter(t => t != null && !isNaN(t));
    
//     if (temps.length === 0) return '0.0';
//     const avg = temps.reduce((sum, temp) => sum + parseFloat(temp), 0) / temps.length;
//     return avg.toFixed(1);
//   };

  return (
    <div className="sensor-panel">
  <div className="command-status-box">
        <div className="command-status-content">
          <div className="command-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2"/>
              <line x1="9" y1="10" x2="15" y2="10" strokeWidth="2"/>
              <line x1="12" y1="7" x2="12" y2="13" strokeWidth="2"/>
            </svg>
          </div>
          <div className="command-text">
            <span className="command-label">Command Received from Hardware</span>
            <span className="command-value">  {isConnected && sensorData && Object.keys(sensorData).length > 0
    ? sensorData.UnknownCommand || 'No UnknownCommand found'
    : 'No Message received'}</span>
          </div>
          <div className="command-indicator">
            <div className="pulse-dot"></div>
          </div>
        </div>
      </div>

      <div className="panel-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
          <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
          <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2"/>
          <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2"/>
          <polyline points="10 9 9 9 8 9" strokeWidth="2"/>
        </svg>
        <h3>Sensor Readings</h3>
        <span className="live-indicator">
          <span className={`pulse ${isConnected ? 'active' : ''}`}></span>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {!isConnected ? (
        <div className="no-connection">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeWidth="2"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0" strokeWidth="2"/>
            <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2"/>
          </svg>
          <p>Connect to a device to view sensor data</p>
        </div>
      ) : !sensorData ? (
        <div className="no-connection">
          <div className="loading-spinner-small"></div>
          <p>Loading sensor data...</p>
        </div>
      ) : (
        <div className="sensors-grid">
          {/* Temperature Sensors */}
          <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.Temperature1 || 0, 'temp') }}>
            <div className="sensor-icon temp-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" strokeWidth="2"/>
              </svg>
            </div>
            <div className="sensor-info">
              <span className="sensor-label">Temperature 1</span>
              <span className="sensor-value">{sensorData.Temp1 || '0.0'}°C</span>
            </div>
          </div>

          <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.Temperature2 || 0, 'temp') }}>
            <div className="sensor-icon temp-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" strokeWidth="2"/>
              </svg>
            </div>
            <div className="sensor-info">
              <span className="sensor-label">Temperature 2</span>
              <span className="sensor-value">{sensorData.Temp2 || '0.0'}°C</span>
            </div>
          </div>

          <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.Temp3 || 0, 'temp') }}>
            <div className="sensor-icon temp-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" strokeWidth="2"/>
              </svg>
            </div>
            <div className="sensor-info">
              <span className="sensor-label">Temperature 3</span>
              <span className="sensor-value">{sensorData.Temp3 || '0.0'}°C</span>
            </div>
          </div>

          <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.Temp4 || 0, 'temp') }}>
            <div className="sensor-icon temp-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" strokeWidth="2"/>
              </svg>
            </div>
            <div className="sensor-info">
              <span className="sensor-label">Temperature 4</span>
              <span className="sensor-value">{sensorData.Temp4 || '0.0'}°C</span>
            </div>
          </div>

          {/* Average Temperature */}
          <div className="sensor-card highlight" style={{ borderLeftColor: '#FF8C42' }}>
            <div className="sensor-icon avg-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
              </svg>
            </div>
            <div className="sensor-info">
              <span className="sensor-label">Average Temp</span>
              <span className="sensor-value">{sensorData.average_temp || '0.0'}°C</span>
            </div>
          </div>

          {/* Oxygen Level */}
          <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.oxygen_value || 0, 'oxygen') }}>
            <div className="sensor-icon oxygen-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M12 8v8m-4-4h8" strokeWidth="2"/>
              </svg>
            </div>
            <div className="sensor-info">
              <span className="sensor-label">Oxygen Level</span>
              <span className="sensor-value">{sensorData.oxygen_value || '0.00'}%</span>
            </div>
          </div>

          {/* Completed Layers */}
          <div className="sensor-card highlight" style={{ borderLeftColor: '#4ECDC4' }}>
            <div className="sensor-icon layers-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2"/>
              </svg>
            </div>
            <div className="sensor-info">
              <span className="sensor-label">Completed Layers</span>
              <span className="sensor-value">{sensorData.completed_layers || '0'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SensorPanel;