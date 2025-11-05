// // // // // import React, { useEffect, useRef, useState } from "react";
// // // // // import * as GCodePreview from "gcode-preview";
// // // // // import "./GcodeViewer.css";

// // // // // const GCodeViewer = ({
// // // // //   gcode,
// // // // //   url,
// // // // //   extrusionColor = [
// // // // //     "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
// // // // //     "#98D8C8", "#FFD93D", "#C084FC", "#F472B6"
// // // // //   ],
// // // // //   buildVolume = { x: 200, y: 200, z: 200 },
// // // // //   backgroundColor = "#0a0a0a",
// // // // //   onProgress,
// // // // //   onFinishLoading,
// // // // //   onError,
// // // // // }) => {
// // // // //   const canvasRef = useRef(null);
// // // // //   const containerRef = useRef(null);
// // // // //   const [preview, setPreview] = useState(null);
// // // // //   const [loadProgress, setLoadProgress] = useState(0);
// // // // //   const [isLoading, setIsLoading] = useState(false);
// // // // //   const processingTimeoutRef = useRef(null);

// // // // //   // Optimize GCode before processing (removes comments, empty lines)
// // // // //   const optimizeGCode = (gcodeText) => {
// // // // //     if (!gcodeText) return "";
    
// // // // //     // Split into lines and process
// // // // //     const lines = gcodeText.split('\n');
// // // // //     const optimized = lines
// // // // //       .map(line => line.trim())
// // // // //       .filter(line => {
// // // // //         // Remove empty lines
// // // // //         if (!line) return false;
// // // // //         // Remove comment-only lines
// // // // //         if (line.startsWith(';')) return false;
// // // // //         if (line.startsWith('(') && line.endsWith(')')) return false;
// // // // //         return true;
// // // // //       })
// // // // //       .map(line => {
// // // // //         // Remove inline comments
// // // // //         const semicolonIndex = line.indexOf(';');
// // // // //         if (semicolonIndex !== -1) {
// // // // //           return line.substring(0, semicolonIndex).trim();
// // // // //         }
// // // // //         const parenIndex = line.indexOf('(');
// // // // //         if (parenIndex !== -1) {
// // // // //           return line.substring(0, parenIndex).trim();
// // // // //         }
// // // // //         return line;
// // // // //       })
// // // // //       .filter(line => line.length > 0);

// // // // //     return optimized.join('\n');
// // // // //   };

// // // // //   // Initialize canvas and preview
// // // // //   useEffect(() => {
// // // // //     if (!canvasRef.current || !containerRef.current) return;

// // // // //     const container = containerRef.current;
// // // // //     const canvas = canvasRef.current;
    
// // // // //     // Set canvas dimensions
// // // // //     const rect = container.getBoundingClientRect();
// // // // //     canvas.width = rect.width;
// // // // //     canvas.height = rect.height;

// // // // //     console.log("Initializing GCodePreview with dimensions:", canvas.width, "x", canvas.height);

// // // // //     try {
// // // // //       const instance = GCodePreview.init({
// // // // //         canvas: canvas,
// // // // //         extrusionColor: extrusionColor,
// // // // //         travelColor: "#333333",
// // // // //         buildVolume: buildVolume,
// // // // //         backgroundColor: backgroundColor,
// // // // //         allowDragNDrop: false,
// // // // //         // Optimized settings for faster rendering
// // // // //         lineWidth: 1.5,
// // // // //         renderTravels: false, // Disable travels for faster rendering
// // // // //         renderExtrusion: true,
// // // // //         startLayer: 0,
// // // // //         endLayer: Infinity,
// // // // //         topLayerColor: "#FFFFFF",
// // // // //         lastSegmentColor: "#00FF00",
// // // // //         renderAxes: true,
// // // // //         axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
// // // // //         renderBuildVolume: true,
// // // // //         // Optimize quality settings
// // // // //         quality: {
// // // // //           // Reduce geometry complexity for faster loading
// // // // //           arcSegments: 8, // Lower = faster (default is usually 16)
// // // // //           extrusionSegments: 8
// // // // //         },
// // // // //         onProgress: (p) => {
// // // // //           setLoadProgress(Math.round(p * 100));
// // // // //           setIsLoading(p < 1);
// // // // //           onProgress && onProgress(p);
// // // // //         },
// // // // //         onFinishLoading: (info) => {
// // // // //           setIsLoading(false);
// // // // //           setLoadProgress(100);
// // // // //           console.log("Finished loading G-code:", info);
// // // // //           onFinishLoading && onFinishLoading(info);
// // // // //         },
// // // // //         onError: (err) => {
// // // // //           setIsLoading(false);
// // // // //           console.error("Preview error:", err);
// // // // //           onError && onError(err);
// // // // //         },
// // // // //       });
      
// // // // //       setPreview(instance);
// // // // //     } catch (err) {
// // // // //       console.error("Error initializing GCodePreview:", err);
// // // // //       if (onError) onError(err);
// // // // //     }

// // // // //     // Handle window resize with debouncing
// // // // //     let resizeTimeout;
// // // // //     const handleResize = () => {
// // // // //       clearTimeout(resizeTimeout);
// // // // //       resizeTimeout = setTimeout(() => {
// // // // //         if (canvasRef.current && containerRef.current) {
// // // // //           const rect = containerRef.current.getBoundingClientRect();
// // // // //           canvasRef.current.width = rect.width;
// // // // //           canvasRef.current.height = rect.height;
          
// // // // //           // Re-render only if we have gcode
// // // // //           if (preview && gcode) {
// // // // //             try {
// // // // //               preview.resize();
// // // // //             } catch (e) {
// // // // //               console.error("Error resizing:", e);
// // // // //             }
// // // // //           }
// // // // //         }
// // // // //       }, 250); // Debounce resize
// // // // //     };

// // // // //     window.addEventListener("resize", handleResize);

// // // // //     return () => {
// // // // //       window.removeEventListener("resize", handleResize);
// // // // //       clearTimeout(resizeTimeout);
// // // // //       if (processingTimeoutRef.current) {
// // // // //         clearTimeout(processingTimeoutRef.current);
// // // // //       }
// // // // //       if (preview && preview.clear) {
// // // // //         try {
// // // // //           preview.clear();
// // // // //         } catch (e) {
// // // // //           console.error("Error disposing preview:", e);
// // // // //         }
// // // // //       }
// // // // //     };
// // // // //   }, []);

// // // // //   // Process gcode when it changes
// // // // //   useEffect(() => {
// // // // //     if (!preview || !gcode) return;

// // // // //     setIsLoading(true);
// // // // //     setLoadProgress(0);

// // // // //     // Clear any existing timeout
// // // // //     if (processingTimeoutRef.current) {
// // // // //       clearTimeout(processingTimeoutRef.current);
// // // // //     }

// // // // //     // Optimize GCode first
// // // // //     console.log("Original G-code length:", gcode.length);
// // // // //     const optimizedGCode = optimizeGCode(gcode);
// // // // //     console.log("Optimized G-code length:", optimizedGCode.length);
// // // // //     console.log("Reduction:", ((1 - optimizedGCode.length / gcode.length) * 100).toFixed(1) + "%");
    
// // // // //     // Process with a slight delay to allow UI to update
// // // // //     processingTimeoutRef.current = setTimeout(() => {
// // // // //       try {
// // // // //         preview.clear();
// // // // //         preview.processGCode(optimizedGCode);
// // // // //       } catch (err) {
// // // // //         console.error("Error processing G-code:", err);
// // // // //         setIsLoading(false);
// // // // //         if (onError) onError(err);
// // // // //       }
// // // // //     }, 100);

// // // // //   }, [preview, gcode, onError]);

// // // // //   // Process URL if provided
// // // // //   useEffect(() => {
// // // // //     if (!preview || !url || gcode) return;

// // // // //     setIsLoading(true);
// // // // //     setLoadProgress(0);
    
// // // // //     fetch(url)
// // // // //       .then((res) => res.text())
// // // // //       .then((data) => {
// // // // //         const optimizedGCode = optimizeGCode(data);
// // // // //         preview.clear();
// // // // //         preview.processGCode(optimizedGCode);
// // // // //       })
// // // // //       .catch((err) => {
// // // // //         console.error("Failed to fetch G-code:", err);
// // // // //         setIsLoading(false);
// // // // //         if (onError) onError(err);
// // // // //       });
// // // // //   }, [preview, url, gcode, onError]);

// // // // //   return (
// // // // //     <div className="gcode-container" ref={containerRef}>
// // // // //       <canvas ref={canvasRef} className="gcode-canvas" />
// // // // // {/*       
// // // // //       {isLoading && (
// // // // //         <div className="loading-overlay">
// // // // //           <div className="loading-content">
// // // // //             <div className="loading-spinner"></div>
// // // // //             <div className="loading-text">Processing G-Code</div>
// // // // //             <div className="loading-percentage">{loadProgress}%</div>
// // // // //             <div className="loading-bar">
// // // // //               <div 
// // // // //                 className="loading-bar-fill" 
// // // // //                 style={{ width: `${loadProgress}%` }}
// // // // //               ></div>
// // // // //             </div>
// // // // //             <div className="loading-tip">
// // // // //               {loadProgress < 30 && "Parsing G-Code commands..."}
// // // // //               {loadProgress >= 30 && loadProgress < 60 && "Building 3D geometry..."}
// // // // //               {loadProgress >= 60 && loadProgress < 90 && "Rendering visualization..."}
// // // // //               {loadProgress >= 90 && "Almost done..."}
// // // // //             </div>
// // // // //           </div>
// // // // //         </div>
// // // // //       )} */}
// // // // //     </div>
// // // // //   );
// // // // // };

// // // // // export default GCodeViewer;

// // // // import React, { useEffect, useRef, useState } from "react";
// // // // import * as GCodePreview from "gcode-preview";
// // // // import "./GcodeViewer.css";

// // // // const GCodeViewer = ({
// // // //   gcode,
// // // //   url,
// // // //   extrusionColor = [
// // // //     "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
// // // //     "#98D8C8", "#FFD93D", "#C084FC", "#F472B6"
// // // //   ],
// // // //   buildVolume = { x: 200, y: 200, z: 200 },
// // // //   backgroundColor = "#0a0a0a",
// // // //   onProgress,
// // // //   onFinishLoading,
// // // //   onError,
// // // // }) => {
// // // //   const canvasRef = useRef(null);
// // // //   const containerRef = useRef(null);
// // // //   const [preview, setPreview] = useState(null);
// // // //   const [loadProgress, setLoadProgress] = useState(0);
// // // //   const [isLoading, setIsLoading] = useState(false);
// // // //   const processingTimeoutRef = useRef(null);

