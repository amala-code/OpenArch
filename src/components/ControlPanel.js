import React, { useState } from "react";
import "./ControlPanel.css";

const ControlPanel = ({ deviceId, isConnected, BACKEND_URL }) => {
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

  const [sendingCommand, setSendingCommand] = useState(false);

  // Convert to DynamoDB format
  const convertToDynamoFormat = (data) => {
    const converted = {};
    converted.deviceId = { S: deviceId };
    converted.timestamp = { N: Date.now().toString() };
    
    const numberFields = ['Temperature1', 'Temperature2', 'Temperature3', 'Temperature4', 
                         'AverageTemperature', 'OxygenSensor', 'NumberOfLayers', 'LoadCell'];
    const stringFields = ['Command', 'OptionalCommand', 'GCodeFile', 'Status', 'LEDState'];
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== '' && value !== null && value !== undefined) {
        if (numberFields.includes(key)) {
          converted[key] = { N: value.toString() };
        } else if (stringFields.includes(key)) {
          converted[key] = { S: value.toString() };
        }
      }
    }
    return converted;
  };

  // Send command via API
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
      showNotification(`Command '${command}' sent successfully!`, 'success');
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
    <div className="control-panel">
      <div className="panel-header sticky">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
          <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2"/>
          <line x1="9" y1="15" x2="15" y2="15" strokeWidth="2"/>
        </svg>
        <h3>Control Panel</h3>
        {!isConnected && (
          <span className="warning-badge">Not Connected</span>
        )}
      </div>

      <div className="control-content">
        {!isConnected ? (
          <div className="no-connection-control">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
            </svg>
            <p>Connect to a device to access controls</p>
          </div>
        ) : (
          <>
            {/* Operation Controls */}
            <div className="control-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" strokeWidth="2"/>
                </svg>
                Operations
              </h4>
              <div className="button-grid">
                <button className="control-btn primary" onClick={() => sendCommand('A')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  </svg>
                  Single Dosing
                </button>
                <button className="control-btn primary" onClick={() => sendCommand('B')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="9" cy="12" r="3" strokeWidth="2"/>
                    <circle cx="15" cy="12" r="3" strokeWidth="2"/>
                  </svg>
                  Double Dosing
                </button>
                <button className="control-btn success" onClick={() => sendCommand('Q')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="9 11 12 14 22 4" strokeWidth="2"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/>
                  </svg>
                  Final Run
                </button>
                <button className="control-btn danger" onClick={() => sendCommand('O')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
                  </svg>
                  Abort
                </button>
                <button className="control-btn warning" onClick={() => sendCommand('P')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="6" y="4" width="4" height="16" strokeWidth="2"/>
                    <rect x="14" y="4" width="4" height="16" strokeWidth="2"/>
                  </svg>
                  Play/Pause
                </button>
                <button className="control-btn" onClick={() => sendCommand('R')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="23 4 23 10 17 10" strokeWidth="2"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeWidth="2"/>
                  </svg>
                  Mode
                </button>
              </div>
            </div>

            {/* Spreader Controls */}
            <div className="control-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="4" y1="21" x2="4" y2="14" strokeWidth="2"/>
                  <line x1="4" y1="10" x2="4" y2="3" strokeWidth="2"/>
                  <line x1="12" y1="21" x2="12" y2="12" strokeWidth="2"/>
                </svg>
                Spreader
              </h4>
              <div className="button-grid">
                <button className="control-btn" onClick={() => sendCommand('f')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2"/>
                    <polyline points="12 19 5 12 12 5" strokeWidth="2"/>
                  </svg>
                  Back
                </button>
                <button className="control-btn" onClick={() => sendCommand('r')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
                    <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
                  </svg>
                  Front
                </button>
                <button className="control-btn" onClick={() => sendCommand('H')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2"/>
                  </svg>
                  Home
                </button>
                <button className="control-btn" onClick={() => sendCommand('T')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2"/>
                  </svg>
                  Test
                </button>
              </div>
            </div>

            {/* Plate & Galvo Controls */}
            <div className="control-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                </svg>
                Plate & Galvo
              </h4>
              <div className="button-grid">
                <button className="control-btn" onClick={() => sendCommand('u')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="19" x2="12" y2="5" strokeWidth="2"/>
                    <polyline points="5 12 12 5 19 12" strokeWidth="2"/>
                  </svg>
                  Plate Up
                </button>
                <button className="control-btn" onClick={() => sendCommand('d')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/>
                    <polyline points="19 12 12 19 5 12" strokeWidth="2"/>
                  </svg>
                  Plate Down
                </button>
                <button className="control-btn" onClick={() => sendCommand('i')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="19" x2="12" y2="5" strokeWidth="2"/>
                    <polyline points="5 12 12 5 19 12" strokeWidth="2"/>
                  </svg>
                  Galvo Up
                </button>
                <button className="control-btn" onClick={() => sendCommand('j')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"/>
                    <polyline points="19 12 12 19 5 12" strokeWidth="2"/>
                  </svg>
                  Galvo Down
                </button>
                <button className="control-btn" onClick={() => sendCommand('J')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2"/>
                  </svg>
                  Galvo Home
                </button>
              </div>
            </div>

            {/* System Controls */}
            <div className="control-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                  <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24" strokeWidth="2"/>
                </svg>
                System
              </h4>
              <div className="button-grid">
                <button className="control-btn" onClick={() => sendCommand('b')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2" strokeWidth="2"/>
                  </svg>
                  Blower
                </button>
                <button className="control-btn" onClick={() => sendCommand('c')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
                  </svg>
                  Door Lock
                </button>
                <button className="control-btn" onClick={() => sendCommand('e')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="5" strokeWidth="2"/>
                    <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2"/>
                  </svg>
                  Optics
                </button>
                <button className="control-btn" onClick={() => sendCommand('E')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="16" strokeWidth="2"/>
                  </svg>
                  Emission
                </button>
                <button className="control-btn" onClick={() => sendCommand('F')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="5" strokeWidth="2" fill="currentColor"/>
                  </svg>
                  Light
                </button>
                <button className="control-btn danger" onClick={() => sendCommand('p')} disabled={sendingCommand}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                  </svg>
                  Power Int
                </button>
              </div>
            </div>

            {/* Test Operations */}
            <div className="control-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2"/>
                  <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/>
                </svg>
                Tests
              </h4>
              <div className="button-grid">
                <button className="control-btn test" onClick={() => sendCommand('U')} disabled={sendingCommand}>
                  <span>U</span>
                  Collection
                </button>
                <button className="control-btn test" onClick={() => sendCommand('V')} disabled={sendingCommand}>
                  <span>V</span>
                  Layer
                </button>
                <button className="control-btn test" onClick={() => sendCommand('W')} disabled={sendingCommand}>
                  <span>W</span>
                  SCL
                </button>
                <button className="control-btn test" onClick={() => sendCommand('X')} disabled={sendingCommand}>
                  <span>X</span>
                  Laser
                </button>
              </div>
            </div>

            {/* Parameter Inputs - Responsive */}
            <div className="control-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="4" y1="21" x2="4" y2="14" strokeWidth="2"/>
                  <line x1="4" y1="10" x2="4" y2="3" strokeWidth="2"/>
                </svg>
                Parameters
              </h4>
              
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
    </div>
  );
};

export default ControlPanel;