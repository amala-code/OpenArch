


import React, { useState, useRef, useCallback } from "react";
import "./ControlPanel.css";

// ✅ FIX 5: Right-click tooltip to show previous sent value per input field
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
      {history.slice().reverse().map((entry, i) => (
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

const ControlPanel = ({ deviceId, isConnected, BACKEND_URL, onAbort }) => {
  const [inputValues, setInputValues] = useState({
    spreaderSpeed: "", collectionDelay: "", buildLayer: "",
    tempSetpoint: "", spreaderPos: "", buildPlate: "",
    buildPlateMicron: "", opticsMotor: "", resumeLayer: ""
  });

  const [sendingCommand, setSendingCommand] = useState(false);
  // ✅ FIX 5: Per-field command history (last 5 per field)
  const [commandHistory, setCommandHistory] = useState({});
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, fieldKey: null });

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

  // ✅ FIX 5: Track history per field key
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
  };

  const handleInputChange = (field, value) => {
    setInputValues(prev => ({ ...prev, [field]: value }));
  };

  // Show tooltip on right-click of send button
  const handleRightClick = useCallback((e, fieldKey) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left - 190,
      y: rect.top,
      fieldKey
    });
  }, []);

  const closeTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const activeHistory = tooltip.fieldKey ? (commandHistory[tooltip.fieldKey] || []) : [];

  // Reusable send button with right-click for history
  const SendBtn = ({ prefix, field }) => (
    <button
      className="send-btn"
      onClick={() => sendValueCommand(prefix, inputValues[field], field)}
      onContextMenu={(e) => handleRightClick(e, field)}
      disabled={sendingCommand}
      title="Click to send | Right-click to view history"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"/>
        <polyline points="12 5 19 12 12 19" strokeWidth="2"/>
      </svg>
    </button>
  );

  return (
    <div className="control-panel">
      <CommandTooltip
        history={activeHistory}
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        onClose={closeTooltip}
      />

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

                {/* ✅ FIX 2: Abort sends command AND clears gcode viewer */}
                <button
                  className="control-btn danger"
                  onClick={async () => {
                    await sendCommand('O');
                    if (typeof onAbort === 'function') onAbort();
                  }}
                  disabled={sendingCommand}
                >
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
                  <span>U</span>Collection
                </button>
                <button className="control-btn test" onClick={() => sendCommand('V')} disabled={sendingCommand}>
                  <span>V</span>Layer
                </button>
                <button className="control-btn test" onClick={() => sendCommand('W')} disabled={sendingCommand}>
                  <span>W</span>SCL
                </button>
                <button className="control-btn test" onClick={() => sendCommand('X')} disabled={sendingCommand}>
                  <span>X</span>Laser
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;