// // // //   // Optimize GCode before processing (removes comments, empty lines)
// // // //   const optimizeGCode = (gcodeText) => {
// // // //     if (!gcodeText) return "";
    
// // // //     // Split into lines and process
// // // //     const lines = gcodeText.split('\n');
// // // //     const optimized = lines
// // // //       .map(line => line.trim())
// // // //       .filter(line => {
// // // //         // Remove empty lines
// // // //         if (!line) return false;
// // // //         // Remove comment-only lines
// // // //         if (line.startsWith(';')) return false;
// // // //         if (line.startsWith('(') && line.endsWith(')')) return false;
// // // //         return true;
// // // //       })
// // // //       .map(line => {
// // // //         // Remove inline comments
// // // //         const semicolonIndex = line.indexOf(';');
// // // //         if (semicolonIndex !== -1) {
// // // //           return line.substring(0, semicolonIndex).trim();
// // // //         }
// // // //         const parenIndex = line.indexOf('(');
// // // //         if (parenIndex !== -1) {
// // // //           return line.substring(0, parenIndex).trim();
// // // //         }
// // // //         return line;
// // // //       })
// // // //       .filter(line => line.length > 0);

// // // //     return optimized.join('\n');
// // // //   };

// // // //   // Initialize canvas and preview
// // // //   useEffect(() => {
// // // //     if (!canvasRef.current || !containerRef.current) return;

// // // //     const container = containerRef.current;
// // // //     const canvas = canvasRef.current;
    
// // // //     // Set canvas dimensions
// // // //     const rect = container.getBoundingClientRect();
// // // //     canvas.width = rect.width;
// // // //     canvas.height = rect.height;

// // // //     console.log("Initializing GCodePreview with dimensions:", canvas.width, "x", canvas.height);

// // // //     try {
// // // //       const instance = GCodePreview.init({
// // // //         canvas: canvas,
// // // //         extrusionColor: extrusionColor,
// // // //         travelColor: "#333333",
// // // //         buildVolume: buildVolume,
// // // //         backgroundColor: backgroundColor,
// // // //         allowDragNDrop: false,
// // // //         // Optimized settings for faster rendering
// // // //         lineWidth: 1.5,
// // // //         renderTravels: false, // Disable travels for faster rendering
// // // //         renderExtrusion: true,
// // // //         startLayer: 0,
// // // //         endLayer: Infinity,
// // // //         topLayerColor: "#FFFFFF",
// // // //         lastSegmentColor: "#00FF00",
// // // //         renderAxes: true,
// // // //         axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
// // // //         renderBuildVolume: true,
// // // //         // Optimize quality settings
// // // //         quality: {
// // // //           // Reduce geometry complexity for faster loading
// // // //           arcSegments: 8, // Lower = faster (default is usually 16)
// // // //           extrusionSegments: 8
// // // //         },
// // // //         onProgress: (p) => {
// // // //           setLoadProgress(Math.round(p * 100));
// // // //           setIsLoading(p < 1);
// // // //           onProgress && onProgress(p);
// // // //         },
// // // //         onFinishLoading: (info) => {
// // // //           setIsLoading(false);
// // // //           setLoadProgress(100);
// // // //           console.log("Finished loading G-code:", info);
// // // //           onFinishLoading && onFinishLoading(info);
// // // //         },
// // // //         onError: (err) => {
// // // //           setIsLoading(false);
// // // //           console.error("Preview error:", err);
// // // //           onError && onError(err);
// // // //         },
// // // //       });
      
// // // //       setPreview(instance);
// // // //     } catch (err) {
// // // //       console.error("Error initializing GCodePreview:", err);
// // // //       if (onError) onError(err);
// // // //     }

// // // //     // Handle window resize with debouncing
// // // //     let resizeTimeout;
// // // //     const handleResize = () => {
// // // //       clearTimeout(resizeTimeout);
// // // //       resizeTimeout = setTimeout(() => {
// // // //         if (canvasRef.current && containerRef.current) {
// // // //           const rect = containerRef.current.getBoundingClientRect();
// // // //           canvasRef.current.width = rect.width;
// // // //           canvasRef.current.height = rect.height;
          
// // // //           // Re-render only if we have gcode
// // // //           if (preview && gcode) {
// // // //             try {
// // // //               preview.resize();
// // // //             } catch (e) {
// // // //               console.error("Error resizing:", e);
// // // //             }
// // // //           }
// // // //         }
// // // //       }, 250); // Debounce resize
// // // //     };

// // // //     window.addEventListener("resize", handleResize);

// // // //     return () => {
// // // //       window.removeEventListener("resize", handleResize);
// // // //       clearTimeout(resizeTimeout);
// // // //       if (processingTimeoutRef.current) {
// // // //         clearTimeout(processingTimeoutRef.current);
// // // //       }
// // // //       if (preview && preview.clear) {
// // // //         try {
// // // //           preview.clear();
// // // //         } catch (e) {
// // // //           console.error("Error disposing preview:", e);
// // // //         }
// // // //       }
// // // //     };
// // // //   }, []);

// // // //   // Process gcode when it changes
// // // //   useEffect(() => {
// // // //     if (!preview || !gcode) return;

// // // //     setIsLoading(true);
// // // //     setLoadProgress(0);

// // // //     // Clear any existing timeout
// // // //     if (processingTimeoutRef.current) {
// // // //       clearTimeout(processingTimeoutRef.current);
// // // //     }

// // // //     // Optimize GCode first
// // // //     console.log("Original G-code length:", gcode.length);
// // // //     const optimizedGCode = optimizeGCode(gcode);
// // // //     console.log("Optimized G-code length:", optimizedGCode.length);
// // // //     console.log("Reduction:", ((1 - optimizedGCode.length / gcode.length) * 100).toFixed(1) + "%");
    
// // // //     // Process with a slight delay to allow UI to update
// // // //     processingTimeoutRef.current = setTimeout(() => {
// // // //       try {
// // // //         preview.clear();
// // // //         preview.processGCode(optimizedGCode);
// // // //       } catch (err) {
// // // //         console.error("Error processing G-code:", err);
// // // //         setIsLoading(false);
// // // //         if (onError) onError(err);
// // // //       }
// // // //     }, 100);

// // // //   }, [preview, gcode, onError]);

// // // //   // Process URL if provided
// // // //   useEffect(() => {
// // // //     if (!preview || !url || gcode) return;

// // // //     setIsLoading(true);
// // // //     setLoadProgress(0);
    
// // // //     fetch(url)
// // // //       .then((res) => res.text())
// // // //       .then((data) => {
// // // //         const optimizedGCode = optimizeGCode(data);
// // // //         preview.clear();
// // // //         preview.processGCode(optimizedGCode);
// // // //       })
// // // //       .catch((err) => {
// // // //         console.error("Failed to fetch G-code:", err);
// // // //         setIsLoading(false);
// // // //         if (onError) onError(err);
// // // //       });
// // // //   }, [preview, url, gcode, onError]);

// // // //   return (
// // // //     <div className="gcode-container" ref={containerRef}>
// // // //       <canvas ref={canvasRef} className="gcode-canvas" />
// // // // {/*       
// // // //       {isLoading && (
// // // //         <div className="loading-overlay">
// // // //           <div className="loading-content">
// // // //             <div className="loading-spinner"></div>
// // // //             <div className="loading-text">Processing G-Code</div>
// // // //             <div className="loading-percentage">{loadProgress}%</div>
// // // //             <div className="loading-bar">
// // // //               <div 
// // // //                 className="loading-bar-fill" 
// // // //                 style={{ width: `${loadProgress}%` }}
// // // //               ></div>
// // // //             </div>
// // // //             <div className="loading-tip">
// // // //               {loadProgress < 30 && "Parsing G-Code commands..."}
// // // //               {loadProgress >= 30 && loadProgress < 60 && "Building 3D geometry..."}
// // // //               {loadProgress >= 60 && loadProgress < 90 && "Rendering visualization..."}
// // // //               {loadProgress >= 90 && "Almost done..."}
// // // //             </div>
// // // //           </div>
// // // //         </div>
// // // //       )} */}
// // // //     </div>
// // // //   );
// // // // };

// // // // export default GCodeViewer;

// // // import React, { useEffect, useRef, useState } from "react";
// // // import * as GCodePreview from "gcode-preview";
// // // import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Layers, Eye } from "lucide-react";

// // // const GCodeViewer = ({
// // //   gcode,
// // //   url,
// // //   buildVolume = { x: 200, y: 200, z: 200 },
// // //   backgroundColor = "#0a0a0a",
// // //   onProgress,
// // //   onFinishLoading,
// // //   onError,
// // // }) => {
// // //   const canvasRef = useRef(null);
// // //   const containerRef = useRef(null);
// // //   const [preview, setPreview] = useState(null);
// // //   const [loadProgress, setLoadProgress] = useState(0);
// // //   const [isLoading, setIsLoading] = useState(false);
// // //   const processingTimeoutRef = useRef(null);
  
// // //   // Animation controls
// // //   const [viewMode, setViewMode] = useState('full'); // 'full' or 'animated'
// // //   const [currentLayer, setCurrentLayer] = useState(0);
// // //   const [maxLayers, setMaxLayers] = useState(0);
// // //   const [isAnimating, setIsAnimating] = useState(false);
// // //   const animationRef = useRef(null);

// // //   // Metallic color palette
// // //   const metallicColors = [
// // //     "#C0C0C0", // Silver
// // //     "#B87333", // Copper
// // //     "#FFD700", // Gold
// // //     "#E5E4E2", // Platinum
// // //     "#71797E", // Steel Gray
// // //     "#AAA9AD", // Aluminum
// // //     "#8C92AC", // Blue Steel
// // //     "#BCC6CC"  // Titanium
// // //   ];

// // //   const optimizeGCode = (gcodeText) => {
// // //     if (!gcodeText) return "";
    
// // //     const lines = gcodeText.split('\n');
// // //     const optimized = lines
// // //       .map(line => line.trim())
// // //       .filter(line => {
// // //         if (!line) return false;
// // //         if (line.startsWith(';')) return false;
// // //         if (line.startsWith('(') && line.endsWith(')')) return false;
// // //         return true;
// // //       })
// // //       .map(line => {
// // //         const semicolonIndex = line.indexOf(';');
// // //         if (semicolonIndex !== -1) {
// // //           return line.substring(0, semicolonIndex).trim();
// // //         }
// // //         const parenIndex = line.indexOf('(');
// // //         if (parenIndex !== -1) {
// // //           return line.substring(0, parenIndex).trim();
// // //         }
// // //         return line;
// // //       })
// // //       .filter(line => line.length > 0);

