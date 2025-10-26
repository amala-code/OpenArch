// // import React, { useState } from "react";
// // import "./App.css";
// // import DeviceController from "./DeviceController";
// // import SensorPanel from "./components/SensorPanel";
// // import ControlPanel from "./components/ControlPanel";
// // import GCodeViewer from "./components/GcodeViewer";

// // function App() {
// //   const [gcode, setGcode] = useState("");
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [fileName, setFileName] = useState("");

// //   const handleFileUpload = (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;

// //     setIsLoading(true);
// //     setFileName(file.name);
// //     const reader = new FileReader();
    
// //     reader.onload = (event) => {
// //       setGcode(event.target.result);
// //       setIsLoading(false);
// //       console.log("G-code file loaded successfully");
// //     };
    
// //     reader.onerror = (error) => {
// //       console.error("Error reading file:", error);
// //       setIsLoading(false);
// //     };
    
// //     reader.readAsText(file);
// //   };

// //   return (
// //     <div className="App">
// //       {/* Hidden DeviceController - keeping your existing logic intact */}
// //       <div style={{ display: 'none' }}>
// //         <DeviceController />
// //       </div>

// //       {/* Main Dashboard Layout */}
// //       <div className="dashboard-container">
// //         {/* Left Panel - 30% */}
// //         <div className="left-panel">
// //           {/* Sensor Panel */}
// //           <SensorPanel />
          
// //           {/* Control Panel */}
// //           <ControlPanel />
// //         </div>

// //         {/* Right Panel - 70% */}
// //         <div className="right-panel">
// //           <div className="gcode-section">
// //             <div className="gcode-header">
// //               <h2>G-Code 3D Visualizer</h2>
              
// //               {/* File upload */}
// //               <div className="file-upload-container">
// //                 <label htmlFor="file-upload" className="file-upload-label">
// //                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
// //                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
// //                   </svg>
// //                   Upload G-Code
// //                 </label>
// //                 <input
// //                   id="file-upload"
// //                   type="file"
// //                   accept=".gcode,.nc,.ngc"
// //                   onChange={handleFileUpload}
// //                   className="file-input"
// //                 />
// //                 {fileName && <span className="file-name">{fileName}</span>}
// //                 {isLoading && <span className="loading-text">Loading...</span>}
// //               </div>
// //             </div>

// //             {/* Instructions */}
// //             {gcode && (
// //               <div className="viewer-instructions">
// //                 <div className="instructions-row">
// //                   <div className="instruction-item">
// //                     <span className="icon">🖱️</span>
// //                     <span><strong>Left Drag:</strong> Rotate</span>
// //                   </div>
// //                   <div className="instruction-item">
// //                     <span className="icon">🖱️</span>
// //                     <span><strong>Right Drag:</strong> Pan</span>
// //                   </div>
// //                   <div className="instruction-item">
// //                     <span className="icon">🔍</span>
// //                     <span><strong>Scroll:</strong> Zoom</span>
// //                   </div>
// //                 </div>
// //               </div>
// //             )}

// //             {/* G-code viewer */}
// //             <div className="viewer-container">
// //               {!gcode ? (
// //                 <div className="empty-viewer">
// //                   <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor">
// //                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
// //                     <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
// //                   </svg>
// //                   <p>Upload a G-Code file to visualize</p>
// //                 </div>
// //               ) : (
// //                 <GCodeViewer
// //                   gcode={gcode}
// //                   extrusionColor={[
// //                     "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
// //                     "#98D8C8", "#FFD93D", "#C084FC", "#F472B6"
// //                   ]}
// //                   buildVolume={{ x: 200, y: 200, z: 200 }}
// //                   backgroundColor="#0a0a0a"
// //                   onProgress={(p) => console.log("Load progress:", Math.round(p * 100) + "%")}
// //                   onFinishLoading={(info) => console.log("Loaded G-code info:", info)}
// //                   onError={(err) => console.error("Viewer error:", err)}
// //                 />
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // export default App;


