
import React from "react";
import { useState, useCallback } from "react";
import "./SensorPanel.css";

// ✅ FIX 5: Shared right-click tooltip component
const CommandTooltip = ({ history, visible, x, y, onClose }) => {
  if (!visible || history.length === 0) return null;

  return (
    <div
      onMouseLeave={onClose}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 9999,
        backgroundColor: '#1a2332',
        border: '1px solid rgba(139,180,204,0.3)',
        borderRadius: '8px',
        padding: '10px',
        minWidth: '180px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', letterSpacing: '0.05em' }}>
        COMMAND HISTORY
      </div>
      {history.slice().map((entry, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 0', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
        }}>
          <span style={{ fontFamily: 'monospace', color: i === 0 ? '#8BB4CC' : 'rgba(255,255,255,0.55)', fontSize: '13px' }}>
            {entry.command}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: '12px' }}>
            {entry.time}
          </span>
        </div>
      ))}
    </div>
  );
};

// Defined outside SensorPanel so it is never re-created on re-render (fixes single-char input bug)
const InputGroup = ({ label, prefix, field, inputValues, lastSentValues, handleInputChange, sendValueCommand, handleRightClick, sendingCommand }) => {
  const sendValue = () => sendValueCommand(prefix, inputValues[field], field);
  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="input-with-button">
        <input
          type="text"
          placeholder={lastSentValues[field] !== undefined ? String(lastSentValues[field]) : '—'}
          value={inputValues[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendValue()}
        />
        <button
          className="send-btn"
          onClick={sendValue}
          onContextMenu={(e) => { e.preventDefault(); handleRightClick(e, field); }}
          disabled={sendingCommand}
          title="Click to send | Right-click to view history"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
            <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      <div style={{
        fontSize: '10px',
        marginTop: '3px',
        paddingLeft: '2px',
        fontFamily: 'monospace',
        color: lastSentValues[field] !== undefined ? 'rgba(139,180,204,0.75)' : 'rgba(255,255,255,0.2)'
      }}>
        {lastSentValues[field] !== undefined ? `prev: ${lastSentValues[field]}` : 'not sent yet'}
      </div>
    </div>
  );
};

// ── Helper: compute gradient style for a sensor card ──────────────────────────
// setpoint: the value user sent (number or undefined)
// current:  live reading (number)
// type:     'temp' | 'oxygen'
const ROOM_TEMP = 25;       // °C assumed room temperature
const ROOM_OXYGEN = 20.9;   // % assumed ambient oxygen

// Neon colour palette
const NEON = {
  green:  { rgb: '0, 255, 163',   hex: '#00FFA3' },
  yellow: { rgb: '255, 234, 0',   hex: '#FFEA00' },
  orange: { rgb: '255, 115, 0',   hex: '#FF7300' },
  red:    { rgb: '255, 20, 80',   hex: '#FF1450' },
};

const getRatio = (current, setpoint, type) => {
  if (setpoint === undefined || setpoint === null) return null;
  if (type === 'temp') {
    const range = Math.max(setpoint - ROOM_TEMP, 1);
    return Math.max(0, Math.min((current - ROOM_TEMP) / range, 1.3));
  } else {
    const range = Math.max(ROOM_OXYGEN - setpoint, 1);
    return Math.max(0, Math.min((ROOM_OXYGEN - current) / range, 1.3));
  }
};

const pickNeon = (ratio) => {
  if (ratio === null)    return NEON.green;
  if (ratio <= 0.33)     return NEON.green;
  if (ratio <= 0.66)     return NEON.yellow;
  if (ratio <= 1.0)      return NEON.orange;
  return NEON.red;
};

const getSensorGradient = (current, setpoint, type) => {
  const ratio = getRatio(current, setpoint, type);
  const neon  = pickNeon(ratio);

  if (ratio === null) {
    return `linear-gradient(135deg, rgba(${neon.rgb},0.13) 0%, rgba(${neon.rgb},0.03) 100%)`;
  }

  // intensity scales with ratio so it glows brighter as it climbs
  const intensity = 0.18 + Math.min(ratio, 1.3) * 0.22;
  return `linear-gradient(135deg, rgba(${neon.rgb},${intensity.toFixed(2)}) 0%, rgba(${neon.rgb},0.04) 100%)`;
};

