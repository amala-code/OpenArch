import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import SensorPanel from "./components/SensorPanel";
import ControlPanel from "./components/ControlPanel";
import GCodeViewer from "./components/GcodeViewer";
import ConnectionPanel from "./components/ConnectionPanel";

// ─────────────────────────────────────────────
// WebSocket hook — replaces all polling logic
// ─────────────────────────────────────────────
function useDeviceStream(deviceId, isConnected) {
  const [sensorData, setSensorData] = useState(null);
  const wsRef    = useRef(null);
  const retryRef = useRef(null);

  const connect = useCallback(() => {
    // Only open socket when user has connected a device
    if (!deviceId || !isConnected) return;

    // ws:// for local, wss:// for deployed backend
    // const WS_URL = "wss://aws-connectivity.vercel.app"; // ← change if needed
      const WS_URL = "wss://aws-connectivity.onrender.com"; // ← change if needed
    const ws = new WebSocket(`${WS_URL}/ws/device/${deviceId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log(`[WS] Connected → device: ${deviceId}`);

    ws.onmessage = (e) => {
      try {
        const { event, data } = JSON.parse(e.data);
        if (event === "ping") { ws.send("ping"); return; }
        // INITIAL, INSERT, MODIFY — all update sensor panel
        setSensorData(data);
      } catch {
        console.warn("[WS] Bad message:", e.data);
      }
    };

    ws.onerror = () => console.error("[WS] Error");

    ws.onclose = () => {
      if (isConnected) {
        // Auto-reconnect only if user hasn't disconnected
        retryRef.current = setTimeout(connect, 3000);
        console.log("[WS] Dropped — retrying in 3s...");
      }
    };
  }, [deviceId, isConnected]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // Let parent reset sensor data on disconnect
  const clearData = () => setSensorData(null);

  return { sensorData, setSensorData, clearData };
}


// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
function App() {
  const [gcode, setGcode]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [fileName, setFileName]     = useState("");

  const [deviceId, setDeviceId]       = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // const BACKEND_URL = "https://aws-connectivity.vercel.app";

  const BACKEND_URL = "https://aws-connectivity.onrender.com";

  // ← autoRefresh and polling are GONE, replaced by WebSocket
  const { sensorData, setSensorData, clearData } = useDeviceStream(deviceId, isConnected);

  // Refs for async callbacks (filename send etc.)
  const deviceIdRef    = useRef(deviceId);
  const isConnectedRef = useRef(isConnected);
  useEffect(() => { deviceIdRef.current    = deviceId;    }, [deviceId]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  // ── Filename send (unchanged) ──────────────────────────────────────────────
  const sendFileNameToBackend = async (name) => {
    const currentDeviceId    = deviceIdRef.current;
    const currentIsConnected = isConnectedRef.current;
    if (!currentIsConnected || !currentDeviceId) {
      console.warn("Filename not sent — device not connected yet.");
      return;
    }
    try {
      const res = await fetch(
        `${BACKEND_URL}/device/${currentDeviceId}/filename?filename=${encodeURIComponent(name)}`,
        { method: "POST" }
      );
      if (res.ok) { console.log("✅ Filename sent:", name); return; }
    } catch (err) {
      console.warn("/filename failed, falling back to /command:", err);
    }
    try {
      await fetch(
        `${BACKEND_URL}/device/${currentDeviceId}/command?command=file:${encodeURIComponent(name)}`,
        { method: "POST" }
      );
      console.log("✅ Filename sent via /command:", name);
    } catch (err) {
      console.error("Error sending filename:", err);
    }
  };

  // ── File upload (unchanged) ────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['gcode','txt','nc','ngc'].includes(ext)) {
      alert('Please upload a valid G-Code file (.gcode, .nc, .ngc, or .txt)');
      return;
    }
    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      if (!/^[GM]\d+/m.test(content)) {
        if (!window.confirm('This file may not contain valid G-Code. Load anyway?')) {
          setIsLoading(false); setFileName(""); return;
        }
      }
      setGcode(content);
      setIsLoading(false);
      sendFileNameToBackend(file.name);
    };
    reader.onerror = () => {
      alert("Error reading file."); setIsLoading(false); setFileName("");
    };
    reader.readAsText(file);
  };

  const clearGcodeState = () => {
    setGcode(""); setFileName(""); setIsLoading(false);
    const fi = document.getElementById('file-upload');
    if (fi) fi.value = "";
  };

  const resetAllStates = () => {
    setDeviceId("");
    setIsConnected(false);
    clearData();          // ← clears sensorData from hook
    clearGcodeState();
  };

  return (
    <div className="App">
      <ConnectionPanel
        deviceId={deviceId}
        setDeviceId={setDeviceId}
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        setSensorData={setSensorData}
        // autoRefresh and setAutoRefresh props removed — no longer needed
        BACKEND_URL={BACKEND_URL}
        resetAllStates={resetAllStates}
      />

      <div className="dashboard-container">
        <div className="panel-25">
          <SensorPanel
            sensorData={sensorData}
            isConnected={isConnected}
            deviceId={deviceId}
            BACKEND_URL={BACKEND_URL}
          />
        </div>

        <div className="panel-50">
          <div className="gcode-section">
            <div className="gcode-header">
              <h2>G-Code 3D Visualizer</h2>
              <div className="file-upload-container">
                <label htmlFor="file-upload" className="file-upload-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload G-Code
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".gcode,.nc,.ngc,.txt"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                {fileName  && <span className="file-name">{fileName}</span>}
                {isLoading && <span className="loading-text">Loading...</span>}
              </div>
            </div>

            {gcode && (
              <div className="viewer-instructions">
                <div className="instructions-row">
                  <div className="instruction-item"><span className="icon">🖱️</span><span><strong>Left Drag:</strong> Rotate</span></div>
                  <div className="instruction-item"><span className="icon">🖱️</span><span><strong>Right Drag:</strong> Pan</span></div>
                  <div className="instruction-item"><span className="icon">🔍</span><span><strong>Scroll:</strong> Zoom</span></div>
                </div>
              </div>
            )}

            <div className="viewer-container compact">
              {!gcode ? (
                <div className="empty-viewer">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>Upload a G-Code file to visualize</p>
                  <p className="supported-formats">Supports: .gcode, .nc, .ngc, .txt</p>
                </div>
              ) : (
                <GCodeViewer
                  gcode={gcode}
                  buildVolume={{ x: 200, y: 200, z: 200 }}
                  backgroundColor="#0a0a0a"
                  onProgress={(p) => console.log("Load progress:", Math.round(p * 100) + "%")}
                  onFinishLoading={(info) => console.log("Loaded:", info)}
                  onError={(err) => console.error("Viewer error:", err)}
                />
              )}
            </div>
          </div>

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
                <span className="command-value">
                  {isConnected && sensorData && Object.keys(sensorData).length > 0
                    ? sensorData.UnknownCommand || 'No UnknownCommand found'
                    : 'No Message received'}
                </span>
              </div>
              <div className="command-indicator">
                <div className="pulse-dot"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-25">
          <ControlPanel
            deviceId={deviceId}
            isConnected={isConnected}
            BACKEND_URL={BACKEND_URL}
            onAbort={resetAllStates}
          />
        </div>
      </div>
    </div>
  );
}

export default App;