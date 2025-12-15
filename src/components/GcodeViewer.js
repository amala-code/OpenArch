// // import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
// // import * as GCodePreview from "gcode-preview";
// // import { Play, Pause, RotateCcw, ChevronRight, FileText } from "lucide-react";

// // const GCodeViewer = ({
// //   gcode,
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
  
// //   const [gcodeLines, setGcodeLines] = useState([]);
// //   const [currentLine, setCurrentLine] = useState(0);
// //   const [isAnimating, setIsAnimating] = useState(false);
// //   const [viewMode, setViewMode] = useState('full');
// //   const [showSidebar, setShowSidebar] = useState(true);
// //   const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
// //   const animationRef = useRef(null);
// //   const lastUpdateRef = useRef(0);
  
// //   // Track the last processed G-code to prevent unnecessary re-processing
// //   const lastProcessedGcodeRef = useRef(null);

// //   const metallicColors = [
// //     "#C0C0C0", "#B87333", "#FFD700", "#E5E4E2",
// //     "#71797E", "#AAA9AD", "#8C92AC", "#BCC6CC"
// //   ];

// //   // Optimized G-code processing with memoization
// //   const optimizeGCode = useCallback((gcodeText) => {
// //     if (!gcodeText) return [];
    
// //     const lines = gcodeText.split('\n');
// //     const optimized = [];
    
// //     for (let i = 0; i < lines.length; i++) {
// //       const line = lines[i].trim();
      
// //       if (!line || line.startsWith(';') || (line.startsWith('(') && line.endsWith(')'))) {
// //         continue;
// //       }
      
// //       const semicolonIndex = line.indexOf(';');
// //       const cleanLine = semicolonIndex !== -1 ? line.substring(0, semicolonIndex).trim() : line;
      
// //       if (cleanLine.length > 0) {
// //         optimized.push(cleanLine);
// //       }
// //     }
    
// //     return optimized;
// //   }, []);

// //   // Virtualized line rendering for large files
// //   const virtualizedLines = useMemo(() => {
// //     if (gcodeLines.length === 0) return [];
    
// //     const { start, end } = visibleRange;
// //     return gcodeLines.slice(start, Math.min(end, gcodeLines.length)).map((line, idx) => ({
// //       line,
// //       actualIndex: start + idx
// //     }));
// //   }, [gcodeLines, visibleRange]);

// //   // Handle scroll for virtualization
// //   const handleSidebarScroll = useCallback((e) => {
// //     const container = e.target;
// //     const scrollTop = container.scrollTop;
// //     const itemHeight = 28;
// //     const visibleItems = Math.ceil(container.clientHeight / itemHeight);
// //     const bufferItems = 20;
    
// //     const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferItems);
// //     const end = start + visibleItems + (bufferItems * 2);
    
// //     setVisibleRange({ start, end });
// //   }, []);

// //   // Initialize canvas (only once)
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
// //           onProgress?.(p);
// //         },
// //         onFinishLoading: (info) => {
// //           setIsLoading(false);
// //           setLoadProgress(100);
// //           onFinishLoading?.(info);
// //         },
// //         onError: (err) => {
// //           setIsLoading(false);
// //           console.error("Preview error:", err);
// //           onError?.(err);
// //         },
// //       });
      
// //       setPreview(instance);
// //     } catch (err) {
// //       console.error("Error initializing GCodePreview:", err);
// //       onError?.(err);
// //     }

// //     let resizeTimeout;
// //     const handleResize = () => {
// //       clearTimeout(resizeTimeout);
// //       resizeTimeout = setTimeout(() => {
// //         if (canvasRef.current && containerRef.current) {
// //           const rect = containerRef.current.getBoundingClientRect();
// //           canvasRef.current.width = rect.width;
// //           canvasRef.current.height = rect.height;
// //           preview?.resize?.();
// //         }
// //       }, 250);
// //     };

// //     window.addEventListener("resize", handleResize);

// //     return () => {
// //       window.removeEventListener("resize", handleResize);
// //       clearTimeout(resizeTimeout);
// //       if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
// //       if (animationRef.current) cancelAnimationFrame(animationRef.current);
// //       preview?.clear?.();
// //     };
// //   }, []); // Empty dependency array - only runs once

// //   // Process gcode ONLY when it actually changes
// //   useEffect(() => {
// //     if (!preview || !gcode) return;
    
// //     // Check if G-code has actually changed
// //     if (lastProcessedGcodeRef.current === gcode) {
// //       console.log("G-code unchanged, skipping re-processing");
// //       return;
// //     }

// //     console.log("G-code changed, processing...");
// //     lastProcessedGcodeRef.current = gcode;

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
// //         onError?.(err);
// //       }
// //     }, 300);

// //   }, [gcode]); // Only depend on gcode, not preview or other functions

// //   // Optimized animation with frame throttling
// //   useEffect(() => {
// //     if (!preview || !isAnimating || viewMode !== 'line' || gcodeLines.length === 0) return;

// //     const FRAME_TIME = 50;
// //     const BATCH_SIZE = 5;

// //     const animate = () => {
// //       const now = Date.now();
// //       if (now - lastUpdateRef.current < FRAME_TIME) {
// //         animationRef.current = requestAnimationFrame(animate);
// //         return;
// //       }
      
// //       lastUpdateRef.current = now;

// //       setCurrentLine(prev => {
// //         const next = Math.min(prev + BATCH_SIZE, gcodeLines.length - 1);
        
// //         if (next >= gcodeLines.length - 1) {
// //           setIsAnimating(false);
// //           return gcodeLines.length - 1;
// //         }
        