// // //     return optimized.join('\n');
// // //   };

// // //   // Initialize canvas and preview
// // //   useEffect(() => {
// // //     if (!canvasRef.current || !containerRef.current) return;

// // //     const container = containerRef.current;
// // //     const canvas = canvasRef.current;
    
// // //     const rect = container.getBoundingClientRect();
// // //     canvas.width = rect.width;
// // //     canvas.height = rect.height;

// // //     try {
// // //       const instance = GCodePreview.init({
// // //         canvas: canvas,
// // //         extrusionColor: metallicColors,
// // //         travelColor: "#404040",
// // //         buildVolume: buildVolume,
// // //         backgroundColor: backgroundColor,
// // //         allowDragNDrop: false,
// // //         lineWidth: 2,
// // //         renderTravels: true,
// // //         renderExtrusion: true,
// // //         startLayer: 0,
// // //         endLayer: Infinity,
// // //         topLayerColor: "#FFFFFF",
// // //         lastSegmentColor: "#FFD700",
// // //         renderAxes: true,
// // //         axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
// // //         renderBuildVolume: true,
// // //         onProgress: (p) => {
// // //           setLoadProgress(Math.round(p * 100));
// // //           setIsLoading(p < 1);
// // //           onProgress && onProgress(p);
// // //         },
// // //         onFinishLoading: (info) => {
// // //           setIsLoading(false);
// // //           setLoadProgress(100);
// // //           console.log("Finished loading G-code:", info);
          
// // //           // Get layer count if available
// // //           if (info && info.layerCount) {
// // //             setMaxLayers(info.layerCount);
// // //           }
          
// // //           onFinishLoading && onFinishLoading(info);
// // //         },
// // //         onError: (err) => {
// // //           setIsLoading(false);
// // //           console.error("Preview error:", err);
// // //           onError && onError(err);
// // //         },
// // //       });
      
// // //       setPreview(instance);
// // //     } catch (err) {
// // //       console.error("Error initializing GCodePreview:", err);
// // //       if (onError) onError(err);
// // //     }

// // //     let resizeTimeout;
// // //     const handleResize = () => {
// // //       clearTimeout(resizeTimeout);
// // //       resizeTimeout = setTimeout(() => {
// // //         if (canvasRef.current && containerRef.current) {
// // //           const rect = containerRef.current.getBoundingClientRect();
// // //           canvasRef.current.width = rect.width;
// // //           canvasRef.current.height = rect.height;
          
// // //           if (preview && gcode) {
// // //             try {
// // //               preview.resize();
// // //             } catch (e) {
// // //               console.error("Error resizing:", e);
// // //             }
// // //           }
// // //         }
// // //       }, 250);
// // //     };

// // //     window.addEventListener("resize", handleResize);

// // //     return () => {
// // //       window.removeEventListener("resize", handleResize);
// // //       clearTimeout(resizeTimeout);
// // //       if (processingTimeoutRef.current) {
// // //         clearTimeout(processingTimeoutRef.current);
// // //       }
// // //       if (animationRef.current) {
// // //         cancelAnimationFrame(animationRef.current);
// // //       }
// // //       if (preview && preview.clear) {
// // //         try {
// // //           preview.clear();
// // //         } catch (e) {
// // //           console.error("Error disposing preview:", e);
// // //         }
// // //       }
// // //     };
// // //   }, []);

// // //   // Process gcode when it changes
// // //   useEffect(() => {
// // //     if (!preview || !gcode) return;

// // //     setIsLoading(true);
// // //     setLoadProgress(0);
// // //     setCurrentLayer(0);
// // //     setIsAnimating(false);

// // //     if (processingTimeoutRef.current) {
// // //       clearTimeout(processingTimeoutRef.current);
// // //     }

// // //     const optimizedGCode = optimizeGCode(gcode);
    
// // //     // Increase timeout for larger files
// // //     const processingDelay = optimizedGCode.length > 100000 ? 500 : 100;
    
// // //     processingTimeoutRef.current = setTimeout(() => {
// // //       try {
// // //         preview.clear();
// // //         preview.processGCode(optimizedGCode);
// // //       } catch (err) {
// // //         console.error("Error processing G-code:", err);
// // //         setIsLoading(false);
// // //         if (onError) onError(err);
// // //       }
// // //     }, processingDelay);

// // //   }, [preview, gcode, onError]);

// // //   // Process URL if provided
// // //   useEffect(() => {
// // //     if (!preview || !url || gcode) return;

// // //     setIsLoading(true);
// // //     setLoadProgress(0);
    
// // //     fetch(url)
// // //       .then((res) => res.text())
// // //       .then((data) => {
// // //         const optimizedGCode = optimizeGCode(data);
// // //         preview.clear();
// // //         preview.processGCode(optimizedGCode);
// // //       })
// // //       .catch((err) => {
// // //         console.error("Failed to fetch G-code:", err);
// // //         setIsLoading(false);
// // //         if (onError) onError(err);
// // //       });
// // //   }, [preview, url, gcode, onError]);

// // //   // Handle layer animation
// // //   useEffect(() => {
// // //     if (!preview || !isAnimating || viewMode !== 'animated') return;

// // //     const animate = () => {
// // //       setCurrentLayer(prev => {
// // //         const next = prev + 1;
// // //         if (next >= maxLayers) {
// // //           setIsAnimating(false);
// // //           return maxLayers;
// // //         }
        
// // //         try {
// // //           preview.updateSettings({ endLayer: next });
// // //         } catch (e) {
// // //           console.error("Error updating layer:", e);
// // //         }
        
// // //         return next;
// // //       });

// // //       animationRef.current = setTimeout(() => {
// // //         requestAnimationFrame(animate);
// // //       }, 50); // Animation speed
// // //     };

// // //     animate();

// // //     return () => {
// // //       if (animationRef.current) {
// // //         clearTimeout(animationRef.current);
// // //       }
// // //     };
// // //   }, [isAnimating, preview, maxLayers, viewMode]);

// // //   // Reset camera view
// // //   const handleReset = () => {
// // //     if (preview && preview.camera) {
// // //       try {
// // //         preview.camera.position.set(
// // //           buildVolume.x * 1.5,
// // //           buildVolume.y * 1.5,
// // //           buildVolume.z * 1.5
// // //         );
// // //         preview.camera.lookAt(
// // //           buildVolume.x / 2,
// // //           buildVolume.y / 2,
// // //           buildVolume.z / 2
// // //         );
// // //         preview.render();
// // //       } catch (e) {
// // //         console.error("Error resetting camera:", e);
// // //       }
// // //     }
// // //   };

// // //   // Toggle view mode
// // //   const toggleViewMode = () => {
// // //     if (!preview) return;
    
// // //     const newMode = viewMode === 'full' ? 'animated' : 'full';
// // //     setViewMode(newMode);
    
// // //     if (newMode === 'full') {
// // //       setIsAnimating(false);
// // //       setCurrentLayer(maxLayers);
// // //       try {
// // //         preview.updateSettings({ endLayer: Infinity });
// // //       } catch (e) {
// // //         console.error("Error updating settings:", e);
// // //       }
// // //     } else {
// // //       setCurrentLayer(0);
// // //       try {
// // //         preview.updateSettings({ endLayer: 0 });
// // //       } catch (e) {
// // //         console.error("Error updating settings:", e);
// // //       }
// // //     }
// // //   };

// // //   // Toggle animation play/pause
// // //   const toggleAnimation = () => {
// // //     if (viewMode !== 'animated') return;
    
// // //     if (currentLayer >= maxLayers) {
// // //       setCurrentLayer(0);
// // //       if (preview) {
// // //         try {
// // //           preview.updateSettings({ endLayer: 0 });
// // //         } catch (e) {
// // //           console.error("Error updating settings:", e);
// // //         }
// // //       }
// // //     }
    
// // //     setIsAnimating(!isAnimating);
// // //   };

// // //   // Handle layer slider change
// // //   const handleLayerChange = (e) => {
// // //     const layer = parseInt(e.target.value);
// // //     setCurrentLayer(layer);
// // //     setIsAnimating(false);
    
// // //     if (preview) {
// // //       try {
// // //         preview.updateSettings({ endLayer: layer });
// // //       } catch (e) {
// // //         console.error("Error updating layer:", e);
// // //       }
// // //     }
// // //   };

// // //   return (
// // //     <div style={{ width: '100%', height: '600px', position: 'relative', backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden' }}>
// // //       <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
// // //         <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
// // //       </div>
      
// // //       {/* Control Panel */}
// // //       <div style={{
// // //         position: 'absolute',
// // //         top: '16px',
// // //         right: '16px',
// // //         display: 'flex',
// // //         flexDirection: 'column',
// // //         gap: '8px',
// // //         zIndex: 10
// // //       }}>
// // //         <button
// // //           onClick={handleReset}
// // //           style={{
// // //             padding: '10px',
// // //             backgroundColor: 'rgba(255, 255, 255, 0.1)',
// // //             border: '1px solid rgba(255, 255, 255, 0.2)',
// // //             borderRadius: '6px',
// // //             color: 'white',
// // //             cursor: 'pointer',
// // //             display: 'flex',
// // //             alignItems: 'center',
// // //             gap: '6px',
// // //             backdropFilter: 'blur(10px)'
// // //           }}
// // //           title="Reset View"
// // //         >
// // //           <RotateCcw size={18} />
// // //           Reset
// // //         </button>

// // //         <button
// // //           onClick={toggleViewMode}
// // //           style={{
// // //             padding: '10px',
// // //             backgroundColor: viewMode === 'animated' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
// // //             border: '1px solid rgba(255, 255, 255, 0.2)',
// // //             borderRadius: '6px',
// // //             color: 'white',
// // //             cursor: 'pointer',
// // //             display: 'flex',
// // //             alignItems: 'center',
// // //             gap: '6px',
// // //             backdropFilter: 'blur(10px)'
// // //           }}
// // //           title="Toggle View Mode"
// // //         >
// // //           {viewMode === 'full' ? <Layers size={18} /> : <Eye size={18} />}
// // //           {viewMode === 'full' ? 'Animate' : 'Full'}
// // //         </button>
// // //       </div>

