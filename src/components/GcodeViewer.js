// import React, { useEffect, useRef, useState } from "react";
// import * as GCodePreview from "gcode-preview";
// import "./GcodeViewer.css";

// const GCodeViewer = ({
//   gcode,
//   url,
//   extrusionColor = [
//     "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
//     "#98D8C8", "#FFD93D", "#C084FC", "#F472B6"
//   ],
//   buildVolume = { x: 200, y: 200, z: 200 },
//   backgroundColor = "#0a0a0a",
//   onProgress,
//   onFinishLoading,
//   onError,
// }) => {
//   const canvasRef = useRef(null);
//   const containerRef = useRef(null);
//   const [preview, setPreview] = useState(null);
//   const [loadProgress, setLoadProgress] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const processingTimeoutRef = useRef(null);

//   // Optimize GCode before processing (removes comments, empty lines)
//   const optimizeGCode = (gcodeText) => {
//     if (!gcodeText) return "";
    
//     // Split into lines and process
//     const lines = gcodeText.split('\n');
//     const optimized = lines
//       .map(line => line.trim())
//       .filter(line => {
//         // Remove empty lines
//         if (!line) return false;
//         // Remove comment-only lines
//         if (line.startsWith(';')) return false;
//         if (line.startsWith('(') && line.endsWith(')')) return false;
//         return true;
//       })
//       .map(line => {
//         // Remove inline comments
//         const semicolonIndex = line.indexOf(';');
//         if (semicolonIndex !== -1) {
//           return line.substring(0, semicolonIndex).trim();
//         }
//         const parenIndex = line.indexOf('(');
//         if (parenIndex !== -1) {
//           return line.substring(0, parenIndex).trim();
//         }
//         return line;
//       })
//       .filter(line => line.length > 0);

//     return optimized.join('\n');
//   };

//   // Initialize canvas and preview
//   useEffect(() => {
//     if (!canvasRef.current || !containerRef.current) return;

//     const container = containerRef.current;
//     const canvas = canvasRef.current;
    
//     // Set canvas dimensions
//     const rect = container.getBoundingClientRect();
//     canvas.width = rect.width;
//     canvas.height = rect.height;

//     console.log("Initializing GCodePreview with dimensions:", canvas.width, "x", canvas.height);

//     try {
//       const instance = GCodePreview.init({
//         canvas: canvas,
//         extrusionColor: extrusionColor,
//         travelColor: "#333333",
//         buildVolume: buildVolume,
//         backgroundColor: backgroundColor,
//         allowDragNDrop: false,
//         // Optimized settings for faster rendering
//         lineWidth: 1.5,
//         renderTravels: false, // Disable travels for faster rendering
//         renderExtrusion: true,
//         startLayer: 0,
//         endLayer: Infinity,
//         topLayerColor: "#FFFFFF",
//         lastSegmentColor: "#00FF00",
//         renderAxes: true,
//         axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
//         renderBuildVolume: true,
//         // Optimize quality settings
//         quality: {
//           // Reduce geometry complexity for faster loading
//           arcSegments: 8, // Lower = faster (default is usually 16)
//           extrusionSegments: 8
//         },
//         onProgress: (p) => {
//           setLoadProgress(Math.round(p * 100));
//           setIsLoading(p < 1);
//           onProgress && onProgress(p);
//         },
//         onFinishLoading: (info) => {
//           setIsLoading(false);
//           setLoadProgress(100);
//           console.log("Finished loading G-code:", info);
//           onFinishLoading && onFinishLoading(info);
//         },
//         onError: (err) => {
//           setIsLoading(false);
//           console.error("Preview error:", err);
//           onError && onError(err);
//         },
//       });
      
//       setPreview(instance);
//     } catch (err) {
//       console.error("Error initializing GCodePreview:", err);
//       if (onError) onError(err);
//     }

//     // Handle window resize with debouncing
//     let resizeTimeout;
//     const handleResize = () => {
//       clearTimeout(resizeTimeout);
//       resizeTimeout = setTimeout(() => {
//         if (canvasRef.current && containerRef.current) {
//           const rect = containerRef.current.getBoundingClientRect();
//           canvasRef.current.width = rect.width;
//           canvasRef.current.height = rect.height;
          