// //         try {
// //           const partialGcode = gcodeLines.slice(0, next + 1).join('\n');
// //           preview.clear();
// //           preview.processGCode(partialGcode);
// //         } catch (e) {
// //           console.error("Error updating line:", e);
// //         }
        
// //         return next;
// //       });

// //       animationRef.current = requestAnimationFrame(animate);
// //     };

// //     animationRef.current = requestAnimationFrame(animate);

// //     return () => {
// //       if (animationRef.current) {
// //         cancelAnimationFrame(animationRef.current);
// //       }
// //     };
// //   }, [isAnimating, viewMode, gcodeLines.length]); // Minimal dependencies

// //   const handleReset = useCallback(() => {
// //     if (preview?.camera) {
// //       preview.camera.position.set(
// //         buildVolume.x * 1.5,
// //         buildVolume.y * 1.5,
// //         buildVolume.z * 1.5
// //       );
// //       preview.camera.lookAt(
// //         buildVolume.x / 2,
// //         buildVolume.y / 2,
// //         buildVolume.z / 2
// //       );
// //       preview.render();
// //     }
// //   }, [preview, buildVolume]);

// //   const toggleViewMode = useCallback(() => {
// //     if (!preview || gcodeLines.length === 0) return;
    
// //     const newMode = viewMode === 'full' ? 'line' : 'full';
// //     setViewMode(newMode);
// //     setIsAnimating(false);
    
// //     if (newMode === 'full') {
// //       setCurrentLine(gcodeLines.length - 1);
// //       preview.clear();
// //       preview.processGCode(gcodeLines.join('\n'));
// //     } else {
// //       setCurrentLine(0);
// //       preview.clear();
// //       preview.processGCode(gcodeLines[0] || '');
// //     }
// //   }, [preview, gcodeLines, viewMode]);

// //   const toggleAnimation = useCallback(() => {
// //     if (viewMode !== 'line') return;
    
// //     if (currentLine >= gcodeLines.length - 1) {
// //       setCurrentLine(0);
// //       preview?.clear();
// //       preview?.processGCode(gcodeLines[0] || '');
// //     }
    
// //     setIsAnimating(!isAnimating);
// //   }, [viewMode, currentLine, gcodeLines, preview, isAnimating]);

// //   const jumpToLine = useCallback((lineIndex) => {
// //     if (!preview || lineIndex < 0 || lineIndex >= gcodeLines.length) return;
    
// //     setCurrentLine(lineIndex);
// //     setIsAnimating(false);
    
// //     const partialGcode = gcodeLines.slice(0, lineIndex + 1).join('\n');
// //     preview.clear();
// //     preview.processGCode(partialGcode);
// //   }, [preview, gcodeLines]);

// //   const handleLineChange = useCallback((e) => {
// //     jumpToLine(parseInt(e.target.value));
// //   }, [jumpToLine]);

// //   return (
// //     <div style={{ display: 'flex', width: '100%', height: '600px', backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
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
// //               Total Lines: {gcodeLines.length.toLocaleString()}
// //             </div>
// //             {viewMode === 'line' && (
// //               <div style={{ color: '#FFD700', fontSize: '12px' }}>
// //                 Current: Line {(currentLine + 1).toLocaleString()}
// //               </div>
// //             )}
// //           </div>

// //           <div 
// //             onScroll={handleSidebarScroll}
// //             style={{
// //               flex: 1,
// //               overflowY: 'auto',
// //               fontSize: '12px',
// //               fontFamily: 'monospace',
// //               position: 'relative'
// //             }}
// //           >
// //             <div style={{ height: `${gcodeLines.length * 28}px`, position: 'relative' }}>
// //               <div style={{ 
// //                 position: 'absolute', 
// //                 top: `${visibleRange.start * 28}px`,
// //                 left: 0,
// //                 right: 0
// //               }}>
// //                 {virtualizedLines.map(({ line, actualIndex }) => (
// //                   <div
// //                     key={actualIndex}
// //                     onClick={() => jumpToLine(actualIndex)}
// //                     style={{
// //                       height: '28px',
// //                       padding: '6px 16px',
// //                       cursor: 'pointer',
// //                       backgroundColor: actualIndex === currentLine ? 'rgba(255, 215, 0, 0.2)' : 
// //                                        actualIndex < currentLine && viewMode === 'line' ? 'rgba(100, 100, 100, 0.1)' : 
// //                                        'transparent',
// //                       borderLeft: actualIndex === currentLine ? '3px solid #FFD700' : '3px solid transparent',
// //                       color: actualIndex === currentLine ? '#FFD700' : 
// //                              actualIndex < currentLine && viewMode === 'line' ? 'rgba(255, 255, 255, 0.5)' : 
// //                              'rgba(255, 255, 255, 0.8)',
// //                       display: 'flex',
// //                       alignItems: 'center',
// //                       gap: '8px',
// //                       userSelect: 'none'
// //                     }}
// //                   >
// //                     <span style={{ opacity: 0.5, minWidth: '50px' }}>{actualIndex + 1}</span>
// //                     <span style={{ 
// //                       flex: 1, 
// //                       overflow: 'hidden', 
// //                       textOverflow: 'ellipsis', 
// //                       whiteSpace: 'nowrap'
// //                     }}>
// //                       {line}
// //                     </span>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <div style={{ flex: 1, position: 'relative' }}>
// //         <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
// //           <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
// //         </div>

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
// //           >
// //             {viewMode === 'full' ? '📝' : '🔍'}
// //             {viewMode === 'full' ? 'Animate' : 'Full'}
// //           </button>
// //         </div>

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
// //             maxWidth: '600px',
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
// //                   <span>Line: {(currentLine + 1).toLocaleString()}</span>
// //                   <span>Total: {gcodeLines.length.toLocaleString()}</span>
// //                   <span>{((currentLine / gcodeLines.length) * 100).toFixed(1)}%</span>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </div>