// import React, { useState } from "react";
// import "./App.css";
// import SensorPanel from "./components/SensorPanel";
// import ControlPanel from "./components/ControlPanel";
// import GCodeViewer from "./components/GcodeViewer";
// import ConnectionPanel from "./components/ConnectionPanel";

// function App() {
//   const [gcode, setGcode] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [fileName, setFileName] = useState("");
  
//   // Device connection states
//   const [deviceId, setDeviceId] = useState('');
//   const [isConnected, setIsConnected] = useState(false);
//   const [sensorData, setSensorData] = useState(null);
//   const [autoRefresh, setAutoRefresh] = useState(false);

//   const BACKEND_URL = "https://aws-connectivity.vercel.app";

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setIsLoading(true);
//     setFileName(file.name);
//     const reader = new FileReader();
    
//     reader.onload = (event) => {
//       setGcode(event.target.result);
//       setIsLoading(false);
//       console.log("G-code file loaded successfully");
//     };
    
//     reader.onerror = (error) => {
//       console.error("Error reading file:", error);
//       setIsLoading(false);
//     };
    
//     reader.readAsText(file);
//   };

//   return (
//     <div className="App">
//       {/* Connection Panel - Top */}
//       <ConnectionPanel 
//         deviceId={deviceId}
//         setDeviceId={setDeviceId}
//         isConnected={isConnected}
//         setIsConnected={setIsConnected}
//         setSensorData={setSensorData}
//         autoRefresh={autoRefresh}
//         setAutoRefresh={setAutoRefresh}
//         BACKEND_URL={BACKEND_URL}
//       />

//       {/* Main Dashboard Layout */}
//       <div className="dashboard-container">
//         {/* Left Panel - 30% */}
//         <div className="left-panel">
//           {/* Sensor Panel */}
//           <SensorPanel 
//             sensorData={sensorData}
//             isConnected={isConnected}
//           />
          
//           {/* Control Panel */}
//           <ControlPanel 
//             deviceId={deviceId}
//             isConnected={isConnected}
//             BACKEND_URL={BACKEND_URL}
//           />
//         </div>

//         {/* Right Panel - 70% */}
//         <div className="right-panel">
//           <div className="gcode-section">
//             <div className="gcode-header">
//               <h2>G-Code 3D Visualizer</h2>
              
//               {/* File upload */}
//               <div className="file-upload-container">
//                 <label htmlFor="file-upload" className="file-upload-label">
//                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                     <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                   Upload G-Code
//                 </label>
//                 <input
//                   id="file-upload"
//                   type="file"
//                   accept=".gcode,.nc,.ngc,.txt"
//                   onChange={handleFileUpload}
//                   className="file-input"
//                 />
//                 {fileName && <span className="file-name">{fileName}</span>}
//                 {isLoading && <span className="loading-text">Loading...</span>}
//               </div>
//             </div>

//             {/* Instructions */}
//             {gcode && (
//               <div className="viewer-instructions">
//                 <div className="instructions-row">
//                   <div className="instruction-item">
//                     <span className="icon">🖱️</span>
//                     <span><strong>Left Drag:</strong> Rotate</span>
//                   </div>
//                   <div className="instruction-item">
//                     <span className="icon">🖱️</span>
//                     <span><strong>Right Drag:</strong> Pan</span>
//                   </div>
//                   <div className="instruction-item">
//                     <span className="icon">🔍</span>
//                     <span><strong>Scroll:</strong> Zoom</span>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* G-code viewer */}
//             <div className="viewer-container">
//               {!gcode ? (
//                 <div className="empty-viewer">
//                   <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                     <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//                   </svg>
//                   <p>Upload a G-Code file to visualize</p>
//                 </div>
//               ) : (
//                 <GCodeViewer
//                   gcode={gcode}
//                   extrusionColor={[
//                     "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
//                     "#98D8C8", "#FFD93D", "#C084FC", "#F472B6"
//                   ]}
//                   buildVolume={{ x: 200, y: 200, z: 200 }}
//                   backgroundColor="#0a0a0a"
//                   onProgress={(p) => console.log("Load progress:", Math.round(p * 100) + "%")}
//                   onFinishLoading={(info) => console.log("Loaded G-code info:", info)}
//                   onError={(err) => console.error("Viewer error:", err)}
//                 />
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState } from "react";
import "./App.css";
import SensorPanel from "./components/SensorPanel";
import ControlPanel from "./components/ControlPanel";
import GCodeViewer from "./components/GcodeViewer";
import ConnectionPanel from "./components/ConnectionPanel";