//           // Re-render only if we have gcode
//           if (preview && gcode) {
//             try {
//               preview.resize();
//             } catch (e) {
//               console.error("Error resizing:", e);
//             }
//           }
//         }
//       }, 250); // Debounce resize
//     };

//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       clearTimeout(resizeTimeout);
//       if (processingTimeoutRef.current) {
//         clearTimeout(processingTimeoutRef.current);
//       }
//       if (preview && preview.clear) {
//         try {
//           preview.clear();
//         } catch (e) {
//           console.error("Error disposing preview:", e);
//         }
//       }
//     };
//   }, []);

//   // Process gcode when it changes
//   useEffect(() => {
//     if (!preview || !gcode) return;

//     setIsLoading(true);
//     setLoadProgress(0);

//     // Clear any existing timeout
//     if (processingTimeoutRef.current) {
//       clearTimeout(processingTimeoutRef.current);
//     }

//     // Optimize GCode first
//     console.log("Original G-code length:", gcode.length);
//     const optimizedGCode = optimizeGCode(gcode);
//     console.log("Optimized G-code length:", optimizedGCode.length);
//     console.log("Reduction:", ((1 - optimizedGCode.length / gcode.length) * 100).toFixed(1) + "%");
    
//     // Process with a slight delay to allow UI to update
//     processingTimeoutRef.current = setTimeout(() => {
//       try {
//         preview.clear();
//         preview.processGCode(optimizedGCode);
//       } catch (err) {
//         console.error("Error processing G-code:", err);
//         setIsLoading(false);
//         if (onError) onError(err);
//       }
//     }, 100);

//   }, [preview, gcode, onError]);

//   // Process URL if provided
//   useEffect(() => {
//     if (!preview || !url || gcode) return;

//     setIsLoading(true);
//     setLoadProgress(0);
    
//     fetch(url)
//       .then((res) => res.text())
//       .then((data) => {
//         const optimizedGCode = optimizeGCode(data);
//         preview.clear();
//         preview.processGCode(optimizedGCode);
//       })
//       .catch((err) => {
//         console.error("Failed to fetch G-code:", err);
//         setIsLoading(false);
//         if (onError) onError(err);
//       });
//   }, [preview, url, gcode, onError]);

//   return (
//     <div className="gcode-container" ref={containerRef}>
//       <canvas ref={canvasRef} className="gcode-canvas" />
// {/*       
//       {isLoading && (
//         <div className="loading-overlay">
//           <div className="loading-content">
//             <div className="loading-spinner"></div>
//             <div className="loading-text">Processing G-Code</div>
//             <div className="loading-percentage">{loadProgress}%</div>
//             <div className="loading-bar">
//               <div 
//                 className="loading-bar-fill" 
//                 style={{ width: `${loadProgress}%` }}
//               ></div>
//             </div>
//             <div className="loading-tip">
//               {loadProgress < 30 && "Parsing G-Code commands..."}
//               {loadProgress >= 30 && loadProgress < 60 && "Building 3D geometry..."}
//               {loadProgress >= 60 && loadProgress < 90 && "Rendering visualization..."}
//               {loadProgress >= 90 && "Almost done..."}
//             </div>
//           </div>
//         </div>
//       )} */}
//     </div>
//   );
// };

// export default GCodeViewer;

import React, { useEffect, useRef, useState } from "react";
import * as GCodePreview from "gcode-preview";
import "./GcodeViewer.css";

