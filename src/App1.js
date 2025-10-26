// import React, { useState } from "react";
// import logo from "./logo.svg";
// import "./App.css";
// import DeviceController from "./DeviceController";
// import GCodeViewer from "./Gcode";

// function App() {
//   const [gcode, setGcode] = useState("");

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       setGcode(event.target.result);
//     };
//     reader.readAsText(file);
//   };

//   return (
//     <div className="App">
//       {/* Existing component */}
//       <DeviceController />

//       {/* G-code upload + viewer */}
//       <div className="gcode-section">
//         <input
//           type="file"
//           accept=".gcode"
//           onChange={handleFileUpload}
//           className="file-input"
//         />
//         <GCodeViewer
//           gcode={gcode}
//           extrusionColor={["#ff007f", "#00ffff", "#00ff7f"]}
//           buildVolume={{ x: 200, y: 200, z: 200 }}
//           backgroundColor="#000"
//           onProgress={(p) => console.log("Progress:", p)}
//           onFinishLoading={(info) => console.log("Loaded:", info)}
//           onError={(err) => console.error("Error:", err)}
//         />
//       </div>
//     </div>
//   );
// }

// export default App;


import React, { useState } from "react";
import "./App.css";
import DeviceController from "./DeviceController";
import GCodeViewer from "./Gcode";

function App() {
  const [gcode, setGcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      setGcode(event.target.result);
      setIsLoading(false);
      console.log("G-code file loaded successfully");
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="App">
      {/* Existing device controller */}
      <DeviceController />

      {/* G-code upload and viewer section */}
      <div className="gcode-section" style={{ padding: "20px" }}>
        <h2>G-Code Viewer</h2>
        
        {/* File upload */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="file"
            accept=".gcode,.nc,.ngc"
            onChange={handleFileUpload}
            className="file-input"
            style={{
              padding: "10px",
              border: "2px solid #4ECDC4",
              borderRadius: "6px",
              backgroundColor: "#2a2a2a",
              color: "white",
              cursor: "pointer"
            }}
          />
          {isLoading && <span style={{ marginLeft: "10px", color: "#4ECDC4" }}>Loading...</span>}
        </div>

        {/* Instructions */}
        <div style={{
          backgroundColor: "#2a2a2a",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "20px",
          color: "#ccc"
        }}>
          <strong>Controls:</strong>
          <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
            <li>🖱️ <strong>Left Click + Drag:</strong> Rotate the view</li>
            <li>🖱️ <strong>Right Click + Drag:</strong> Pan the view</li>
            <li>🔍 <strong>Mouse Wheel:</strong> Zoom in/out</li>
            <li>🎨 <strong>Colors:</strong> Different colors represent different tools/extruders or layers</li>
          </ul>
          <strong>Axes:</strong>
          <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
            <li>🔴 <strong>Red Line:</strong> X-axis</li>
            <li>🟢 <strong>Green Line:</strong> Y-axis</li>
            <li>🔵 <strong>Blue Line:</strong> Z-axis</li>
          </ul>
        </div>

        {/* G-code viewer with multi-color support */}
        <GCodeViewer
          gcode={gcode}
          // Array of colors for different tools/parts - each tool gets a unique color
          extrusionColor={[
            "#FF6B6B", // Tool 0 - Red
            "#4ECDC4", // Tool 1 - Teal
            "#45B7D1", // Tool 2 - Blue
            "#FFA07A", // Tool 3 - Orange
            "#98D8C8", // Tool 4 - Mint
            "#FFD93D", // Tool 5 - Yellow
            "#C084FC", // Tool 6 - Purple
            "#F472B6"  // Tool 7 - Pink
          ]}
          buildVolume={{ x: 200, y: 200, z: 200 }}
          backgroundColor="#1a1a1a"
          onProgress={(p) => console.log("Load progress:", Math.round(p * 100) + "%")}
          onFinishLoading={(info) => console.log("Loaded G-code info:", info)}
          onError={(err) => console.error("Viewer error:", err)}
        />
      </div>
    </div>
  );
}

export default App;