// // //       {/* Animation Controls */}
// // //       {viewMode === 'animated' && maxLayers > 0 && (
// // //         <div style={{
// // //           position: 'absolute',
// // //           bottom: '16px',
// // //           left: '50%',
// // //           transform: 'translateX(-50%)',
// // //           backgroundColor: 'rgba(0, 0, 0, 0.8)',
// // //           border: '1px solid rgba(255, 255, 255, 0.2)',
// // //           borderRadius: '12px',
// // //           padding: '16px 24px',
// // //           backdropFilter: 'blur(10px)',
// // //           minWidth: '400px',
// // //           zIndex: 10
// // //         }}>
// // //           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
// // //             <button
// // //               onClick={toggleAnimation}
// // //               style={{
// // //                 padding: '8px',
// // //                 backgroundColor: 'rgba(255, 215, 0, 0.2)',
// // //                 border: '1px solid rgba(255, 215, 0, 0.4)',
// // //                 borderRadius: '6px',
// // //                 color: '#FFD700',
// // //                 cursor: 'pointer',
// // //                 display: 'flex',
// // //                 alignItems: 'center',
// // //                 justifyContent: 'center'
// // //               }}
// // //               title={isAnimating ? 'Pause' : 'Play'}
// // //             >
// // //               {isAnimating ? <Pause size={20} /> : <Play size={20} />}
// // //             </button>

// // //             <div style={{ flex: 1 }}>
// // //               <input
// // //                 type="range"
// // //                 min="0"
// // //                 max={maxLayers}
// // //                 value={currentLayer}
// // //                 onChange={handleLayerChange}
// // //                 style={{
// // //                   width: '100%',
// // //                   height: '6px',
// // //                   borderRadius: '3px',
// // //                   outline: 'none',
// // //                   background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${(currentLayer / maxLayers) * 100}%, rgba(255,255,255,0.2) ${(currentLayer / maxLayers) * 100}%, rgba(255,255,255,0.2) 100%)`
// // //                 }}
// // //               />
// // //               <div style={{
// // //                 display: 'flex',
// // //                 justifyContent: 'space-between',
// // //                 marginTop: '8px',
// // //                 color: 'rgba(255, 255, 255, 0.8)',
// // //                 fontSize: '12px'
// // //               }}>
// // //                 <span>Layer: {currentLayer}</span>
// // //                 <span>Total: {maxLayers}</span>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Loading Overlay */}
// // //       {/* {isLoading && (
// // //         <div style={{
// // //           position: 'absolute',
// // //           top: 0,
// // //           left: 0,
// // //           right: 0,
// // //           bottom: 0,
// // //           backgroundColor: 'rgba(0, 0, 0, 0.8)',
// // //           display: 'flex',
// // //           alignItems: 'center',
// // //           justifyContent: 'center',
// // //           zIndex: 20
// // //         }}>
// // //           <div style={{ textAlign: 'center', color: 'white' }}>
// // //             <div style={{
// // //               width: '60px',
// // //               height: '60px',
// // //               border: '4px solid rgba(255, 215, 0, 0.2)',
// // //               borderTop: '4px solid #FFD700',
// // //               borderRadius: '50%',
// // //               animation: 'spin 1s linear infinite',
// // //               margin: '0 auto 16px'
// // //             }}></div>
// // //             <div style={{ fontSize: '18px', marginBottom: '8px' }}>Processing G-Code</div>
// // //             <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>{loadProgress}%</div>
// // //             <div style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>
// // //               {loadProgress < 30 && "Parsing commands..."}
// // //               {loadProgress >= 30 && loadProgress < 60 && "Building geometry..."}
// // //               {loadProgress >= 60 && loadProgress < 90 && "Rendering..."}
// // //               {loadProgress >= 90 && "Finalizing..."}
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )} */}

// // //       <style>{`
// // //         @keyframes spin {
// // //           0% { transform: rotate(0deg); }
// // //           100% { transform: rotate(360deg); }
// // //         }
        
// // //         input[type="range"] {
// // //           -webkit-appearance: none;
// // //           appearance: none;
// // //           cursor: pointer;
// // //         }
        
// // //         input[type="range"]::-webkit-slider-thumb {
// // //           -webkit-appearance: none;
// // //           appearance: none;
// // //           width: 16px;
// // //           height: 16px;
// // //           border-radius: 50%;
// // //           background: #FFD700;
// // //           cursor: pointer;
// // //           box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
// // //         }
        
// // //         input[type="range"]::-moz-range-thumb {
// // //           width: 16px;
// // //           height: 16px;
// // //           border-radius: 50%;
// // //           background: #FFD700;
// // //           cursor: pointer;
// // //           border: none;
// // //           box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
// // //         }
// // //       `}</style>
// // //     </div>
// // //   );
// // // };

// // // export default GCodeViewer;

// // import React, { useEffect, useRef, useState } from "react";
// // import * as GCodePreview from "gcode-preview";
// // import { Play, Pause, RotateCcw, ChevronRight, ChevronDown, FileText } from "lucide-react";

// // const GCodeViewer = ({
// //   gcode,
// //   url,
// //   buildVolume = { x: 200, y: 200, z: 200 },
// //   backgroundColor = "#0a0a0a",
// //   onProgress,
// //   onFinishLoading,
// //   onError,
// // }) => {
// //   const canvasRef = useRef(null);
// //   const containerRef = useRef(null);
// //   const [preview, setPreview] = useState(null);
// //   const [loadProgress, setLoadProgress] = useState(0);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const processingTimeoutRef = useRef(null);
  
// //   // G-code lines
// //   const [gcodeLines, setGcodeLines] = useState([]);
// //   const [currentLine, setCurrentLine] = useState(0);
// //   const [isAnimating, setIsAnimating] = useState(false);
// //   const [viewMode, setViewMode] = useState('full'); // 'full' or 'line'
// //   const [showSidebar, setShowSidebar] = useState(true);
// //   const animationRef = useRef(null);
  


// //   // Metallic color palette
// //   const metallicColors = [
// //     "#C0C0C0", "#B87333", "#FFD700", "#E5E4E2",
// //     "#71797E", "#AAA9AD", "#8C92AC", "#BCC6CC"
// //   ];

// //   const optimizeGCode = (gcodeText) => {
// //     if (!gcodeText) return "";
    
// //     const lines = gcodeText.split('\n');
// //     const optimized = lines
// //       .map(line => line.trim())
// //       .filter(line => {
// //         if (!line) return false;
// //         if (line.startsWith(';')) return false;
// //         if (line.startsWith('(') && line.endsWith(')')) return false;
// //         return true;
// //       })
// //       .map(line => {
// //         const semicolonIndex = line.indexOf(';');
// //         if (semicolonIndex !== -1) {
// //           return line.substring(0, semicolonIndex).trim();
// //         }
// //         const parenIndex = line.indexOf('(');
// //         if (parenIndex !== -1) {
// //           return line.substring(0, parenIndex).trim();
// //         }
// //         return line;
// //       })
// //       .filter(line => line.length > 0);

// //     return optimized;
// //   };

// //   // Initialize canvas and preview
// //   useEffect(() => {
// //     if (!canvasRef.current || !containerRef.current) return;

// //     const container = containerRef.current;
// //     const canvas = canvasRef.current;
    
// //     const rect = container.getBoundingClientRect();
// //     canvas.width = rect.width;
// //     canvas.height = rect.height;

// //     try {
// //       const instance = GCodePreview.init({
// //         canvas: canvas,
// //         extrusionColor: metallicColors,
// //         travelColor: "#404040",
// //         buildVolume: buildVolume,
// //         backgroundColor: backgroundColor,
// //         allowDragNDrop: false,
// //         lineWidth: 2,
// //         renderTravels: false,
// //         renderExtrusion: true,
// //         startLayer: 0,
// //         endLayer: Infinity,
// //         topLayerColor: "#FFFFFF",
// //         lastSegmentColor: "#FFD700",
// //         renderAxes: true,
// //         axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
// //         renderBuildVolume: true,
// //         onProgress: (p) => {
// //           const progress = Math.round(p * 100);
// //           setLoadProgress(progress);
// //           setIsLoading(p < 1);
// //           onProgress && onProgress(p);
// //         },
// //         onFinishLoading: (info) => {
// //           setIsLoading(false);
// //           setLoadProgress(100);
// //           console.log("Finished loading G-code:", info);
// //           onFinishLoading && onFinishLoading(info);
// //         },
// //         onError: (err) => {
// //           setIsLoading(false);
// //           console.error("Preview error:", err);
// //           onError && onError(err);
// //         },
// //       });
      
// //       setPreview(instance);
// //     } catch (err) {
// //       console.error("Error initializing GCodePreview:", err);
// //       if (onError) onError(err);
// //     }

// //     let resizeTimeout;
// //     const handleResize = () => {
// //       clearTimeout(resizeTimeout);
// //       resizeTimeout = setTimeout(() => {
// //         if (canvasRef.current && containerRef.current) {
// //           const rect = containerRef.current.getBoundingClientRect();
// //           canvasRef.current.width = rect.width;
// //           canvasRef.current.height = rect.height;
          
// //           if (preview && gcode) {
// //             try {
// //               preview.resize();
// //             } catch (e) {
// //               console.error("Error resizing:", e);
// //             }
// //           }
// //         }
// //       }, 250);
// //     };

// //     window.addEventListener("resize", handleResize);

// //     return () => {
// //       window.removeEventListener("resize", handleResize);
// //       clearTimeout(resizeTimeout);
// //       if (processingTimeoutRef.current) {
// //         clearTimeout(processingTimeoutRef.current);
// //       }
// //       if (animationRef.current) {
// //         cancelAnimationFrame(animationRef.current);
// //       }
// //       if (preview && preview.clear) {
// //         try {
// //           preview.clear();
// //         } catch (e) {
// //           console.error("Error disposing preview:", e);
// //         }
// //       }
// //     };
// //   }, []);

// //   // Process gcode when it changes
// //   useEffect(() => {
// //     if (!preview || !gcode) return;

// //     setIsLoading(true);
// //     setLoadProgress(0);
// //     setCurrentLine(0);
// //     setIsAnimating(false);

// //     if (processingTimeoutRef.current) {
// //       clearTimeout(processingTimeoutRef.current);
// //     }

// //     const optimizedLines = optimizeGCode(gcode);
// //     setGcodeLines(optimizedLines);
    
// //     processingTimeoutRef.current = setTimeout(() => {
// //       try {
// //         preview.clear();
// //         preview.processGCode(optimizedLines.join('\n'));
// //       } catch (err) {
// //         console.error("Error processing G-code:", err);
// //         setIsLoading(false);
// //         if (onError) onError(err);
// //       }
// //     }, 200);

// //   }, [preview, gcode, onError]);

// //   // Handle line-by-line animation
// //   useEffect(() => {
// //     if (!preview || !isAnimating || viewMode !== 'line' || gcodeLines.length === 0) return;