const GCodeViewer = ({
  gcode,
  url,
  extrusionColor = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#FFD93D", "#C084FC", "#F472B6"
  ],
  buildVolume = { x: 200, y: 200, z: 200 },
  backgroundColor = "#0a0a0a",
  onProgress,
  onFinishLoading,
  onError,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const processingTimeoutRef = useRef(null);

  // Optimize GCode before processing (removes comments, empty lines)
  const optimizeGCode = (gcodeText) => {
    if (!gcodeText) return "";
    
    // Split into lines and process
    const lines = gcodeText.split('\n');
    const optimized = lines
      .map(line => line.trim())
      .filter(line => {
        // Remove empty lines
        if (!line) return false;
        // Remove comment-only lines
        if (line.startsWith(';')) return false;
        if (line.startsWith('(') && line.endsWith(')')) return false;
        return true;
      })
      .map(line => {
        // Remove inline comments
        const semicolonIndex = line.indexOf(';');
        if (semicolonIndex !== -1) {
          return line.substring(0, semicolonIndex).trim();
        }
        const parenIndex = line.indexOf('(');
        if (parenIndex !== -1) {
          return line.substring(0, parenIndex).trim();
        }
        return line;
      })
      .filter(line => line.length > 0);

    return optimized.join('\n');
  };

  // Initialize canvas and preview
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    console.log("Initializing GCodePreview with dimensions:", canvas.width, "x", canvas.height);

    try {
      const instance = GCodePreview.init({
        canvas: canvas,
        extrusionColor: extrusionColor,
        travelColor: "#333333",
        buildVolume: buildVolume,
        backgroundColor: backgroundColor,
        allowDragNDrop: false,
        // Optimized settings for faster rendering
        lineWidth: 1.5,
        renderTravels: false, // Disable travels for faster rendering
        renderExtrusion: true,
        startLayer: 0,
        endLayer: Infinity,
        topLayerColor: "#FFFFFF",
        lastSegmentColor: "#00FF00",
        renderAxes: true,
        axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
        renderBuildVolume: true,
        // Optimize quality settings
        quality: {
          // Reduce geometry complexity for faster loading
          arcSegments: 8, // Lower = faster (default is usually 16)
          extrusionSegments: 8
        },
        onProgress: (p) => {
          setLoadProgress(Math.round(p * 100));
          setIsLoading(p < 1);
          onProgress && onProgress(p);
        },
        onFinishLoading: (info) => {
          setIsLoading(false);
          setLoadProgress(100);
          console.log("Finished loading G-code:", info);
          onFinishLoading && onFinishLoading(info);
        },
        onError: (err) => {
          setIsLoading(false);
          console.error("Preview error:", err);
          onError && onError(err);
        },
      });
      
      setPreview(instance);
    } catch (err) {
      console.error("Error initializing GCodePreview:", err);
      if (onError) onError(err);
    }

    // Handle window resize with debouncing
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvasRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
          
          // Re-render only if we have gcode
          if (preview && gcode) {
            try {
              preview.resize();
            } catch (e) {
              console.error("Error resizing:", e);
            }
          }
        }
      }, 250); // Debounce resize
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      if (preview && preview.clear) {
        try {
          preview.clear();
        } catch (e) {
          console.error("Error disposing preview:", e);
        }
      }
    };
  }, []);

  // Process gcode when it changes
  useEffect(() => {
    if (!preview || !gcode) return;

    setIsLoading(true);
    setLoadProgress(0);

    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    // Optimize GCode first
    console.log("Original G-code length:", gcode.length);
    const optimizedGCode = optimizeGCode(gcode);
    console.log("Optimized G-code length:", optimizedGCode.length);
    console.log("Reduction:", ((1 - optimizedGCode.length / gcode.length) * 100).toFixed(1) + "%");
    
    // Process with a slight delay to allow UI to update
    processingTimeoutRef.current = setTimeout(() => {
      try {
        preview.clear();
        preview.processGCode(optimizedGCode);
      } catch (err) {
        console.error("Error processing G-code:", err);
        setIsLoading(false);
        if (onError) onError(err);
      }
    }, 100);

  }, [preview, gcode, onError]);

  // Process URL if provided
  useEffect(() => {
    if (!preview || !url || gcode) return;

    setIsLoading(true);
    setLoadProgress(0);
    
    fetch(url)
      .then((res) => res.text())
      .then((data) => {
        const optimizedGCode = optimizeGCode(data);
        preview.clear();
        preview.processGCode(optimizedGCode);
      })
      .catch((err) => {
        console.error("Failed to fetch G-code:", err);
        setIsLoading(false);
        if (onError) onError(err);
      });
  }, [preview, url, gcode, onError]);

  return (
    <div className="gcode-container" ref={containerRef}>
      <canvas ref={canvasRef} className="gcode-canvas" />
{/*       
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="loading-text">Processing G-Code</div>
            <div className="loading-percentage">{loadProgress}%</div>
            <div className="loading-bar">
              <div 
                className="loading-bar-fill" 
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
            <div className="loading-tip">
              {loadProgress < 30 && "Parsing G-Code commands..."}
              {loadProgress >= 30 && loadProgress < 60 && "Building 3D geometry..."}
              {loadProgress >= 60 && loadProgress < 90 && "Rendering visualization..."}
              {loadProgress >= 90 && "Almost done..."}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default GCodeViewer;