// //       <style>{`
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
// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
  
//   // Three.js fallback
//   const [useThreeJS, setUseThreeJS] = useState(false);
//   const sceneRef = useRef(null);
//   const cameraRef = useRef(null);
//   const rendererRef = useRef(null);
//   const controlsRef = useRef(null);
//   const gcodeGroupRef = useRef(null);
//   const animationFrameRef = useRef(null);
//   const [gcodeBounds, setGcodeBounds] = useState(null);
  
//   const [gcodeLines, setGcodeLines] = useState([]);
//   const [currentLine, setCurrentLine] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [viewMode, setViewMode] = useState('full');
//   const [showSidebar, setShowSidebar] = useState(true);
//   const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
//   const animationRef = useRef(null);
//   const lastUpdateRef = useRef(0);
  
//   const lastProcessedGcodeRef = useRef(null);

//   const metallicColors = [
//     "#C0C0C0", "#B87333", "#FFD700", "#E5E4E2",
//     "#71797E", "#AAA9AD", "#8C92AC", "#BCC6CC"
//   ];

//   // Check if G-code has extrusion values
//   const hasExtrusionValues = useCallback((gcodeText) => {
//     if (!gcodeText) return false;
//     const lines = gcodeText.split('\n');
//     for (let i = 0; i < Math.min(100, lines.length); i++) {
//       if (lines[i].includes(' E')) return true;
//     }
//     return false;
//   }, []);

//   // Optimized G-code processing
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

//   // Initialize Three.js fallback
//   const initThreeJS = useCallback(() => {
//     if (!canvasRef.current || !containerRef.current) return;

//     console.log("Initializing Three.js fallback renderer...");

//     const container = containerRef.current;
//     const canvas = canvasRef.current;
//     const rect = container.getBoundingClientRect();

//     // Scene
//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color(backgroundColor);
//     sceneRef.current = scene;

//     // Camera - initial position will be adjusted after parsing
//     const camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 10000);
//     camera.position.set(300, 300, 300);
//     cameraRef.current = camera;

//     // Renderer
//     const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
//     renderer.setSize(rect.width, rect.height);
//     renderer.setPixelRatio(window.devicePixelRatio);
//     rendererRef.current = renderer;

//     // Controls
//     const controls = new OrbitControls(camera, canvas);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.05;
//     controlsRef.current = controls;

//     // Lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
//     scene.add(ambientLight);

//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
//     directionalLight.position.set(1, 1, 1);
//     scene.add(directionalLight);

//     // Grid
//     const gridSize = 300;
//     const gridHelper = new THREE.GridHelper(gridSize, 30, 0x444444, 0x222222);
//     gridHelper.position.set(0, 0, 0);
//     scene.add(gridHelper);

//     // Axes
//     const axesHelper = new THREE.AxesHelper(100);
//     scene.add(axesHelper);

//     // Animation loop
//     const animate = () => {
//       animationFrameRef.current = requestAnimationFrame(animate);
//       controls.update();
//       renderer.render(scene, camera);
//     };
//     animate();

//     console.log("Three.js initialized successfully");
//   }, [backgroundColor]);

//   // Parse and render with Three.js
//   const parseWithThreeJS = useCallback((gcodeText, upToLine = null) => {
//     if (!sceneRef.current) {
//       console.error("Scene not initialized");
//       return;
//     }

//     const scene = sceneRef.current;

//     // Remove previous G-code
//     if (gcodeGroupRef.current) {
//       scene.remove(gcodeGroupRef.current);
//       gcodeGroupRef.current.traverse((child) => {
//         if (child.geometry) child.geometry.dispose();
//         if (child.material) child.material.dispose();
//       });
//     }

//     const gcodeGroup = new THREE.Group();
//     gcodeGroupRef.current = gcodeGroup;

//     const lines = gcodeText.split('\n');
//     const movements = [];
    
//     let currentX = 0, currentY = 0, currentZ = 0, currentE = 0;
//     let minX = Infinity, maxX = -Infinity;
//     let minY = Infinity, maxY = -Infinity;
//     let minZ = Infinity, maxZ = -Infinity;

//     const linesToProcess = upToLine !== null ? Math.min(upToLine + 1, lines.length) : lines.length;

//     console.log(`Parsing ${linesToProcess} lines...`);

//     for (let i = 0; i < linesToProcess; i++) {
//       const line = lines[i].trim();
      
//       if (!line || line.startsWith(';')) continue;

//       if (line.startsWith('G1') || line.startsWith('G0')) {
//         const parts = line.split(/\s+/);
//         let newX = currentX, newY = currentY, newZ = currentZ, newE = currentE;
//         let hasE = false, hasCoordinate = false;

//         for (const part of parts) {
//           if (part.startsWith('X')) {
//             newX = parseFloat(part.substring(1));
//             hasCoordinate = true;
//           }
//           if (part.startsWith('Y')) {
//             newY = parseFloat(part.substring(1));
//             hasCoordinate = true;
//           }
//           if (part.startsWith('Z')) {
//             newZ = parseFloat(part.substring(1));
//             hasCoordinate = true;
//           }
//           if (part.startsWith('E')) {
//             newE = parseFloat(part.substring(1));
//             hasE = true;
//           }
//         }

//         if (!hasCoordinate) continue;

