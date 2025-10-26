// // GCodeViewer.js
// import React, { useEffect, useRef, useState } from "react";
// import * as GCodePreview from "gcode-preview";
// import "./GCodeViewer.css";

// const GCodeViewer = ({
//   gcode,
//   url,
//   extrusionColor = ["#ff007f", "#00ffff", "#00ff7f"],
//   buildVolume = { x: 200, y: 200, z: 200 },
//   backgroundColor = "#111",
//   onProgress,
//   onFinishLoading,
//   onError,
// }) => {
//   const canvasRef = useRef(null);
//   const containerRef = useRef(null);
//   const [preview, setPreview] = useState(null);

//   // Initialize canvas and preview
//   useEffect(() => {
//     if (!canvasRef.current || !containerRef.current) return;

//     // Set canvas dimensions
//     const container = containerRef.current;
//     const width = container.clientWidth;
//     const height = container.clientHeight;
    
//     canvasRef.current.width = width;
//     canvasRef.current.height = height;

//     try {
//       const instance = GCodePreview.init({
//         canvas: canvasRef.current,
//         extrusionColor,
//         buildVolume,
//         backgroundColor,
//         onProgress: (p) => {
//           console.log("Progress:", p);
//           onProgress && onProgress(p);
//         },
//         onFinishLoading: (info) => {
//           console.log("Finished loading:", info);
//           onFinishLoading && onFinishLoading(info);
//         },
//         onError: (err) => {
//           console.error("Preview error:", err);
//           onError && onError(err);
//         },
//       });
      
//       console.log("GCodePreview initialized:", instance);
//       setPreview(instance);
//     } catch (err) {
//       console.error("Error initializing GCodePreview:", err);
//       if (onError) onError(err);
//     }

//     // Handle window resize
//     const handleResize = () => {
//       if (canvasRef.current && containerRef.current) {
//         const newWidth = containerRef.current.clientWidth;
//         const newHeight = containerRef.current.clientHeight;
//         canvasRef.current.width = newWidth;
//         canvasRef.current.height = newHeight;
        
//         // Trigger re-render if preview exists
//         if (preview && preview.resize) {
//           preview.resize();
//         }
//       }
//     };

//     window.addEventListener("resize", handleResize);
//     console.log("Gcode first 500 chars:", gcode.substring(0, 500));
//     return () => {
//       window.removeEventListener("resize", handleResize);
//       if (preview) {
//         try {
//           preview.clear && preview.clear();
//         } catch (e) {
//           console.error("Error disposing preview:", e);
//         }
//       }
//     };
//   }, []); // Only run once on mount

//   // Process gcode when it changes
//   useEffect(() => {
//     if (!preview || !gcode) return;

//     console.log("Processing gcode, length:", gcode.length);
    
//     try {
//       preview.clear && preview.clear();
//       preview.processGCode(gcode);
//     } catch (err) {
//       console.error("Error processing GCode:", err);
//       if (onError) onError(err);
//     }
//   }, [preview, gcode, onError]);

//   // Process URL if provided
//   useEffect(() => {
//     if (!preview || !url || gcode) return; // Skip if gcode is already provided

//     fetch(url)
//       .then((res) => res.text())
//       .then((data) => {
//         console.log("Fetched gcode from URL, length:", data.length);
//         preview.clear && preview.clear();
//         preview.processGCode(data);
//       })
//       .catch((err) => {
//         console.error("Failed to fetch GCode:", err);
//         if (onError) onError(err);
//       });
//   }, [preview, url, gcode, onError]);

//   return (
//     <div className="gcode-container" ref={containerRef}>
//       <canvas ref={canvasRef} className="gcode-canvas" />
//     </div>
//   );
// };

// export default GCodeViewer;

// GCodeViewer.js
import React, { useEffect, useRef, useState } from "react";
import * as GCodePreview from "gcode-preview";
import "./GCodeViewer.css";

const GCodeViewer = ({
  gcode,
  url,
  extrusionColor = [
    "#FF6B6B", // Red for tool 0
    "#4ECDC4", // Teal for tool 1
    "#45B7D1", // Blue for tool 2
    "#FFA07A", // Orange for tool 3
    "#98D8C8", // Mint for tool 4
    "#FFD93D", // Yellow for tool 5
    "#C084FC", // Purple for tool 6
    "#F472B6"  // Pink for tool 7
  ],
  buildVolume = { x: 200, y: 200, z: 200 },
  backgroundColor = "#1a1a1a",
  onProgress,
  onFinishLoading,
  onError,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [preview, setPreview] = useState(null);

  // Initialize canvas and preview
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    console.log("Initializing GCodePreview with dimensions:", canvas.width, "x", canvas.height);

    try {
      const instance = GCodePreview.init({
        canvas: canvas,
        extrusionColor: extrusionColor,
        travelColor: "#666666",
        buildVolume: buildVolume,
        backgroundColor: backgroundColor,
        // Enable camera controls for zoom/pan/rotate
        allowDragNDrop: false,
        // Quality settings
        lineWidth: 1,
        renderTravels: false,
        renderExtrusion: true,
        startLayer: 0,
        endLayer: Infinity,
        topLayerColor: "#FFFFFF",
        lastSegmentColor: "#00FF00",
        // Show XYZ axis lines
        renderAxes: true,
        axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
        // Show build volume box
        renderBuildVolume: true,
        // Callbacks
        onProgress: (p) => {
          console.log("Loading progress:", Math.round(p * 100) + "%");
          onProgress && onProgress(p);
        },
        onFinishLoading: (info) => {
          console.log("Finished loading G-code:", info);
          onFinishLoading && onFinishLoading(info);
        },
        onError: (err) => {
          console.error("Preview error:", err);
          onError && onError(err);
        },
      });
      
      console.log("GCodePreview instance created:", instance);
      setPreview(instance);
    } catch (err) {
      console.error("Error initializing GCodePreview:", err);
      if (onError) onError(err);
    }

    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        canvasRef.current.width = newWidth;
        canvasRef.current.height = newHeight;
        
        console.log("Resizing canvas to:", newWidth, "x", newHeight);
        
        // Re-render the preview
        if (preview && gcode) {
          try {
            preview.clear();
            preview.processGCode(gcode);
          } catch (e) {
            console.error("Error re-rendering after resize:", e);
          }
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (preview && preview.clear) {
        try {
          preview.clear();
        } catch (e) {
          console.error("Error disposing preview:", e);
        }
      }
    };
  }, []); // Only run once on mount

  // Process gcode when it changes
  useEffect(() => {
    if (!preview || !gcode) return;

    console.log("Processing G-code, length:", gcode.length);
    console.log("First 500 chars:", gcode.substring(0, 500));
    
    try {
      preview.clear();
      preview.processGCode(gcode);
    } catch (err) {
      console.error("Error processing G-code:", err);
      if (onError) onError(err);
    }
  }, [preview, gcode, onError]);

  // Process URL if provided
  useEffect(() => {
    if (!preview || !url || gcode) return;

    console.log("Fetching G-code from URL:", url);
    
    fetch(url)
      .then((res) => res.text())
      .then((data) => {
        console.log("Fetched G-code from URL, length:", data.length);
        preview.clear();
        preview.processGCode(data);
      })
      .catch((err) => {
        console.error("Failed to fetch G-code:", err);
        if (onError) onError(err);
      });
  }, [preview, url, gcode, onError]);

  return (
    <div className="gcode-container" ref={containerRef}>
      <canvas ref={canvasRef} className="gcode-canvas" />
    </div>
  );
};

export default GCodeViewer;