// //     const animate = () => {
// //       setCurrentLine(prev => {
// //         const next = prev + 1;
        
// //         if (next >= gcodeLines.length) {
// //           setIsAnimating(false);
// //           return gcodeLines.length - 1;
// //         }
        
// //         try {
// //           // Process up to current line
// //           const partialGcode = gcodeLines.slice(0, next + 1).join('\n');
// //           preview.clear();
// //           preview.processGCode(partialGcode);
// //         } catch (e) {
// //           console.error("Error updating line:", e);
// //         }
        
// //         return next;
// //       });

// //       animationRef.current = setTimeout(() => {
// //         requestAnimationFrame(animate);
// //       }, 20); // Speed of animation
// //     };

// //     animate();

// //     return () => {
// //       if (animationRef.current) {
// //         clearTimeout(animationRef.current);
// //       }
// //     };
// //   }, [isAnimating, preview, gcodeLines, viewMode]);

// //   // Reset camera view
// //   const handleReset = () => {
// //     if (preview && preview.camera) {
// //       try {
// //         preview.camera.position.set(
// //           buildVolume.x * 1.5,
// //           buildVolume.y * 1.5,
// //           buildVolume.z * 1.5
// //         );
// //         preview.camera.lookAt(
// //           buildVolume.x / 2,
// //           buildVolume.y / 2,
// //           buildVolume.z / 2
// //         );
// //         preview.render();
// //       } catch (e) {
// //         console.error("Error resetting camera:", e);
// //       }
// //     }
// //   };

// //   // Toggle view mode
// //   const toggleViewMode = () => {
// //     if (!preview || gcodeLines.length === 0) return;
    
// //     const newMode = viewMode === 'full' ? 'line' : 'full';
// //     setViewMode(newMode);
// //     setIsAnimating(false);
    
// //     if (newMode === 'full') {
// //       setCurrentLine(gcodeLines.length - 1);
// //       try {
// //         preview.clear();
// //         preview.processGCode(gcodeLines.join('\n'));
// //       } catch (e) {
// //         console.error("Error updating settings:", e);
// //       }
// //     } else {
// //       setCurrentLine(0);
// //       try {
// //         preview.clear();
// //         preview.processGCode(gcodeLines[0] || '');
// //       } catch (e) {
// //         console.error("Error updating settings:", e);
// //       }
// //     }
// //   };

// //   // Toggle animation
// //   const toggleAnimation = () => {
// //     if (viewMode !== 'line') return;
    
// //     if (currentLine >= gcodeLines.length - 1) {
// //       setCurrentLine(0);
// //       if (preview) {
// //         try {
// //           preview.clear();
// //           preview.processGCode(gcodeLines[0] || '');
// //         } catch (e) {
// //           console.error("Error resetting:", e);
// //         }
// //       }
// //     }
    
// //     setIsAnimating(!isAnimating);
// //   };

// //   // Jump to specific line
// //   const jumpToLine = (lineIndex) => {
// //     if (!preview || lineIndex < 0 || lineIndex >= gcodeLines.length) return;
    
// //     setCurrentLine(lineIndex);
// //     setIsAnimating(false);
    
// //     try {
// //       const partialGcode = gcodeLines.slice(0, lineIndex + 1).join('\n');
// //       preview.clear();
// //       preview.processGCode(partialGcode);
// //     } catch (e) {
// //       console.error("Error jumping to line:", e);
// //     }
// //   };

// //   // Handle line slider
// //   const handleLineChange = (e) => {
// //     const line = parseInt(e.target.value);
// //     jumpToLine(line);
// //   };

// //   return (
// //     <div style={{ display: 'flex', width: '100%', height: '600px', backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
// //       {/* Sidebar with G-code lines */}
// //       {showSidebar && gcodeLines.length > 0 && (
// //         <div style={{
// //           width: '300px',
// //           height: '100%',
// //           backgroundColor: '#1a1a1a',
// //           borderRight: '1px solid rgba(255, 255, 255, 0.1)',
// //           display: 'flex',
// //           flexDirection: 'column',
// //           overflow: 'hidden'
// //         }}>
// //           <div style={{
// //             padding: '12px 16px',
// //             borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
// //             display: 'flex',
// //             alignItems: 'center',
// //             justifyContent: 'space-between',
// //             backgroundColor: '#0a0a0a'
// //           }}>
// //             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
// //               <FileText size={18} />
// //               <span style={{ fontWeight: 'bold' }}>G-Code Lines</span>
// //             </div>
// //             <button
// //               onClick={() => setShowSidebar(false)}
// //               style={{
// //                 background: 'none',
// //                 border: 'none',
// //                 color: 'rgba(255, 255, 255, 0.6)',
// //                 cursor: 'pointer',
// //                 padding: '4px'
// //               }}
// //             >
// //               ✕
// //             </button>
// //           </div>

// //           <div style={{
// //             padding: '12px 16px',
// //             borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
// //             backgroundColor: '#0a0a0a'
// //           }}>
// //             <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}>
// //               Total Lines: {gcodeLines.length}
// //             </div>
// //             {viewMode === 'line' && (
// //               <div style={{ color: '#FFD700', fontSize: '12px' }}>
// //                 Current: Line {currentLine + 1}
// //               </div>
// //             )}
// //           </div>

// //           <div style={{
// //             flex: 1,
// //             overflowY: 'auto',
// //             fontSize: '12px',
// //             fontFamily: 'monospace'
// //           }}>
// //             {gcodeLines.map((line, idx) => (
// //               <div
// //                 key={idx}
// //                 onClick={() => jumpToLine(idx)}
// //                 style={{
// //                   padding: '6px 16px',
// //                   cursor: 'pointer',
// //                   backgroundColor: idx === currentLine ? 'rgba(255, 215, 0, 0.2)' : 
// //                                    idx < currentLine && viewMode === 'line' ? 'rgba(100, 100, 100, 0.1)' : 
// //                                    'transparent',
// //                   borderLeft: idx === currentLine ? '3px solid #FFD700' : '3px solid transparent',
// //                   color: idx === currentLine ? '#FFD700' : 
// //                          idx < currentLine && viewMode === 'line' ? 'rgba(255, 255, 255, 0.5)' : 
// //                          'rgba(255, 255, 255, 0.8)',
// //                   transition: 'all 0.2s',
// //                   display: 'flex',
// //                   alignItems: 'center',
// //                   gap: '8px',
// //                   userSelect: 'none'
// //                 }}
// //                 onMouseEnter={(e) => {
// //                   if (idx !== currentLine) {
// //                     e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
// //                   }
// //                 }}
// //                 onMouseLeave={(e) => {
// //                   if (idx !== currentLine) {
// //                     e.currentTarget.style.backgroundColor = idx < currentLine && viewMode === 'line' ? 
// //                       'rgba(100, 100, 100, 0.1)' : 'transparent';
// //                   }
// //                 }}
// //               >
// //                 <span style={{ opacity: 0.5, minWidth: '40px', userSelect: 'none' }}>{idx + 1}</span>
// //                 <span style={{ 
// //                   flex: 1, 
// //                   overflow: 'hidden', 
// //                   textOverflow: 'ellipsis', 
// //                   whiteSpace: 'nowrap',
// //                   userSelect: 'none'
// //                 }}>
// //                   {line}
// //                 </span>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       )}

// //       {/* Main viewer area */}
// //       <div style={{ flex: 1, position: 'relative' }}>
// //         <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
// //           <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
// //         </div>

// //         {/* Show sidebar button when hidden */}
// //         {!showSidebar && gcodeLines.length > 0 && (
// //           <button
// //             onClick={() => setShowSidebar(true)}
// //             style={{
// //               position: 'absolute',
// //               top: '16px',
// //               left: '16px',
// //               padding: '10px',
// //               backgroundColor: 'rgba(255, 255, 255, 0.1)',
// //               border: '1px solid rgba(255, 255, 255, 0.2)',
// //               borderRadius: '6px',
// //               color: 'white',
// //               cursor: 'pointer',
// //               display: 'flex',
// //               alignItems: 'center',
// //               gap: '6px',
// //               backdropFilter: 'blur(10px)',
// //               zIndex: 10
// //             }}
// //           >
// //             <ChevronRight size={18} />
// //             Lines
// //           </button>
// //         )}

// //         {/* Control Panel */}
// //         <div style={{
// //           position: 'absolute',
// //           top: '16px',
// //           right: '16px',
// //           display: 'flex',
// //           flexDirection: 'column',
// //           gap: '8px',
// //           zIndex: 10
// //         }}>
// //           <button
// //             onClick={handleReset}
// //             style={{
// //               padding: '10px',
// //               backgroundColor: 'rgba(255, 255, 255, 0.1)',
// //               border: '1px solid rgba(255, 255, 255, 0.2)',
// //               borderRadius: '6px',
// //               color: 'white',
// //               cursor: 'pointer',
// //               display: 'flex',
// //               alignItems: 'center',
// //               gap: '6px',
// //               backdropFilter: 'blur(10px)'
// //             }}
// //             title="Reset View"
// //           >
// //             <RotateCcw size={18} />
// //             Reset
// //           </button>

// //           <button
// //             onClick={toggleViewMode}
// //             disabled={gcodeLines.length === 0}
// //             style={{
// //               padding: '10px',
// //               backgroundColor: viewMode === 'line' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
// //               border: '1px solid rgba(255, 255, 255, 0.2)',
// //               borderRadius: '6px',
// //               color: 'white',
// //               cursor: gcodeLines.length === 0 ? 'not-allowed' : 'pointer',
// //               display: 'flex',
// //               alignItems: 'center',
// //               gap: '6px',
// //               backdropFilter: 'blur(10px)',
// //               opacity: gcodeLines.length === 0 ? 0.5 : 1
// //             }}
// //             title="Toggle View Mode"
// //           >
// //             {viewMode === 'full' ? '📝' : '🔍'}
// //             {viewMode === 'full' ? 'Animate' : 'Full'}
// //           </button>
// //         </div>

