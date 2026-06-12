import React, { useEffect, useRef, useState } from "react";
import "./ConnectionPanel.css";

// ─── Serial Port Modal ────────────────────────────────────────────────────────
const SerialMonitorModal = ({ onClose }) => {
  const [serialConnected, setSerialConnected] = useState(false);
  const [baudRate, setBaudRate] = useState(9600);
  const [serialLog, setSerialLog] = useState([]);
  const [portInfo, setPortInfo] = useState(null);
  const [error, setError] = useState("");
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const logEndRef = useRef(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [serialLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { disconnectSerial(); };
  }, []);

  const connectSerial = async () => {
    setError("");
    if (!("serial" in navigator)) {
      setError("Web Serial API is not supported in this browser. Use Chrome or Edge.");
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: Number(baudRate) });
      portRef.current = port;

      // Show port info if available
      const info = port.getInfo?.() || {};
      setPortInfo(info);
      setSerialConnected(true);
      readLoop(port);
    } catch (err) {
      if (err.name !== "NotFoundError") {
        setError(`Failed to open port: ${err.message}`);
      }
    }
  };

  const readLoop = async (port) => {
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    readerRef.current = reader;

    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        // Split on newlines so each line is its own entry
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete last chunk
        lines.forEach((line) => {
          if (line.trim()) {
            const entry = {
              id: Date.now() + Math.random(),
              time: new Date().toLocaleTimeString(),
              data: line.trim(),
            };
            setSerialLog((prev) => [...prev.slice(-500), entry]);
          }
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("[Serial]", err);
    }
  };

  const disconnectSerial = async () => {
    try {
      await readerRef.current?.cancel();
    } catch {}
    try {
      await portRef.current?.close();
    } catch {}
    portRef.current = null;
    readerRef.current = null;
    setSerialConnected(false);
    setPortInfo(null);
  };

  const clearLog = () => setSerialLog([]);

  return (
    <div className="serial-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="serial-modal">
        {/* Header */}
        <div className="serial-modal-header">
          <div className="serial-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="7" width="20" height="10" rx="2" strokeWidth="2"/>
              <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" strokeWidth="2"/>
              <line x1="12" y1="12" x2="12.01" y2="12" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Serial Port Monitor
          </div>
          <button className="serial-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Controls */}
        <div className="serial-controls">
          <div className="serial-baud-group">
            <label>Baud Rate</label>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(e.target.value)}
              disabled={serialConnected}
              className="serial-baud-select"
            >
              {[300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {!serialConnected ? (
            <button className="serial-connect-btn" onClick={connectSerial}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Select &amp; Connect Port
            </button>
          ) : (
            <button className="serial-disconnect-btn" onClick={disconnectSerial}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
              </svg>
              Disconnect
            </button>
          )}

          <button className="serial-clear-btn" onClick={clearLog}>
            Clear
          </button>
        </div>

        {/* Port info & status */}
        <div className="serial-status-bar">
          <span className={`serial-status-dot ${serialConnected ? "connected" : "disconnected"}`}></span>
          <span className="serial-status-text">
            {serialConnected
              ? `Connected${portInfo?.usbVendorId ? ` · VID:${portInfo.usbVendorId.toString(16).toUpperCase()} PID:${portInfo.usbProductId?.toString(16).toUpperCase()}` : ""}`
              : "Not connected — click 'Select & Connect Port' to choose a serial port"}
          </span>
          {serialConnected && (
            <span className="serial-baud-badge">{baudRate} baud</span>
          )}
        </div>

        {error && <div className="serial-error">{error}</div>}

        {/* Terminal */}
        <div className="serial-terminal">
          {serialLog.length === 0 ? (
            <div className="serial-empty">
              {serialConnected
                ? "Waiting for data from device…"
                : "Connect to a serial port to start receiving data."}
            </div>
          ) : (
            serialLog.map((entry) => (
              <div key={entry.id} className="serial-line">
                <span className="serial-line-time">{entry.time}</span>
                <span className="serial-line-data">{entry.data}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>

        <div className="serial-footer">
          {serialLog.length} line{serialLog.length !== 1 ? "s" : ""} received
        </div>
      </div>
    </div>
  );
};

// ─── ConnectionPanel ──────────────────────────────────────────────────────────
const ConnectionPanel = ({
  deviceId,
  setDeviceId,
  isConnected,
  setIsConnected,
  setSensorData,
  autoRefresh,
  setAutoRefresh,
  BACKEND_URL,
  resetAllStates
}) => {
  const [usbEnabled, setUsbEnabled] = useState(false);
  const [showSerialModal, setShowSerialModal] = useState(false);

  // Fetch device data
  const fetchDeviceData = async () => {
    if (!deviceId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/device/${deviceId}`);
      const data = await res.json();
      console.log("API Response:", data);

      const deviceData = Array.isArray(data) ? data[0] : data;
      setSensorData(deviceData || null);
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsConnected(false);
      setSensorData(null);
    }
  };

  useEffect(() => {
    if (autoRefresh && deviceId && isConnected) {
      const interval = setInterval(fetchDeviceData, 1500);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, deviceId, isConnected]);

  const handleConnect = () => {
    if (deviceId.trim()) fetchDeviceData();
  };

  const handleDisconnect = () => {
    clearInterval(window.deviceRefreshInterval);
    if (typeof resetAllStates === "function") resetAllStates();
  };

  const handleUsbToggle = () => {
    const next = !usbEnabled;
    setUsbEnabled(next);
    if (next) setShowSerialModal(true);
  };

  const handleSerialModalClose = () => {
    setShowSerialModal(false);
    setUsbEnabled(false);
  };

  return (
    <>
      <div className="connection-panel">
        <div className="connection-content">
          <div className="connection-left">
            <img src="./logo.png" className="logo" alt="logo" />
            <h3>OpenArch Software v0.1</h3>
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
                <button onClick={handleDisconnect} className="disconnect-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                  </svg>
                  Disconnect
                </button>
              )}
            </div>

            <div className="status-indicator">
              <span className={`status-dot ${isConnected ? "connected" : "disconnected"}`}></span>
              <span className="status-text">
                {isConnected ? `Connected to ${deviceId}` : "Not Connected"}
              </span>
            </div>

            {/* USB Serial Toggle */}
            <div className="usb-toggle-group" title="USB Serial Monitor">
              <span className="usb-toggle-label">USB Serial</span>
              <button
                className={`usb-toggle-btn ${usbEnabled ? "active" : ""}`}
                onClick={handleUsbToggle}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="2" y="7" width="20" height="10" rx="2" strokeWidth="2"/>
                  <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" strokeWidth="2"/>
                  <line x1="9" y1="12" x2="15" y2="12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className={`toggle-switch ${usbEnabled ? "on" : "off"}`}>
                  <span className="toggle-knob"></span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSerialModal && (
        <SerialMonitorModal onClose={handleSerialModalClose} />
      )}
    </>
  );
};

export default ConnectionPanel;
