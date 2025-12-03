import React from "react";
import { useState } from "react";
import "./SensorPanel.css";

const SensorPanel = ({ sensorData, isConnected, deviceId, BACKEND_URL }) => {
  const [sendingCommand, setSendingCommand] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const [inputValues, setInputValues] = useState({
    spreaderSpeed: "",
    collectionDelay: "",
    buildLayer: "",
    tempSetpoint: "",
    spreaderPos: "",
    buildPlate: "",
    buildPlateMicron: "",
    opticsMotor: "",
    resumeLayer: ""
  });

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

  const sendCommand = async (command) => {
    if (!isConnected || !deviceId) {
      alert("Please connect to a device first!");
      return;
    }

    setSendingCommand(true);
    try {
      await fetch(`${BACKEND_URL}/device/${deviceId}/command?command=${command}`, {
        method: "POST",
      });
      
      console.log("Command sent:", command);
      // setLastCommand(command); // update last sent command

      showNotification(`Command '${command}' sent successfully!`, 'success');
      setTimeout(() => {
        fetch(`${BACKEND_URL}/device/${deviceId}/command?command=`, {
          method: "POST",
        })
          .then(() => console.log("Empty command sent to clear backend"))
          .catch((err) => console.error("Error clearing command:", err));
      }, 2000);

    } catch (error) {
      console.error("Error sending command:", error);
      showNotification("Failed to send command", 'error');
    } finally {
      setSendingCommand(false);
    }
  };

  // Send value command (with prefix)
  const sendValueCommand = async (prefix, value) => {
    if (!value) {
      alert("Please enter a value!");
      return;
    }
    await sendCommand(`${prefix}${value}`);
  };

  const handleInputChange = (field, value) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  const showNotification = (message, type) => {
    if (type === 'success') {
      console.log('✓', message);
    } else {
      console.error('✗', message);
    }
  };

  return (
    <div className="sensor-panel">
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
        <>
          {/* Sensor Readings Section */}
          <div className="sensors-container">
            {/* Row 1: Temperature 1 & 2 */}
            <div className="sensor-row">
              <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.Temperature1 || 0, 'temp') }}>
                <div className="sensor-icon temp-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="sensor-info">
                  <span className="sensor-label">Temperature 2</span>
                  <span className="sensor-value">{sensorData.Temp2 || '0.0'}°C</span>
                </div>
              </div>
            </div>

            {/* Row 2: Temperature 3 & 4 */}
            <div className="sensor-row">
              <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.Temp3 || 0, 'temp') }}>
                <div className="sensor-icon temp-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="sensor-info">
                  <span className="sensor-label">Temperature 4</span>
                  <span className="sensor-value">{sensorData.Temp4 || '0.0'}°C</span>
                </div>
              </div>
            </div>

            {/* Row 3: Average Temp & Oxygen */}
            <div className="sensor-row">
              <div className="sensor-card highlight" style={{ borderLeftColor: '#FF8C42' }}>
                <div className="sensor-icon avg-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <polyline points="12 6 12 12 16 14" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="sensor-info">
                  <span className="sensor-label">Average Temp</span>
                  <span className="sensor-value">{sensorData.average_temp || '0.0'}°C</span>
                </div>
              </div>

              <div className="sensor-card" style={{ borderLeftColor: getStatusColor(sensorData.oxygen_value || 0, 'oxygen') }}>
                <div className="sensor-icon oxygen-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <path d="M12 8v8m-4-4h8" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="sensor-info">
                  <span className="sensor-label">Oxygen Level</span>
                  <span className="sensor-value">{sensorData.oxygen_value || '0.00'}%</span>
                </div>
              </div>
            </div>

            {/* Row 4: Completed Layers (single card centered or full width) */}
            <div className="sensor-row single">
              <div className="sensor-card highlight" style={{ borderLeftColor: '#4ECDC4' }}>
                <div className="sensor-icon layers-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
          </div>

          {/* Parameter Inputs - Responsive */}
          <div className="control-section">
            {/* <h4 className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="4" y1="21" x2="4" y2="14" strokeWidth="2"/>
                <line x1="4" y1="10" x2="4" y2="3" strokeWidth="2"/>
              </svg>
              Parameters
            </h4> */}
            
            <div className="input-grid">
              <div className="input-group">
                <label>Speed (%)</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="0-100"
                    value={inputValues.spreaderSpeed}
                    onChange={(e) => handleInputChange('spreaderSpeed', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('s', inputValues.spreaderSpeed)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Delay (ms)</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="ms"
                    value={inputValues.collectionDelay}
                    onChange={(e) => handleInputChange('collectionDelay', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('w', inputValues.collectionDelay)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Layer</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="no"
                    value={inputValues.buildLayer}
                    onChange={(e) => handleInputChange('buildLayer', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('l', inputValues.buildLayer)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Temp (°C)</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="°C"
                    value={inputValues.tempSetpoint}
                    onChange={(e) => handleInputChange('tempSetpoint', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('t', inputValues.tempSetpoint)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Spreader (mm)</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="mm"
                    value={inputValues.spreaderPos}
                    onChange={(e) => handleInputChange('spreaderPos', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('x', inputValues.spreaderPos)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Plate (mm)</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="mm"
                    value={inputValues.buildPlate}
                    onChange={(e) => handleInputChange('buildPlate', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('z', inputValues.buildPlate)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Plate (µm)</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="µm"
                    value={inputValues.buildPlateMicron}
                    onChange={(e) => handleInputChange('buildPlateMicron', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('n', inputValues.buildPlateMicron)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Optics (mm)</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="mm"
                    value={inputValues.opticsMotor}
                    onChange={(e) => handleInputChange('opticsMotor', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('k', inputValues.opticsMotor)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Resume Layer</label>
                <div className="input-with-button">
                  <input 
                    type="number" 
                    placeholder="no"
                    value={inputValues.resumeLayer}
                    onChange={(e) => handleInputChange('resumeLayer', e.target.value)}
                  />
                  <button 
                    className="send-btn"
                    onClick={() => sendValueCommand('q', inputValues.resumeLayer)}
                    disabled={sendingCommand}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                      <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="input-group full-width">
                <button 
                  className="control-btn special full"
                  onClick={() => sendCommand('o')}
                  disabled={sendingCommand}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3h18v18H3z" strokeWidth="2"/>
                  </svg>
                  Loadcell Tare
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SensorPanel;