// //         {/* Animation Controls */}
// //         {viewMode === 'line' && gcodeLines.length > 0 && (
// //           <div style={{
// //             position: 'absolute',
// //             bottom: '16px',
// //             left: '50%',
// //             transform: 'translateX(-50%)',
// //             backgroundColor: 'rgba(0, 0, 0, 0.8)',
// //             border: '1px solid rgba(255, 255, 255, 0.2)',
// //             borderRadius: '12px',
// //             padding: '16px 24px',
// //             backdropFilter: 'blur(10px)',
// //             minWidth: '400px',
// //             zIndex: 10
// //           }}>
// //             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
// //               <button
// //                 onClick={toggleAnimation}
// //                 style={{
// //                   padding: '8px',
// //                   backgroundColor: 'rgba(255, 215, 0, 0.2)',
// //                   border: '1px solid rgba(255, 215, 0, 0.4)',
// //                   borderRadius: '6px',
// //                   color: '#FFD700',
// //                   cursor: 'pointer',
// //                   display: 'flex',
// //                   alignItems: 'center',
// //                   justifyContent: 'center'
// //                 }}
// //                 title={isAnimating ? 'Pause' : 'Play'}
// //               >
// //                 {isAnimating ? <Pause size={20} /> : <Play size={20} />}
// //               </button>

// //               <div style={{ flex: 1 }}>
// //                 <input
// //                   type="range"
// //                   min="0"
// //                   max={gcodeLines.length - 1}
// //                   value={currentLine}
// //                   onChange={handleLineChange}
// //                   style={{
// //                     width: '100%',
// //                     height: '6px',
// //                     borderRadius: '3px',
// //                     outline: 'none',
// //                     background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
// //                   }}
// //                 />
// //                 <div style={{
// //                   display: 'flex',
// //                   justifyContent: 'space-between',
// //                   marginTop: '8px',
// //                   color: 'rgba(255, 255, 255, 0.8)',
// //                   fontSize: '12px'
// //                 }}>
// //                   <span>Line: {currentLine + 1}</span>
// //                   <span>Total: {gcodeLines.length}</span>
// //                   <span>{((currentLine / gcodeLines.length) * 100).toFixed(1)}%</span>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         )}

// //         {/* Loading Overlay
// //         {isLoading && (
// //           <div style={{
// //             position: 'absolute',
// //             top: 0,
// //             left: 0,
// //             right: 0,
// //             bottom: 0,
// //             backgroundColor: 'rgba(0, 0, 0, 0.9)',
// //             display: 'flex',
// //             alignItems: 'center',
// //             justifyContent: 'center',
// //             zIndex: 20
// //           }}>
// //             <div style={{ textAlign: 'center', color: 'white' }}>
// //               <div style={{
// //                 width: '60px',
// //                 height: '60px',
// //                 border: '4px solid rgba(255, 215, 0, 0.2)',
// //                 borderTop: '4px solid #FFD700',
// //                 borderRadius: '50%',
// //                 animation: 'spin 1s linear infinite',
// //                 margin: '0 auto 16px'
// //               }}></div>
// //               <div style={{ fontSize: '18px', marginBottom: '8px' }}>Processing G-Code</div>
// //               <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700', marginBottom: '8px' }}>
// //                 {loadProgress}%
// //               </div>
// //               <div style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>
// //                 {loadProgress < 30 && "Parsing commands..."}
// //                 {loadProgress >= 30 && loadProgress < 60 && "Building geometry..."}
// //                 {loadProgress >= 60 && loadProgress < 90 && "Rendering..."}
// //                 {loadProgress >= 90 && "Finalizing..."}
// //               </div>
// //             </div>
// //           </div>
// //         )} */}
// //       </div>

// //       <style>{`
// //         @keyframes spin {
// //           0% { transform: rotate(0deg); }
// //           100% { transform: rotate(360deg); }
// //         }
        
// //         input[type="range"] {
// //           -webkit-appearance: none;
// //           appearance: none;
// //           cursor: pointer;
// //         }
        
// //         input[type="range"]::-webkit-slider-thumb {
// //           -webkit-appearance: none;
// //           appearance: none;
// //           width: 16px;
// //           height: 16px;
// //           border-radius: 50%;
// //           background: #FFD700;
// //           cursor: pointer;
// //           box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
// //         }
        
// //         input[type="range"]::-moz-range-thumb {
// //           width: 16px;
// //           height: 16px;
// //           border-radius: 50%;
// //           background: #FFD700;
// //           cursor: pointer;
// //           border: none;
// //           box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
// //         }

// //         /* Scrollbar styling for sidebar */
// //         div::-webkit-scrollbar {
// //           width: 8px;
// //         }
        
// //         div::-webkit-scrollbar-track {
// //           background: rgba(255, 255, 255, 0.05);
// //         }
        
// //         div::-webkit-scrollbar-thumb {
// //           background: rgba(255, 215, 0, 0.3);
// //           border-radius: 4px;
// //         }
        
// //         div::-webkit-scrollbar-thumb:hover {
// //           background: rgba(255, 215, 0, 0.5);
// //         }
// //       `}</style>
// //     </div>
// //   );
// // };

// // export default GCodeViewer;


// import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
// import * as GCodePreview from "gcode-preview";
// import { Play, Pause, RotateCcw, ChevronRight, FileText } from "lucide-react";

// const GCodeViewer = ({
//   gcode,
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
  
//   const [gcodeLines, setGcodeLines] = useState([]);
//   const [currentLine, setCurrentLine] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [viewMode, setViewMode] = useState('full');
//   const [showSidebar, setShowSidebar] = useState(true);
//   const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
//   const animationRef = useRef(null);
//   const lastUpdateRef = useRef(0);

//   const metallicColors = [
//     "#C0C0C0", "#B87333", "#FFD700", "#E5E4E2",
//     "#71797E", "#AAA9AD", "#8C92AC", "#BCC6CC"
//   ];

//   // Optimized G-code processing with memoization
//   const optimizeGCode = useCallback((gcodeText) => {
//     if (!gcodeText) return [];
    
//     const lines = gcodeText.split('\n');
//     const optimized = [];
    
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i].trim();
      
//       if (!line || line.startsWith(';') || (line.startsWith('(') && line.endsWith(')'))) {
//         continue;
//       }
      
//       const semicolonIndex = line.indexOf(';');
//       const cleanLine = semicolonIndex !== -1 ? line.substring(0, semicolonIndex).trim() : line;
      
//       if (cleanLine.length > 0) {
//         optimized.push(cleanLine);
//       }
//     }
    
//     return optimized;
//   }, []);

//   // Virtualized line rendering for large files
//   const virtualizedLines = useMemo(() => {
//     if (gcodeLines.length === 0) return [];
    
//     const { start, end } = visibleRange;
//     return gcodeLines.slice(start, Math.min(end, gcodeLines.length)).map((line, idx) => ({
//       line,
//       actualIndex: start + idx
//     }));
//   }, [gcodeLines, visibleRange]);

//   // Handle scroll for virtualization
//   const handleSidebarScroll = useCallback((e) => {
//     const container = e.target;
//     const scrollTop = container.scrollTop;
//     const itemHeight = 28; // Approximate height of each line
//     const visibleItems = Math.ceil(container.clientHeight / itemHeight);
//     const bufferItems = 20;
    
//     const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferItems);
//     const end = start + visibleItems + (bufferItems * 2);
    
//     setVisibleRange({ start, end });
//   }, []);

//   // Initialize canvas
//   useEffect(() => {
//     if (!canvasRef.current || !containerRef.current) return;

//     const container = containerRef.current;
//     const canvas = canvasRef.current;
    
//     const rect = container.getBoundingClientRect();
//     canvas.width = rect.width;
//     canvas.height = rect.height;

//     try {
//       const instance = GCodePreview.init({
//         canvas: canvas,
//         extrusionColor: metallicColors,
//         travelColor: "#404040",
//         buildVolume: buildVolume,
//         backgroundColor: backgroundColor,
//         allowDragNDrop: false,
//         lineWidth: 2,
//         renderTravels: false,
//         renderExtrusion: true,
//         startLayer: 0,
//         endLayer: Infinity,
//         topLayerColor: "#FFFFFF",
//         lastSegmentColor: "#FFD700",
//         renderAxes: true,
//         axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
//         renderBuildVolume: true,
//         onProgress: (p) => {
//           const progress = Math.round(p * 100);
//           setLoadProgress(progress);
//           setIsLoading(p < 1);
//           onProgress?.(p);
//         },
//         onFinishLoading: (info) => {
//           setIsLoading(false);
//           setLoadProgress(100);
//           onFinishLoading?.(info);
//         },
//         onError: (err) => {
//           setIsLoading(false);
//           console.error("Preview error:", err);
//           onError?.(err);
//         },
//       });
      
//       setPreview(instance);
//     } catch (err) {
//       console.error("Error initializing GCodePreview:", err);
//       onError?.(err);
//     }

//     let resizeTimeout;
//     const handleResize = () => {
//       clearTimeout(resizeTimeout);
//       resizeTimeout = setTimeout(() => {
//         if (canvasRef.current && containerRef.current) {
//           const rect = containerRef.current.getBoundingClientRect();
//           canvasRef.current.width = rect.width;
//           canvasRef.current.height = rect.height;
//           preview?.resize?.();
//         }
//       }, 250);
//     };

//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       clearTimeout(resizeTimeout);
//       if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//       preview?.clear?.();
//     };
//   }, []);

//   // Process gcode with debouncing
//   useEffect(() => {
//     if (!preview || !gcode) return;

//     setIsLoading(true);
//     setLoadProgress(0);
//     setCurrentLine(0);
//     setIsAnimating(false);

//     if (processingTimeoutRef.current) {
//       clearTimeout(processingTimeoutRef.current);
//     }

//     const optimizedLines = optimizeGCode(gcode);
//     setGcodeLines(optimizedLines);
    
//     processingTimeoutRef.current = setTimeout(() => {
//       try {
//         preview.clear();
//         preview.processGCode(optimizedLines.join('\n'));
//       } catch (err) {
//         console.error("Error processing G-code:", err);
//         setIsLoading(false);
//         onError?.(err);
//       }
//     }, 300);

//   }, [preview, gcode, optimizeGCode, onError]);

//   // Optimized animation with frame throttling
//   useEffect(() => {
//     if (!preview || !isAnimating || viewMode !== 'line' || gcodeLines.length === 0) return;

//     const FRAME_TIME = 50; // Update every 50ms for smoother performance
//     const BATCH_SIZE = 5; // Process multiple lines per update for large files

//     const animate = () => {
//       const now = Date.now();
//       if (now - lastUpdateRef.current < FRAME_TIME) {
//         animationRef.current = requestAnimationFrame(animate);
//         return;
//       }
      
//       lastUpdateRef.current = now;

//       setCurrentLine(prev => {
//         const next = Math.min(prev + BATCH_SIZE, gcodeLines.length - 1);
        
//         if (next >= gcodeLines.length - 1) {
//           setIsAnimating(false);
//           return gcodeLines.length - 1;
//         }
        
