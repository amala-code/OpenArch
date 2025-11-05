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