//         // Update bounds
//         minX = Math.min(minX, currentX, newX);
//         maxX = Math.max(maxX, currentX, newX);
//         minY = Math.min(minY, currentY, newY);
//         maxY = Math.max(maxY, currentY, newY);
//         minZ = Math.min(minZ, currentZ, newZ);
//         maxZ = Math.max(maxZ, currentZ, newZ);

//         const xyChanged = Math.abs(newX - currentX) > 0.001 || Math.abs(newY - currentY) > 0.001;
//         const zOnlyMove = !xyChanged && Math.abs(newZ - currentZ) > 0.001;
//         const extrusionMove = hasE ? (newE > currentE) : xyChanged;

//         if (newX !== currentX || newY !== currentY || newZ !== currentZ) {
//           movements.push({
//             from: { x: currentX, y: currentY, z: currentZ },
//             to: { x: newX, y: newY, z: newZ },
//             isExtrusion: extrusionMove && !zOnlyMove
//           });
//         }

//         currentX = newX;
//         currentY = newY;
//         currentZ = newZ;
//         currentE = newE;
//       }

//       if (i % 100 === 0 && onProgress) {
//         onProgress(i / linesToProcess);
//       }
//     }

//     const bounds = {
//       minX, maxX, minY, maxY, minZ, maxZ,
//       centerX: (minX + maxX) / 2,
//       centerY: (minY + maxY) / 2,
//       centerZ: (minZ + maxZ) / 2,
//       sizeX: maxX - minX,
//       sizeY: maxY - minY,
//       sizeZ: maxZ - minZ
//     };

//     console.log("G-code bounds:", bounds);
//     console.log("Total movements:", movements.length);
//     console.log("Extrusion moves:", movements.filter(m => m.isExtrusion).length);

//     setGcodeBounds(bounds);

//     // Create lines
//     const extrusionPoints = [];
//     for (const move of movements) {
//       if (move.isExtrusion) {
//         extrusionPoints.push(
//           new THREE.Vector3(move.from.x, move.from.z, move.from.y),
//           new THREE.Vector3(move.to.x, move.to.z, move.to.y)
//         );
//       }
//     }

//     console.log("Creating geometry with", extrusionPoints.length / 2, "line segments");

//     if (extrusionPoints.length > 0) {
//       const geometry = new THREE.BufferGeometry().setFromPoints(extrusionPoints);
//       const material = new THREE.LineBasicMaterial({
//         color: new THREE.Color(metallicColors[0]),
//         linewidth: 2,
//         transparent: false,
//         opacity: 1.0
//       });
//       const lineSegments = new THREE.LineSegments(geometry, material);
//       gcodeGroup.add(lineSegments);
      
//       console.log("Line segments added to scene");
//     } else {
//       console.warn("No extrusion points found!");
//     }

//     scene.add(gcodeGroup);

//     // Position camera to view the G-code
//     if (cameraRef.current && controlsRef.current && isFinite(bounds.centerX)) {
//       const maxDim = Math.max(bounds.sizeX, bounds.sizeY, bounds.sizeZ);
//       const distance = maxDim * 2.5;
      
//       cameraRef.current.position.set(
//         bounds.centerX + distance,
//         bounds.centerZ + distance,
//         bounds.centerY + distance
//       );
      
//       controlsRef.current.target.set(bounds.centerX, bounds.centerZ, bounds.centerY);
//       controlsRef.current.update();
      
//       console.log("Camera positioned at:", cameraRef.current.position);
//       console.log("Looking at:", controlsRef.current.target);
//     }
    
//     if (onProgress) onProgress(1);
//     if (onFinishLoading) onFinishLoading({ 
//       totalMoves: movements.length,
//       extrusionMoves: movements.filter(m => m.isExtrusion).length,
//       bounds: bounds
//     });
//   }, [metallicColors, onProgress, onFinishLoading]);

//   // Virtualized line rendering
//   const virtualizedLines = useMemo(() => {
//     if (gcodeLines.length === 0) return [];
    
//     const { start, end } = visibleRange;
//     return gcodeLines.slice(start, Math.min(end, gcodeLines.length)).map((line, idx) => ({
//       line,
//       actualIndex: start + idx
//     }));
//   }, [gcodeLines, visibleRange]);

//   const handleSidebarScroll = useCallback((e) => {
//     const container = e.target;
//     const scrollTop = container.scrollTop;
//     const itemHeight = 28;
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

//     // Try gcode-preview first
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
//           console.warn("gcode-preview error, falling back to Three.js:", err);
//           setUseThreeJS(true);
//           initThreeJS();
//         },
//       });
      
//       setPreview(instance);
//       setUseThreeJS(false);
//       console.log("gcode-preview initialized");
//     } catch (err) {
//       console.warn("Failed to init gcode-preview, using Three.js:", err);
//       setUseThreeJS(true);
//       initThreeJS();
//     }

//     let resizeTimeout;
//     const handleResize = () => {
//       clearTimeout(resizeTimeout);
//       resizeTimeout = setTimeout(() => {
//         if (canvasRef.current && containerRef.current) {
//           const rect = containerRef.current.getBoundingClientRect();
//           canvasRef.current.width = rect.width;
//           canvasRef.current.height = rect.height;
          
//           if (useThreeJS && cameraRef.current && rendererRef.current) {
//             cameraRef.current.aspect = rect.width / rect.height;
//             cameraRef.current.updateProjectionMatrix();
//             rendererRef.current.setSize(rect.width, rect.height);
//           } else {
//             preview?.resize?.();
//           }
//         }
//       }, 250);
//     };

//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//       clearTimeout(resizeTimeout);
//       if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//       if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
//       if (useThreeJS) {
//         rendererRef.current?.dispose();
//       } else {
//         preview?.clear?.();
//       }
//     };
//   }, []);