//         try {
//           const partialGcode = gcodeLines.slice(0, next + 1).join('\n');
//           preview.clear();
//           preview.processGCode(partialGcode);
//         } catch (e) {
//           console.error("Error updating line:", e);
//         }
        
//         return next;
//       });

//       animationRef.current = requestAnimationFrame(animate);
//     };

//     animationRef.current = requestAnimationFrame(animate);

//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [isAnimating, preview, gcodeLines, viewMode]);

//   const handleReset = useCallback(() => {
//     if (preview?.camera) {
//       preview.camera.position.set(
//         buildVolume.x * 1.5,
//         buildVolume.y * 1.5,
//         buildVolume.z * 1.5
//       );
//       preview.camera.lookAt(
//         buildVolume.x / 2,
//         buildVolume.y / 2,
//         buildVolume.z / 2
//       );
//       preview.render();
//     }
//   }, [preview, buildVolume]);

//   const toggleViewMode = useCallback(() => {
//     if (!preview || gcodeLines.length === 0) return;
    
//     const newMode = viewMode === 'full' ? 'line' : 'full';
//     setViewMode(newMode);
//     setIsAnimating(false);
    
//     if (newMode === 'full') {
//       setCurrentLine(gcodeLines.length - 1);
//       preview.clear();
//       preview.processGCode(gcodeLines.join('\n'));
//     } else {
//       setCurrentLine(0);
//       preview.clear();
//       preview.processGCode(gcodeLines[0] || '');
//     }
//   }, [preview, gcodeLines, viewMode]);

//   const toggleAnimation = useCallback(() => {
//     if (viewMode !== 'line') return;
    
//     if (currentLine >= gcodeLines.length - 1) {
//       setCurrentLine(0);
//       preview?.clear();
//       preview?.processGCode(gcodeLines[0] || '');
//     }
    
//     setIsAnimating(!isAnimating);
//   }, [viewMode, currentLine, gcodeLines, preview, isAnimating]);

//   const jumpToLine = useCallback((lineIndex) => {
//     if (!preview || lineIndex < 0 || lineIndex >= gcodeLines.length) return;
    
//     setCurrentLine(lineIndex);
//     setIsAnimating(false);
    
//     const partialGcode = gcodeLines.slice(0, lineIndex + 1).join('\n');
//     preview.clear();
//     preview.processGCode(partialGcode);
//   }, [preview, gcodeLines]);

//   const handleLineChange = useCallback((e) => {
//     jumpToLine(parseInt(e.target.value));
//   }, [jumpToLine]);

//   return (
//     <div style={{ display: 'flex', width: '100%', height: '600px', backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
//       {showSidebar && gcodeLines.length > 0 && (
//         <div style={{
//           width: '300px',
//           height: '100%',
//           backgroundColor: '#1a1a1a',
//           borderRight: '1px solid rgba(255, 255, 255, 0.1)',
//           display: 'flex',
//           flexDirection: 'column',
//           overflow: 'hidden'
//         }}>
//           <div style={{
//             padding: '12px 16px',
//             borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             backgroundColor: '#0a0a0a'
//           }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
//               <FileText size={18} />
//               <span style={{ fontWeight: 'bold' }}>G-Code Lines</span>
//             </div>
//             <button
//               onClick={() => setShowSidebar(false)}
//               style={{
//                 background: 'none',
//                 border: 'none',
//                 color: 'rgba(255, 255, 255, 0.6)',
//                 cursor: 'pointer',
//                 padding: '4px'
//               }}
//             >
//               ✕
//             </button>
//           </div>

//           <div style={{
//             padding: '12px 16px',
//             borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
//             backgroundColor: '#0a0a0a'
//           }}>
//             <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}>
//               Total Lines: {gcodeLines.length.toLocaleString()}
//             </div>
//             {viewMode === 'line' && (
//               <div style={{ color: '#FFD700', fontSize: '12px' }}>
//                 Current: Line {(currentLine + 1).toLocaleString()}
//               </div>
//             )}
//           </div>

//           <div 
//             onScroll={handleSidebarScroll}
//             style={{
//               flex: 1,
//               overflowY: 'auto',
//               fontSize: '12px',
//               fontFamily: 'monospace',
//               position: 'relative'
//             }}
//           >
//             <div style={{ height: `${gcodeLines.length * 28}px`, position: 'relative' }}>
//               <div style={{ 
//                 position: 'absolute', 
//                 top: `${visibleRange.start * 28}px`,
//                 left: 0,
//                 right: 0
//               }}>
//                 {virtualizedLines.map(({ line, actualIndex }) => (
//                   <div
//                     key={actualIndex}
//                     onClick={() => jumpToLine(actualIndex)}
//                     style={{
//                       height: '28px',
//                       padding: '6px 16px',
//                       cursor: 'pointer',
//                       backgroundColor: actualIndex === currentLine ? 'rgba(255, 215, 0, 0.2)' : 
//                                        actualIndex < currentLine && viewMode === 'line' ? 'rgba(100, 100, 100, 0.1)' : 
//                                        'transparent',
//                       borderLeft: actualIndex === currentLine ? '3px solid #FFD700' : '3px solid transparent',
//                       color: actualIndex === currentLine ? '#FFD700' : 
//                              actualIndex < currentLine && viewMode === 'line' ? 'rgba(255, 255, 255, 0.5)' : 
//                              'rgba(255, 255, 255, 0.8)',
//                       display: 'flex',
//                       alignItems: 'center',
//                       gap: '8px',
//                       userSelect: 'none'
//                     }}
//                   >
//                     <span style={{ opacity: 0.5, minWidth: '50px' }}>{actualIndex + 1}</span>
//                     <span style={{ 
//                       flex: 1, 
//                       overflow: 'hidden', 
//                       textOverflow: 'ellipsis', 
//                       whiteSpace: 'nowrap'
//                     }}>
//                       {line}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div style={{ flex: 1, position: 'relative' }}>
//         <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
//           <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
//         </div>

//         {!showSidebar && gcodeLines.length > 0 && (
//           <button
//             onClick={() => setShowSidebar(true)}
//             style={{
//               position: 'absolute',
//               top: '16px',
//               left: '16px',
//               padding: '10px',
//               backgroundColor: 'rgba(255, 255, 255, 0.1)',
//               border: '1px solid rgba(255, 255, 255, 0.2)',
//               borderRadius: '6px',
//               color: 'white',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '6px',
//               backdropFilter: 'blur(10px)',
//               zIndex: 10
//             }}
//           >
//             <ChevronRight size={18} />
//             Lines
//           </button>
//         )}

//         <div style={{
//           position: 'absolute',
//           top: '16px',
//           right: '16px',
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '8px',
//           zIndex: 10
//         }}>
//           <button
//             onClick={handleReset}
//             style={{
//               padding: '10px',
//               backgroundColor: 'rgba(255, 255, 255, 0.1)',
//               border: '1px solid rgba(255, 255, 255, 0.2)',
//               borderRadius: '6px',
//               color: 'white',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '6px',
//               backdropFilter: 'blur(10px)'
//             }}
//           >
//             <RotateCcw size={18} />
//             Reset
//           </button>

//           <button
//             onClick={toggleViewMode}
//             disabled={gcodeLines.length === 0}
//             style={{
//               padding: '10px',
//               backgroundColor: viewMode === 'line' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
//               border: '1px solid rgba(255, 255, 255, 0.2)',
//               borderRadius: '6px',
//               color: 'white',
//               cursor: gcodeLines.length === 0 ? 'not-allowed' : 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '6px',
//               backdropFilter: 'blur(10px)',
//               opacity: gcodeLines.length === 0 ? 0.5 : 1
//             }}
//           >
//             {viewMode === 'full' ? '📝' : '🔍'}
//             {viewMode === 'full' ? 'Animate' : 'Full'}
//           </button>
//         </div>

//         {viewMode === 'line' && gcodeLines.length > 0 && (
//           <div style={{
//             position: 'absolute',
//             bottom: '16px',
//             left: '50%',
//             transform: 'translateX(-50%)',
//             backgroundColor: 'rgba(0, 0, 0, 0.8)',
//             border: '1px solid rgba(255, 255, 255, 0.2)',
//             borderRadius: '12px',
//             padding: '16px 24px',
//             backdropFilter: 'blur(10px)',
//             minWidth: '400px',
//             maxWidth: '600px',
//             zIndex: 10
//           }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//               <button
//                 onClick={toggleAnimation}
//                 style={{
//                   padding: '8px',
//                   backgroundColor: 'rgba(255, 215, 0, 0.2)',
//                   border: '1px solid rgba(255, 215, 0, 0.4)',
//                   borderRadius: '6px',
//                   color: '#FFD700',
//                   cursor: 'pointer',
//                   display: 'flex',
//                   alignItems: 'center',
//                   justifyContent: 'center'
//                 }}
//               >
//                 {isAnimating ? <Pause size={20} /> : <Play size={20} />}
//               </button>

//               <div style={{ flex: 1 }}>
//                 <input
//                   type="range"
//                   min="0"
//                   max={gcodeLines.length - 1}
//                   value={currentLine}
//                   onChange={handleLineChange}
//                   style={{
//                     width: '100%',
//                     height: '6px',
//                     borderRadius: '3px',
//                     outline: 'none',
//                     background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
//                   }}
//                 />
//                 <div style={{
//                   display: 'flex',
//                   justifyContent: 'space-between',
//                   marginTop: '8px',
//                   color: 'rgba(255, 255, 255, 0.8)',
//                   fontSize: '12px'
//                 }}>
//                   <span>Line: {(currentLine + 1).toLocaleString()}</span>
//                   <span>Total: {gcodeLines.length.toLocaleString()}</span>
//                   <span>{((currentLine / gcodeLines.length) * 100).toFixed(1)}%</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       <style>{`
//         input[type="range"] {
//           -webkit-appearance: none;
//           appearance: none;
//           cursor: pointer;
//         }
        
//         input[type="range"]::-webkit-slider-thumb {
//           -webkit-appearance: none;
//           appearance: none;
//           width: 16px;
//           height: 16px;
//           border-radius: 50%;
//           background: #FFD700;
//           cursor: pointer;
//           box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
//         }
        
//         input[type="range"]::-moz-range-thumb {
//           width: 16px;
//           height: 16px;
//           border-radius: 50%;
//           background: #FFD700;
//           cursor: pointer;
//           border: none;
//           box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
//         }

//         div::-webkit-scrollbar {
//           width: 8px;
//         }
        
//         div::-webkit-scrollbar-track {
//           background: rgba(255, 255, 255, 0.05);
//         }
        