// Border left colour + neon box-shadow
const getSensorBorderColor = (current, setpoint, type) => {
  const ratio = getRatio(current, setpoint, type);
  return pickNeon(ratio).hex;
};

// Glow shadow to apply on the card element
const getSensorGlow = (current, setpoint, type) => {
  const ratio = getRatio(current, setpoint, type);
  const neon  = pickNeon(ratio);
  if (ratio === null) return `0 0 8px rgba(${neon.rgb},0.2)`;
  const spread = 6 + Math.min(ratio, 1.3) * 14;
  return `0 0 ${spread.toFixed(0)}px rgba(${neon.rgb},0.55), inset 0 0 ${(spread * 0.4).toFixed(0)}px rgba(${neon.rgb},0.08)`;
};

const SensorPanel = ({ sensorData, isConnected, deviceId, BACKEND_URL }) => {
  const [sendingCommand, setSendingCommand] = useState(false);
  const [inputValues, setInputValues] = useState({
    spreaderSpeed: "", collectionDelay: "", buildLayer: "",
    tempSetpoint: "", spreaderPos: "", buildPlate: "",
    buildPlateMicron: "", opticsMotor: "", resumeLayer: "",
    oxygenSetpoint: ""
  });

  const [commandHistory, setCommandHistory] = useState({});
  const [lastSentValues, setLastSentValues] = useState({});
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, fieldKey: null });

  // ── Sent setpoints for gradient logic ──────────────────────────────────────
  const [sentTempSetpoint, setSentTempSetpoint]     = useState(undefined);
  const [sentOxygenSetpoint, setSentOxygenSetpoint] = useState(undefined);

  const sendCommand = async (command) => {
    if (!isConnected || !deviceId) {
      alert("Please connect to a device first!");
      return;
    }
    setSendingCommand(true);
    try {
      await fetch(`${BACKEND_URL}/device/${deviceId}/command?command=${command}`, { method: "POST" });
      console.log("Command sent:", command);
      setTimeout(() => {
        fetch(`${BACKEND_URL}/device/${deviceId}/command?command=`, { method: "POST" })
          .catch((err) => console.error("Error clearing command:", err));
      }, 2000);
    } catch (error) {
      console.error("Error sending command:", error);
    } finally {
      setSendingCommand(false);
    }
  };

  const sendValueCommand = async (prefix, value, fieldKey) => {
    if (!value) { alert("Please enter a value!"); return; }
    const command = `${prefix}${value}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setCommandHistory(prev => {
      const prevList = prev[fieldKey] || [];
      const updated = [{ command, time: timeStr }, ...prevList].slice(0, 5);
      return { ...prev, [fieldKey]: updated };
    });

    await sendCommand(command);
    setLastSentValues(prev => ({ ...prev, [fieldKey]: value }));

    // ── capture setpoints for gradient ──────────────────────────────────────
    const num = parseFloat(value);
    if (fieldKey === 'tempSetpoint' && !isNaN(num))    setSentTempSetpoint(num);
    if (fieldKey === 'oxygenSetpoint' && !isNaN(num))  setSentOxygenSetpoint(num);
  };

  const handleInputChange = (field, value) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  const handleRightClick = useCallback((e, fieldKey) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ visible: true, x: rect.right + 8, y: rect.top, fieldKey });
  }, []);

  const closeTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const activeHistory = tooltip.fieldKey ? (commandHistory[tooltip.fieldKey] || []) : [];

  // live readings (numbers)
  const avgTemp    = parseFloat(sensorData?.average_temp) || 0;
  const oxygenVal  = parseFloat(sensorData?.oxygen_value) || 0;

  // per-temp-card gradient (uses each individual reading vs tempSetpoint)
  const tempCards = [
    { label: 'Temperature 1', value: sensorData?.Temp1 || '0.0' },
    { label: 'Temperature 2', value: sensorData?.Temp2 || '0.0' },
    { label: 'Temperature 3', value: sensorData?.Temp3 || '0.0' },
    { label: 'Temperature 4', value: sensorData?.Temp4 || '0.0' },
  ];

  return (
    <div className="sensor-panel">
      <CommandTooltip
        history={activeHistory}
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        onClose={closeTooltip}
      />

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
          {/* ── Sensor Readings Section ─────────────────────────────────────── */}
          <div className="sensors-container">

            {/* Row 1 & 2: Temperature 1–4 with dynamic gradients */}
            {[tempCards.slice(0, 2), tempCards.slice(2, 4)].map((row, rowIdx) => (
              <div className="sensor-row" key={rowIdx}>
                {row.map(({ label, value }) => {
                  const num = parseFloat(value) || 0;
                  const bg  = getSensorGradient(num, sentTempSetpoint, 'temp');
                  const bc  = getSensorBorderColor(num, sentTempSetpoint, 'temp');
                  // glow applied inline below via getSensorGlow
                  return (
                    <div
                      key={label}
                      className="sensor-card"
                      style={{
                        borderLeftColor: bc,
                        background: bg,
                        boxShadow: getSensorGlow(num, sentTempSetpoint, 'temp'),
                        transition: 'background 1.2s ease, border-left-color 1.2s ease, box-shadow 1.2s ease',
                      }}
                    >
                      <div className="sensor-icon temp-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="sensor-info">
                        <span className="sensor-label">{label}</span>
                        <span className="sensor-value">{value}°C</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Row 3: Average Temp & Oxygen — both with dynamic gradients */}
            <div className="sensor-row">
              <div
                className="sensor-card highlight"
                style={{
                  borderLeftColor: getSensorBorderColor(avgTemp, sentTempSetpoint, 'temp'),
                  background: getSensorGradient(avgTemp, sentTempSetpoint, 'temp'),
                  boxShadow: getSensorGlow(avgTemp, sentTempSetpoint, 'temp'),
                  transition: 'background 1.2s ease, border-left-color 1.2s ease, box-shadow 1.2s ease',
                }}
              >
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

              <div
                className="sensor-card"
                style={{
                  borderLeftColor: getSensorBorderColor(oxygenVal, sentOxygenSetpoint, 'oxygen'),
                  background: getSensorGradient(oxygenVal, sentOxygenSetpoint, 'oxygen'),
                  boxShadow: getSensorGlow(oxygenVal, sentOxygenSetpoint, 'oxygen'),
                  transition: 'background 1.2s ease, border-left-color 1.2s ease, box-shadow 1.2s ease',
                }}
              >
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

            {/* Row 4: Completed Layers */}
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

          {/* ── Parameter Inputs — scrollable container ─────────────────────── */}
          <div className="control-section">
            {/* scroll track hint */}
            <div
              className="input-scroll-wrapper"
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '4px',
                /* custom thin scrollbar */
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(139,180,204,0.35) rgba(255,255,255,0.04)',
              }}
            >
              <div className="input-grid">
                <InputGroup label="Speed (%)"     prefix="s" field="spreaderSpeed"   inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Delay (ms)"    prefix="w" field="collectionDelay" inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Layer"         prefix="l" field="buildLayer"      inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Temp (°C)"     prefix="t" field="tempSetpoint"    inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Oxygen (%)"    prefix="O" field="oxygenSetpoint"  inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Spreader (mm)" prefix="x" field="spreaderPos"     inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Plate (mm)"    prefix="z" field="buildPlate"      inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Plate (µm)"    prefix="n" field="buildPlateMicron"inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Optics (mm)"   prefix="k" field="opticsMotor"     inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />
                <InputGroup label="Resume Layer"  prefix="q" field="resumeLayer"     inputValues={inputValues} lastSentValues={lastSentValues} handleInputChange={handleInputChange} sendValueCommand={sendValueCommand} handleRightClick={handleRightClick} sendingCommand={sendingCommand} />

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

            {/* subtle scroll indicator bar at bottom */}
            <div style={{
              height: '3px',
              background: 'linear-gradient(90deg, rgba(139,180,204,0.0) 0%, rgba(139,180,204,0.25) 50%, rgba(139,180,204,0.0) 100%)',
              borderRadius: '2px',
              marginTop: '6px',
              opacity: 0.7,
            }} />
          </div>
        </>
      )}
    </div>
  );
};

export default SensorPanel;