//   // Process gcode
//   useEffect(() => {
//     if (!gcode) return;
    
//     if (lastProcessedGcodeRef.current === gcode) {
//       console.log("G-code unchanged, skipping re-processing");
//       return;
//     }

//     console.log("Processing G-code...");
//     lastProcessedGcodeRef.current = gcode;

//     setIsLoading(true);
//     setLoadProgress(0);
//     setCurrentLine(0);
//     setIsAnimating(false);

//     if (processingTimeoutRef.current) {
//       clearTimeout(processingTimeoutRef.current);
//     }

//     const optimizedLines = optimizeGCode(gcode);
//     setGcodeLines(optimizedLines);
    
//     // Check if we need Three.js fallback
//     const hasE = hasExtrusionValues(gcode);
//     console.log("Has extrusion values:", hasE);
    
//     if (!hasE && !useThreeJS) {
//       console.log("No extrusion values detected, switching to Three.js");
//       setUseThreeJS(true);
//       initThreeJS();
      
//       // Wait for Three.js to initialize
//       setTimeout(() => {
//         parseWithThreeJS(optimizedLines.join('\n'));
//         setIsLoading(false);
//       }, 500);
//       return;
//     }
    
//     processingTimeoutRef.current = setTimeout(() => {
//       try {
//         if (useThreeJS) {
//           parseWithThreeJS(optimizedLines.join('\n'));
//           setIsLoading(false);
//         } else if (preview) {
//           preview.clear();
//           preview.processGCode(optimizedLines.join('\n'));
//         }
//       } catch (err) {
//         console.error("Error processing G-code:", err);
        
//         // Fallback to Three.js if gcode-preview fails
//         if (!useThreeJS) {
//           console.log("Falling back to Three.js after error");
//           setUseThreeJS(true);
//           initThreeJS();
//           setTimeout(() => {
//             parseWithThreeJS(optimizedLines.join('\n'));
//             setIsLoading(false);
//           }, 500);
//         } else {
//           setIsLoading(false);
//           onError?.(err);
//         }
//       }
//     }, 300);

//   }, [gcode]);

//   // Animation for line-by-line mode
//   useEffect(() => {
//     if (!isAnimating || viewMode !== 'line' || gcodeLines.length === 0) return;

//     const FRAME_TIME = 50;
//     const BATCH_SIZE = 5;

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
          
//           if (useThreeJS) {
//             parseWithThreeJS(partialGcode, next);
//           } else if (preview) {
//             preview.clear();
//             preview.processGCode(partialGcode);
//           }
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
//   }, [isAnimating, viewMode, gcodeLines.length, useThreeJS]);

//   const handleReset = useCallback(() => {
//     if (useThreeJS && cameraRef.current && gcodeBounds) {
//       const maxDim = Math.max(gcodeBounds.sizeX, gcodeBounds.sizeY, gcodeBounds.sizeZ);
//       const distance = maxDim * 2.5;
      
//       cameraRef.current.position.set(
//         gcodeBounds.centerX + distance,
//         gcodeBounds.centerZ + distance,
//         gcodeBounds.centerY + distance
//       );
      
//       if (controlsRef.current) {
//         controlsRef.current.target.set(gcodeBounds.centerX, gcodeBounds.centerZ, gcodeBounds.centerY);
//         controlsRef.current.update();
//       }
//     } else if (preview?.camera) {
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
//   }, [preview, useThreeJS, buildVolume, gcodeBounds]);

//   const toggleViewMode = useCallback(() => {
//     if (gcodeLines.length === 0) return;
    
//     const newMode = viewMode === 'full' ? 'line' : 'full';
//     setViewMode(newMode);
//     setIsAnimating(false);
    
//     if (newMode === 'full') {
//       setCurrentLine(gcodeLines.length - 1);
//       const fullGcode = gcodeLines.join('\n');
      
//       if (useThreeJS) {
//         parseWithThreeJS(fullGcode);
//       } else if (preview) {
//         preview.clear();
//         preview.processGCode(fullGcode);
//       }
//     } else {
//       setCurrentLine(0);
//       const firstLine = gcodeLines[0] || '';
      
//       if (useThreeJS) {
//         parseWithThreeJS(firstLine, 0);
//       } else if (preview) {
//         preview.clear();
//         preview.processGCode(firstLine);
//       }
//     }
//   }, [gcodeLines, viewMode, useThreeJS, preview, parseWithThreeJS]);

//   const toggleAnimation = useCallback(() => {
//     if (viewMode !== 'line') return;
    
//     if (currentLine >= gcodeLines.length - 1) {
//       setCurrentLine(0);
//       const firstLine = gcodeLines[0] || '';
      
//       if (useThreeJS) {
//         parseWithThreeJS(firstLine, 0);
//       } else if (preview) {
//         preview.clear();
//         preview.processGCode(firstLine);
//       }
//     }
    
//     setIsAnimating(!isAnimating);
//   }, [viewMode, currentLine, gcodeLines, preview, isAnimating, useThreeJS, parseWithThreeJS]);

//   const jumpToLine = useCallback((lineIndex) => {
//     if (lineIndex < 0 || lineIndex >= gcodeLines.length) return;
    
//     setCurrentLine(lineIndex);
//     setIsAnimating(false);
    
//     const partialGcode = gcodeLines.slice(0, lineIndex + 1).join('\n');
    