//         div::-webkit-scrollbar-thumb {
//           background: rgba(255, 215, 0, 0.3);
//           border-radius: 4px;
//         }
        
//         div::-webkit-scrollbar-thumb:hover {
//           background: rgba(255, 215, 0, 0.5);
//         }
//       `}</style>
//     </div>
//   );
// };

// export default GCodeViewer;

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as GCodePreview from "gcode-preview";
import { Play, Pause, RotateCcw, ChevronRight, FileText } from "lucide-react";

const GCodeViewer = ({
  gcode,
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
  
  const [gcodeLines, setGcodeLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [showSidebar, setShowSidebar] = useState(true);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  
  // Track the last processed G-code to prevent unnecessary re-processing
  const lastProcessedGcodeRef = useRef(null);

  const metallicColors = [
    "#C0C0C0", "#B87333", "#FFD700", "#E5E4E2",
    "#71797E", "#AAA9AD", "#8C92AC", "#BCC6CC"
  ];

  // Optimized G-code processing with memoization
  const optimizeGCode = useCallback((gcodeText) => {
    if (!gcodeText) return [];
    
    const lines = gcodeText.split('\n');
    const optimized = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith(';') || (line.startsWith('(') && line.endsWith(')'))) {
        continue;
      }
      
      const semicolonIndex = line.indexOf(';');
      const cleanLine = semicolonIndex !== -1 ? line.substring(0, semicolonIndex).trim() : line;
      
      if (cleanLine.length > 0) {
        optimized.push(cleanLine);
      }
    }
    
    return optimized;
  }, []);

  // Virtualized line rendering for large files
  const virtualizedLines = useMemo(() => {
    if (gcodeLines.length === 0) return [];
    
    const { start, end } = visibleRange;
    return gcodeLines.slice(start, Math.min(end, gcodeLines.length)).map((line, idx) => ({
      line,
      actualIndex: start + idx
    }));
  }, [gcodeLines, visibleRange]);

  // Handle scroll for virtualization
  const handleSidebarScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const itemHeight = 28;
    const visibleItems = Math.ceil(container.clientHeight / itemHeight);
    const bufferItems = 20;
    
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferItems);
    const end = start + visibleItems + (bufferItems * 2);
    
    setVisibleRange({ start, end });
  }, []);

  // Initialize canvas (only once)
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    try {
      const instance = GCodePreview.init({
        canvas: canvas,
        extrusionColor: metallicColors,
        travelColor: "#404040",
        buildVolume: buildVolume,
        backgroundColor: backgroundColor,
        allowDragNDrop: false,
        lineWidth: 2,
        renderTravels: false,
        renderExtrusion: true,
        startLayer: 0,
        endLayer: Infinity,
        topLayerColor: "#FFFFFF",
        lastSegmentColor: "#FFD700",
        renderAxes: true,
        axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
        renderBuildVolume: true,
        onProgress: (p) => {
          const progress = Math.round(p * 100);
          setLoadProgress(progress);
          setIsLoading(p < 1);
          onProgress?.(p);
        },
        onFinishLoading: (info) => {
          setIsLoading(false);
          setLoadProgress(100);
          onFinishLoading?.(info);
        },
        onError: (err) => {
          setIsLoading(false);
          console.error("Preview error:", err);
          onError?.(err);
        },
      });
      
      setPreview(instance);
    } catch (err) {
      console.error("Error initializing GCodePreview:", err);
      onError?.(err);
    }

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvasRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
          preview?.resize?.();
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      preview?.clear?.();
    };
  }, []); // Empty dependency array - only runs once

  // Process gcode ONLY when it actually changes
  useEffect(() => {
    if (!preview || !gcode) return;
    
    // Check if G-code has actually changed
    if (lastProcessedGcodeRef.current === gcode) {
      console.log("G-code unchanged, skipping re-processing");
      return;
    }

    console.log("G-code changed, processing...");
    lastProcessedGcodeRef.current = gcode;

    setIsLoading(true);
    setLoadProgress(0);
    setCurrentLine(0);
    setIsAnimating(false);

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    const optimizedLines = optimizeGCode(gcode);
    setGcodeLines(optimizedLines);
    
    processingTimeoutRef.current = setTimeout(() => {
      try {
        preview.clear();
        preview.processGCode(optimizedLines.join('\n'));
      } catch (err) {
        console.error("Error processing G-code:", err);
        setIsLoading(false);
        onError?.(err);
      }
    }, 300);

  }, [gcode]); // Only depend on gcode, not preview or other functions

  // Optimized animation with frame throttling
  useEffect(() => {
    if (!preview || !isAnimating || viewMode !== 'line' || gcodeLines.length === 0) return;

    const FRAME_TIME = 50;
    const BATCH_SIZE = 5;

    const animate = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current < FRAME_TIME) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastUpdateRef.current = now;

      setCurrentLine(prev => {
        const next = Math.min(prev + BATCH_SIZE, gcodeLines.length - 1);
        
        if (next >= gcodeLines.length - 1) {
          setIsAnimating(false);
          return gcodeLines.length - 1;
        }
        
        try {
          const partialGcode = gcodeLines.slice(0, next + 1).join('\n');
          preview.clear();
          preview.processGCode(partialGcode);
        } catch (e) {
          console.error("Error updating line:", e);
        }
        
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, viewMode, gcodeLines.length]); // Minimal dependencies

  const handleReset = useCallback(() => {
    if (preview?.camera) {
      preview.camera.position.set(
        buildVolume.x * 1.5,
        buildVolume.y * 1.5,
        buildVolume.z * 1.5
      );
      preview.camera.lookAt(
        buildVolume.x / 2,
        buildVolume.y / 2,
        buildVolume.z / 2
      );
      preview.render();
    }
  }, [preview, buildVolume]);

  const toggleViewMode = useCallback(() => {
    if (!preview || gcodeLines.length === 0) return;
    
    const newMode = viewMode === 'full' ? 'line' : 'full';
    setViewMode(newMode);
    setIsAnimating(false);
    
    if (newMode === 'full') {
      setCurrentLine(gcodeLines.length - 1);
      preview.clear();
      preview.processGCode(gcodeLines.join('\n'));
    } else {
      setCurrentLine(0);
      preview.clear();
      preview.processGCode(gcodeLines[0] || '');
    }
  }, [preview, gcodeLines, viewMode]);

  const toggleAnimation = useCallback(() => {
    if (viewMode !== 'line') return;
    
    if (currentLine >= gcodeLines.length - 1) {
      setCurrentLine(0);
      preview?.clear();
      preview?.processGCode(gcodeLines[0] || '');
    }
    
    setIsAnimating(!isAnimating);
  }, [viewMode, currentLine, gcodeLines, preview, isAnimating]);

  const jumpToLine = useCallback((lineIndex) => {
    if (!preview || lineIndex < 0 || lineIndex >= gcodeLines.length) return;
    
    setCurrentLine(lineIndex);
    setIsAnimating(false);
    
    const partialGcode = gcodeLines.slice(0, lineIndex + 1).join('\n');
    preview.clear();
    preview.processGCode(partialGcode);
  }, [preview, gcodeLines]);

  const handleLineChange = useCallback((e) => {
    jumpToLine(parseInt(e.target.value));
  }, [jumpToLine]);

  return (
    <div style={{ display: 'flex', width: '100%', height: '600px', backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      {showSidebar && gcodeLines.length > 0 && (
        <div style={{
          width: '300px',
          height: '100%',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0a0a0a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <FileText size={18} />
              <span style={{ fontWeight: 'bold' }}>G-Code Lines</span>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0a0a0a'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginBottom: '4px' }}>
              Total Lines: {gcodeLines.length.toLocaleString()}
            </div>
            {viewMode === 'line' && (
              <div style={{ color: '#FFD700', fontSize: '12px' }}>
                Current: Line {(currentLine + 1).toLocaleString()}
              </div>
            )}
          </div>

          <div 
            onScroll={handleSidebarScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
              position: 'relative'
            }}
          >
            <div style={{ height: `${gcodeLines.length * 28}px`, position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                top: `${visibleRange.start * 28}px`,
                left: 0,
                right: 0
              }}>
                {virtualizedLines.map(({ line, actualIndex }) => (
                  <div
                    key={actualIndex}
                    onClick={() => jumpToLine(actualIndex)}
                    style={{
                      height: '28px',
                      padding: '6px 16px',
                      cursor: 'pointer',
                      backgroundColor: actualIndex === currentLine ? 'rgba(255, 215, 0, 0.2)' : 
                                       actualIndex < currentLine && viewMode === 'line' ? 'rgba(100, 100, 100, 0.1)' : 
                                       'transparent',
                      borderLeft: actualIndex === currentLine ? '3px solid #FFD700' : '3px solid transparent',
                      color: actualIndex === currentLine ? '#FFD700' : 
                             actualIndex < currentLine && viewMode === 'line' ? 'rgba(255, 255, 255, 0.5)' : 
                             'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ opacity: 0.5, minWidth: '50px' }}>{actualIndex + 1}</span>
                    <span style={{ 
                      flex: 1, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap'
                    }}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>

        {!showSidebar && gcodeLines.length > 0 && (
          <button
            onClick={() => setShowSidebar(true)}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              padding: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(10px)',
              zIndex: 10
            }}
          >
            <ChevronRight size={18} />
            Lines
          </button>
        )}

        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 10
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <RotateCcw size={18} />
            Reset
          </button>

          <button
            onClick={toggleViewMode}
            disabled={gcodeLines.length === 0}
            style={{
              padding: '10px',
              backgroundColor: viewMode === 'line' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'white',
              cursor: gcodeLines.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(10px)',
              opacity: gcodeLines.length === 0 ? 0.5 : 1
            }}
          >
            {viewMode === 'full' ? '📝' : '🔍'}
            {viewMode === 'full' ? 'Animate' : 'Full'}
          </button>
        </div>

        {viewMode === 'line' && gcodeLines.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '16px 24px',
            backdropFilter: 'blur(10px)',
            minWidth: '400px',
            maxWidth: '600px',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={toggleAnimation}
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '6px',
                  color: '#FFD700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isAnimating ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="0"
                  max={gcodeLines.length - 1}
                  value={currentLine}
                  onChange={handleLineChange}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    outline: 'none',
                    background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px'
                }}>
                  <span>Line: {(currentLine + 1).toLocaleString()}</span>
                  <span>Total: {gcodeLines.length.toLocaleString()}</span>
                  <span>{((currentLine / gcodeLines.length) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFD700;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFD700;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        div::-webkit-scrollbar {
          width: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.3);
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default GCodeViewer;