function App() {
  const [gcode, setGcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  
  // Device connection states
  const [deviceId, setDeviceId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const BACKEND_URL = "https://aws-connectivity.vercel.app";

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is .gcode or .txt
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'gcode' && fileExtension !== 'txt' && fileExtension !== 'nc' && fileExtension !== 'ngc') {
      alert('Please upload a valid G-Code file (.gcode, .nc, .ngc, or .txt)');
      return;
    }

    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target.result;
      
      // Validate if content looks like G-Code
      const gcodePattern = /^[GM]\d+/m; // Looks for G or M commands
      if (!gcodePattern.test(content)) {
        const confirmLoad = window.confirm(
          'This file may not contain valid G-Code. Do you want to try loading it anyway?'
        );
        if (!confirmLoad) {
          setIsLoading(false);
          setFileName("");
          return;
        }
      }
      
      setGcode(content);
      setIsLoading(false);
      console.log("G-code file loaded successfully");
      console.log("File type:", fileExtension);
      console.log("File size:", content.length, "characters");
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Error reading file. Please try again.");
      setIsLoading(false);
      setFileName("");
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="App">
      {/* Connection Panel - Top */}
      <ConnectionPanel 
        deviceId={deviceId}
        setDeviceId={setDeviceId}
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        setSensorData={setSensorData}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        BACKEND_URL={BACKEND_URL}
      />

      {/* Main Dashboard Layout */}
      <div className="dashboard-container">
        {/* Left Panel - 30% */}
        <div className="left-panel">
          {/* Sensor Panel */}
          <SensorPanel 
            sensorData={sensorData}
            isConnected={isConnected}
          />
          
          {/* Control Panel */}
          <ControlPanel 
            deviceId={deviceId}
            isConnected={isConnected}
            BACKEND_URL={BACKEND_URL}
          />
        </div>

        {/* Right Panel - 70% */}
        <div className="right-panel">
          <div className="gcode-section">
            <div className="gcode-header">
              <h2>G-Code 3D Visualizer</h2>
              
              {/* File upload */}
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
                {fileName && <span className="file-name">{fileName}</span>}
                {isLoading && <span className="loading-text">Loading...</span>}
              </div>
            </div>

            {/* Instructions */}
            {gcode && (
              <div className="viewer-instructions">
                <div className="instructions-row">
                  <div className="instruction-item">
                    <span className="icon">🖱️</span>
                    <span><strong>Left Drag:</strong> Rotate</span>
                  </div>
                  <div className="instruction-item">
                    <span className="icon">🖱️</span>
                    <span><strong>Right Drag:</strong> Pan</span>
                  </div>
                  <div className="instruction-item">
                    <span className="icon">🔍</span>
                    <span><strong>Scroll:</strong> Zoom</span>
                  </div>
                </div>
              </div>
            )}

            {/* G-code viewer */}
            <div className="viewer-container">
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
                  extrusionColor={[
                    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
                    "#98D8C8", "#FFD93D", "#C084FC", "#F472B6"
                  ]}
                  buildVolume={{ x: 200, y: 200, z: 200 }}
                  backgroundColor="#0a0a0a"
                  onProgress={(p) => console.log("Load progress:", Math.round(p * 100) + "%")}
                  onFinishLoading={(info) => console.log("Loaded G-code info:", info)}
                  onError={(err) => console.error("Viewer error:", err)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;