//     if (useThreeJS) {
//       parseWithThreeJS(partialGcode, lineIndex);
//     } else if (preview) {
//       preview.clear();
//       preview.processGCode(partialGcode);
//     }
//   }, [gcodeLines, useThreeJS, preview, parseWithThreeJS]);

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
//             {useThreeJS && (
//               <div style={{ color: '#4ECDC4', fontSize: '10px', marginTop: '4px' }}>
//                 ⚡ Three.js Renderer
//               </div>
//             )}
//             {gcodeBounds && (
//               <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', marginTop: '4px' }}>
//                 Size: {gcodeBounds.sizeX.toFixed(1)} × {gcodeBounds.sizeY.toFixed(1)} × {gcodeBounds.sizeZ.toFixed(1)} mm
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

//         {isLoading && (
//           <div style={{
//             position: 'absolute',
//             top: '50%',
//             left: '50%',
//             transform: 'translate(-50%, -50%)',
//             backgroundColor: 'rgba(0, 0, 0, 0.8)',
//             padding: '20px 30px',
//             borderRadius: '8px',
//             color: 'white',
//             fontSize: '14px',
//             backdropFilter: 'blur(10px)',
//             zIndex: 20
//           }}>
//             Loading G-code... {loadProgress}%
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
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
  
  // Three.js fallback
  const [useThreeJS, setUseThreeJS] = useState(false);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const gcodeGroupRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [gcodeBounds, setGcodeBounds] = useState(null);
  
  const [gcodeLines, setGcodeLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [showSidebar, setShowSidebar] = useState(true);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  
  const lastProcessedGcodeRef = useRef(null);

  // Enhanced color palette with brighter, more vibrant colors
  const metallicColors = [
    "#00D9FF", // Bright cyan
    "#FF6B35", // Vibrant orange
    "#FFD700", // Gold
    "#7FFF00", // Chartreuse
    "#FF1493", // Deep pink
    "#00FFD1", // Turquoise
    "#FFA500", // Orange
    "#8A2BE2"  // Blue violet
  ];

  // Check if G-code has extrusion values
  const hasExtrusionValues = useCallback((gcodeText) => {
    if (!gcodeText) return false;
    const lines = gcodeText.split('\n');
    for (let i = 0; i < Math.min(100, lines.length); i++) {
      if (lines[i].includes(' E')) return true;
    }
    return false;
  }, []);

  // Optimized G-code processing
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

  // Initialize Three.js fallback with enhanced colors
  const initThreeJS = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    console.log("Initializing Three.js fallback renderer...");

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();

    // Scene with darker background for better contrast
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f0f1a");
    sceneRef.current = scene;

    // Camera - initial position will be adjusted after parsing
    const camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 10000);
    camera.position.set(300, 300, 300);
    cameraRef.current = camera;

    // Renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: false 
    });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Enhanced lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x4ECDC4, 0.4);
    directionalLight2.position.set(-1, 0.5, -1);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xFF6B35, 0.3);
    directionalLight3.position.set(0, -1, 0);
    scene.add(directionalLight3);

    // Grid with better visibility
    const gridSize = 300;
    const gridHelper = new THREE.GridHelper(gridSize, 30, 0x00D9FF, 0x1a3a4a);
    gridHelper.position.set(0, 0, 0);
    scene.add(gridHelper);

    // Enhanced axes
    const axesHelper = new THREE.AxesHelper(100);
    axesHelper.material.linewidth = 2;
    scene.add(axesHelper);

    // Add subtle fog for depth perception
    scene.fog = new THREE.Fog(0x0f0f1a, 500, 2000);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    console.log("Three.js initialized successfully");
  }, []);

  // Parse and render with Three.js - enhanced colors
  const parseWithThreeJS = useCallback((gcodeText, upToLine = null) => {
    if (!sceneRef.current) {
      console.error("Scene not initialized");
      return;
    }

    const scene = sceneRef.current;

    // Remove previous G-code
    if (gcodeGroupRef.current) {
      scene.remove(gcodeGroupRef.current);
      gcodeGroupRef.current.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }

    const gcodeGroup = new THREE.Group();
    gcodeGroupRef.current = gcodeGroup;

    const lines = gcodeText.split('\n');
    const movements = [];
    
    let currentX = 0, currentY = 0, currentZ = 0, currentE = 0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    const linesToProcess = upToLine !== null ? Math.min(upToLine + 1, lines.length) : lines.length;

    console.log(`Parsing ${linesToProcess} lines...`);

    for (let i = 0; i < linesToProcess; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith(';')) continue;

      if (line.startsWith('G1') || line.startsWith('G0')) {
        const parts = line.split(/\s+/);
        let newX = currentX, newY = currentY, newZ = currentZ, newE = currentE;
        let hasE = false, hasCoordinate = false;

        for (const part of parts) {
          if (part.startsWith('X')) {
            newX = parseFloat(part.substring(1));
            hasCoordinate = true;
          }
          if (part.startsWith('Y')) {
            newY = parseFloat(part.substring(1));
            hasCoordinate = true;
          }
          if (part.startsWith('Z')) {
            newZ = parseFloat(part.substring(1));
            hasCoordinate = true;
          }
          if (part.startsWith('E')) {
            newE = parseFloat(part.substring(1));
            hasE = true;
          }
        }

        if (!hasCoordinate) continue;

        // Update bounds
        minX = Math.min(minX, currentX, newX);
        maxX = Math.max(maxX, currentX, newX);
        minY = Math.min(minY, currentY, newY);
        maxY = Math.max(maxY, currentY, newY);
        minZ = Math.min(minZ, currentZ, newZ);
        maxZ = Math.max(maxZ, currentZ, newZ);

        const xyChanged = Math.abs(newX - currentX) > 0.001 || Math.abs(newY - currentY) > 0.001;
        const zOnlyMove = !xyChanged && Math.abs(newZ - currentZ) > 0.001;
        const extrusionMove = hasE ? (newE > currentE) : xyChanged;

        if (newX !== currentX || newY !== currentY || newZ !== currentZ) {
          movements.push({
            from: { x: currentX, y: currentY, z: currentZ },
            to: { x: newX, y: newY, z: newZ },
            isExtrusion: extrusionMove && !zOnlyMove,
            layer: Math.round(currentZ * 10) // Approximate layer for color variation
          });
        }

        currentX = newX;
        currentY = newY;
        currentZ = newZ;
        currentE = newE;
      }

      if (i % 100 === 0 && onProgress) {
        onProgress(i / linesToProcess);
      }
    }

    const bounds = {
      minX, maxX, minY, maxY, minZ, maxZ,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
      sizeX: maxX - minX,
      sizeY: maxY - minY,
      sizeZ: maxZ - minZ
    };

    console.log("G-code bounds:", bounds);
    console.log("Total movements:", movements.length);
    console.log("Extrusion moves:", movements.filter(m => m.isExtrusion).length);

    setGcodeBounds(bounds);

    // Create lines with enhanced colors and gradient effect
    const extrusionPoints = [];
    const colors = [];
    
    for (let i = 0; i < movements.length; i++) {
      const move = movements[i];
      if (move.isExtrusion) {
        extrusionPoints.push(
          new THREE.Vector3(move.from.x, move.from.z, move.from.y),
          new THREE.Vector3(move.to.x, move.to.z, move.to.y)
        );
        
        // Color variation based on layer height for gradient effect
        const colorIndex = move.layer % metallicColors.length;
        const color = new THREE.Color(metallicColors[colorIndex]);
        
        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
      }
    }

    console.log("Creating geometry with", extrusionPoints.length / 2, "line segments");

    if (extrusionPoints.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(extrusionPoints);
      
      // Add color attribute for gradient effect
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 3,
        transparent: false,
        opacity: 1.0
      });
      
      const lineSegments = new THREE.LineSegments(geometry, material);
      
      // Add glow effect
      const glowGeometry = geometry.clone();
      const glowMaterial = new THREE.LineBasicMaterial({
        color: 0x00D9FF,
        linewidth: 5,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      });
      const glowLines = new THREE.LineSegments(glowGeometry, glowMaterial);
      
      gcodeGroup.add(glowLines);
      gcodeGroup.add(lineSegments);
      
      console.log("Line segments added to scene with enhanced colors");
    } else {
      console.warn("No extrusion points found!");
    }

    scene.add(gcodeGroup);

    // Position camera to view the G-code
    if (cameraRef.current && controlsRef.current && isFinite(bounds.centerX)) {
      const maxDim = Math.max(bounds.sizeX, bounds.sizeY, bounds.sizeZ);
      const distance = maxDim * 2.5;
      
      cameraRef.current.position.set(
        bounds.centerX + distance,
        bounds.centerZ + distance,
        bounds.centerY + distance
      );
      
      controlsRef.current.target.set(bounds.centerX, bounds.centerZ, bounds.centerY);
      controlsRef.current.update();
      
      console.log("Camera positioned at:", cameraRef.current.position);
      console.log("Looking at:", controlsRef.current.target);
    }
    
    if (onProgress) onProgress(1);
    if (onFinishLoading) onFinishLoading({ 
      totalMoves: movements.length,
      extrusionMoves: movements.filter(m => m.isExtrusion).length,
      bounds: bounds
    });
  }, [metallicColors, onProgress, onFinishLoading]);

  // Virtualized line rendering
  const virtualizedLines = useMemo(() => {
    if (gcodeLines.length === 0) return [];
    
    const { start, end } = visibleRange;
    return gcodeLines.slice(start, Math.min(end, gcodeLines.length)).map((line, idx) => ({
      line,
      actualIndex: start + idx
    }));
  }, [gcodeLines, visibleRange]);

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

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Try gcode-preview first
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
          console.warn("gcode-preview error, falling back to Three.js:", err);
          setUseThreeJS(true);
          initThreeJS();
        },
      });
      
      setPreview(instance);
      setUseThreeJS(false);
      console.log("gcode-preview initialized");
    } catch (err) {
      console.warn("Failed to init gcode-preview, using Three.js:", err);
      setUseThreeJS(true);
      initThreeJS();
    }

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvasRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
          
          if (useThreeJS && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = rect.width / rect.height;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(rect.width, rect.height);
          } else {
            preview?.resize?.();
          }
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      if (useThreeJS) {
        rendererRef.current?.dispose();
      } else {
        preview?.clear?.();
      }
    };
  }, []);

  // Process gcode
  useEffect(() => {
    if (!gcode) return;
    
    if (lastProcessedGcodeRef.current === gcode) {
      console.log("G-code unchanged, skipping re-processing");
      return;
    }

    console.log("Processing G-code...");
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
    
    // Check if we need Three.js fallback
    const hasE = hasExtrusionValues(gcode);
    console.log("Has extrusion values:", hasE);
    
    if (!hasE && !useThreeJS) {
      console.log("No extrusion values detected, switching to Three.js");
      setUseThreeJS(true);
      initThreeJS();
      
      // Wait for Three.js to initialize
      setTimeout(() => {
        parseWithThreeJS(optimizedLines.join('\n'));
        setIsLoading(false);
      }, 500);
      return;
    }
    
    processingTimeoutRef.current = setTimeout(() => {
      try {
        if (useThreeJS) {
          parseWithThreeJS(optimizedLines.join('\n'));
          setIsLoading(false);
        } else if (preview) {
          preview.clear();
          preview.processGCode(optimizedLines.join('\n'));
        }
      } catch (err) {
        console.error("Error processing G-code:", err);
        
        // Fallback to Three.js if gcode-preview fails
        if (!useThreeJS) {
          console.log("Falling back to Three.js after error");
          setUseThreeJS(true);
          initThreeJS();
          setTimeout(() => {
            parseWithThreeJS(optimizedLines.join('\n'));
            setIsLoading(false);
          }, 500);
        } else {
          setIsLoading(false);
          onError?.(err);
        }
      }
    }, 300);

  }, [gcode]);

  // Animation for line-by-line mode
  useEffect(() => {
    if (!isAnimating || viewMode !== 'line' || gcodeLines.length === 0) return;

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
          
          if (useThreeJS) {
            parseWithThreeJS(partialGcode, next);
          } else if (preview) {
            preview.clear();
            preview.processGCode(partialGcode);
          }
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
  }, [isAnimating, viewMode, gcodeLines.length, useThreeJS]);

  const handleReset = useCallback(() => {
    if (useThreeJS && cameraRef.current && gcodeBounds) {
      const maxDim = Math.max(gcodeBounds.sizeX, gcodeBounds.sizeY, gcodeBounds.sizeZ);
      const distance = maxDim * 2.5;
      
      cameraRef.current.position.set(
        gcodeBounds.centerX + distance,
        gcodeBounds.centerZ + distance,
        gcodeBounds.centerY + distance
      );
      
      if (controlsRef.current) {
        controlsRef.current.target.set(gcodeBounds.centerX, gcodeBounds.centerZ, gcodeBounds.centerY);
        controlsRef.current.update();
      }
    } else if (preview?.camera) {
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
  }, [preview, useThreeJS, buildVolume, gcodeBounds]);

  const toggleViewMode = useCallback(() => {
    if (gcodeLines.length === 0) return;
    
    const newMode = viewMode === 'full' ? 'line' : 'full';
    setViewMode(newMode);
    setIsAnimating(false);
    
    if (newMode === 'full') {
      setCurrentLine(gcodeLines.length - 1);
      const fullGcode = gcodeLines.join('\n');
      
      if (useThreeJS) {
        parseWithThreeJS(fullGcode);
      } else if (preview) {
        preview.clear();
        preview.processGCode(fullGcode);
      }
    } else {
      setCurrentLine(0);
      const firstLine = gcodeLines[0] || '';
      
      if (useThreeJS) {
        parseWithThreeJS(firstLine, 0);
      } else if (preview) {
        preview.clear();
        preview.processGCode(firstLine);
      }
    }
  }, [gcodeLines, viewMode, useThreeJS, preview, parseWithThreeJS]);

  const toggleAnimation = useCallback(() => {
    if (viewMode !== 'line') return;
    
    if (currentLine >= gcodeLines.length - 1) {
      setCurrentLine(0);
      const firstLine = gcodeLines[0] || '';
      
      if (useThreeJS) {
        parseWithThreeJS(firstLine, 0);
      } else if (preview) {
        preview.clear();
        preview.processGCode(firstLine);
      }
    }
    
    setIsAnimating(!isAnimating);
  }, [viewMode, currentLine, gcodeLines, preview, isAnimating, useThreeJS, parseWithThreeJS]);

  const jumpToLine = useCallback((lineIndex) => {
    if (lineIndex < 0 || lineIndex >= gcodeLines.length) return;
    
    setCurrentLine(lineIndex);
    setIsAnimating(false);
    
    const partialGcode = gcodeLines.slice(0, lineIndex + 1).join('\n');
    
    if (useThreeJS) {
      parseWithThreeJS(partialGcode, lineIndex);
    } else if (preview) {
      preview.clear();
      preview.processGCode(partialGcode);
    }
  }, [gcodeLines, useThreeJS, preview, parseWithThreeJS]);

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
            {useThreeJS && (
              <div style={{ color: '#00D9FF', fontSize: '10px', marginTop: '4px' }}>
                ⚡ Three.js Renderer (Enhanced Colors)
              </div>
            )}
            {gcodeBounds && (
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', marginTop: '4px' }}>
                Size: {gcodeBounds.sizeX.toFixed(1)} × {gcodeBounds.sizeY.toFixed(1)} × {gcodeBounds.sizeZ.toFixed(1)} mm
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
                      backgroundColor: actualIndex === currentLine ? 'rgba(0, 217, 255, 0.2)' : 
                                       actualIndex < currentLine && viewMode === 'line' ? 'rgba(100, 100, 100, 0.1)' : 
                                       'transparent',
                      borderLeft: actualIndex === currentLine ? '3px solid #00D9FF' : '3px solid transparent',
                      color: actualIndex === currentLine ? '#00D9FF' : 
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
              backgroundColor: viewMode === 'line' ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
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
            border: '1px solid rgba(0, 217, 255, 0.3)',
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
                  backgroundColor: 'rgba(0, 217, 255, 0.2)',
                  border: '1px solid rgba(0, 217, 255, 0.4)',
                  borderRadius: '6px',
                  color: '#00D9FF',
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
                    background: `linear-gradient(to right, #00D9FF 0%, #00D9FF ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) ${(currentLine / (gcodeLines.length - 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
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

        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '20px 30px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 217, 255, 0.3)',
            zIndex: 20
          }}>
            Loading G-code... {loadProgress}%
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
          background: #00D9FF;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00D9FF;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
        }

        div::-webkit-scrollbar {
          width: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(0, 217, 255, 0.3);
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 217, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default GCodeViewer;