

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as GCodePreview from "gcode-preview";
import { Play, Pause, RotateCcw, ChevronRight, Layers } from "lucide-react";

const RAPID_TRAVEL_COLOR = "#8BB4CC";
const EXTRUSION_COLORS = [
  "#5C6E7A", "#4A5C66", "#627080", "#536170",
  "#4E6070", "#5A6B78", "#486070", "#506878",
];

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

  // Layer-aware state
  const [gcodeLines, setGcodeLines] = useState([]);       // all optimized lines
  const [layerEndIndices, setLayerEndIndices] = useState([]); // gcodeLines index where each layer ends
  const [currentLayer, setCurrentLayer] = useState(0);    // 0-based layer index
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState('full');        // 'full' | 'layer'
  const [showSidebar, setShowSidebar] = useState(true);

  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const lastProcessedGcodeRef = useRef(null);
  const savedCameraRef = useRef(null);

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const saveCameraState = useCallback((p) => {
    if (!p?.camera) return;
    savedCameraRef.current = {
      position: p.camera.position.clone(),
      target: p.controls?.target?.clone?.() ?? null,
    };
  }, []);

  const restoreCameraState = useCallback((p) => {
    if (!p?.camera || !savedCameraRef.current) return;
    const { position, target } = savedCameraRef.current;
    p.camera.position.copy(position);
    if (target && p.controls?.target) p.controls.target.copy(target);
    p.controls?.update?.();
  }, []);

  // ── Parse gcode into layers ─────────────────────────────────────────────────
  // Keeps all executable lines; records the last line-index of each layer
  // based on ;LAYER_CHANGE comments in the raw text.
  const parseGCodeLayers = useCallback((gcodeText) => {
    if (!gcodeText) return { lines: [], layerEndIndices: [] };

    const rawLines = gcodeText.split('\n');
    const optimized = [];
    const ends = [];          // index of last line belonging to each layer
    let inLayer = false;      // have we seen at least one ;LAYER_CHANGE?

    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i].trim();

      // Layer boundary marker
      if (raw.toUpperCase().startsWith(';LAYER_CHANGE')) {
        if (inLayer && optimized.length > 0) {
          // Close the previous layer at the current last line
          ends.push(optimized.length - 1);
        }
        inLayer = true;
        continue; // don't add the comment itself
      }

      // Skip blank lines and other comments
      if (!raw || raw.startsWith(';') || (raw.startsWith('(') && raw.endsWith(')'))) {
        continue;
      }

      const semi = raw.indexOf(';');
      const clean = semi !== -1 ? raw.substring(0, semi).trim() : raw;
      if (clean.length > 0) optimized.push(clean);
    }

    // Close the final layer
    if (optimized.length > 0) {
      ends.push(optimized.length - 1);
    }

    // If no ;LAYER_CHANGE markers found, treat the whole file as one layer
    if (ends.length === 0 && optimized.length > 0) {
      ends.push(optimized.length - 1);
    }

    return { lines: optimized, layerEndIndices: ends };
  }, []);

  // ── Derived: line index of the end of currentLayer ──────────────────────────
  const currentEndLine = useMemo(() => {
    if (layerEndIndices.length === 0) return 0;
    return layerEndIndices[Math.min(currentLayer, layerEndIndices.length - 1)];
  }, [currentLayer, layerEndIndices]);

  const totalLayers = layerEndIndices.length;

  // ── Initialize canvas (once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    try {
      const instance = GCodePreview.init({
        canvas,
        extrusionColor: EXTRUSION_COLORS,
        travelColor: RAPID_TRAVEL_COLOR,
        buildVolume,
        backgroundColor,
        allowDragNDrop: false,
        lineWidth: 4,
        renderTravels: true,
        renderExtrusion: true,
        startLayer: 0,
        endLayer: Infinity,
        topLayerColor: "#B0C4D8",
        lastSegmentColor: "#E8D44D",
        renderAxes: true,
        axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
        renderBuildVolume: true,
        onProgress: (p) => {
          setLoadProgress(Math.round(p * 100));
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
          const r = containerRef.current.getBoundingClientRect();
          canvasRef.current.width = r.width;
          canvasRef.current.height = r.height;
        }
      }, 250);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ── Process gcode when it changes ──────────────────────────────────────────
  useEffect(() => {
    if (!preview || !gcode) return;
    if (lastProcessedGcodeRef.current === gcode) return;

    lastProcessedGcodeRef.current = gcode;
    setIsLoading(true);
    setLoadProgress(0);
    setCurrentLayer(0);
    setIsAnimating(false);
    savedCameraRef.current = null;

    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

    const { lines, layerEndIndices: ends } = parseGCodeLayers(gcode);
    setGcodeLines(lines);
    setLayerEndIndices(ends);

    processingTimeoutRef.current = setTimeout(() => {
      try {
        preview.clear();
        preview.processGCode(lines.join('\n'));
      } catch (err) {
        console.error("Error processing G-code:", err);
        setIsLoading(false);
        onError?.(err);
      }
    }, 300);
  }, [gcode]);

  // ── Layer animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!preview || !isAnimating || viewMode !== 'layer' || totalLayers === 0) return;

    const FRAME_TIME = 300; // ms per layer step

    const animate = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current < FRAME_TIME) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastUpdateRef.current = now;

      setCurrentLayer(prev => {
        const next = prev + 1;
        if (next >= totalLayers) {
          setIsAnimating(false);
          return totalLayers - 1;
        }

        const endLine = layerEndIndices[next];
        try {
          saveCameraState(preview);
          preview.clear();
          preview.processGCode(gcodeLines.slice(0, endLine + 1).join('\n'));
          restoreCameraState(preview);
        } catch (e) {
          console.error("Layer animate error:", e);
        }

        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isAnimating, viewMode, totalLayers, layerEndIndices, gcodeLines, saveCameraState, restoreCameraState]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (!preview?.camera) return;
    preview.camera.position.set(buildVolume.x * 1.5, buildVolume.y * 1.5, buildVolume.z * 1.5);
    if (preview.controls?.target) {
      preview.controls.target.set(buildVolume.x / 2, buildVolume.y / 2, buildVolume.z / 2);
    }
    preview.controls?.update?.();
    savedCameraRef.current = null;
  }, [preview, buildVolume]);

  const jumpToLayer = useCallback((layerIndex) => {
    if (!preview || layerIndex < 0 || layerIndex >= totalLayers) return;
    setCurrentLayer(layerIndex);
    setIsAnimating(false);

    const endLine = layerEndIndices[layerIndex];
    saveCameraState(preview);
    preview.clear();
    preview.processGCode(gcodeLines.slice(0, endLine + 1).join('\n'));
    restoreCameraState(preview);
  }, [preview, gcodeLines, layerEndIndices, totalLayers, saveCameraState, restoreCameraState]);

  const toggleViewMode = useCallback(() => {
    if (!preview || totalLayers === 0) return;
    const newMode = viewMode === 'full' ? 'layer' : 'full';
    setViewMode(newMode);
    setIsAnimating(false);
    savedCameraRef.current = null;

    if (newMode === 'full') {
      preview.clear();
      preview.processGCode(gcodeLines.join('\n'));
    } else {
      setCurrentLayer(0);
      preview.clear();
      preview.processGCode(gcodeLines.slice(0, layerEndIndices[0] + 1).join('\n'));
    }
  }, [preview, gcodeLines, layerEndIndices, viewMode, totalLayers]);

  const toggleAnimation = useCallback(() => {
    if (viewMode !== 'layer') return;
    if (currentLayer >= totalLayers - 1) {
      jumpToLayer(0);
    }
    setIsAnimating(a => !a);
  }, [viewMode, currentLayer, totalLayers, jumpToLayer]);

  const handleSliderChange = useCallback((e) => {
    jumpToLayer(parseInt(e.target.value));
  }, [jumpToLayer]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', width: '100%', height: '600px', backgroundColor: '#0a0a0a', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>

      {/* ── Sidebar ── */}
      {showSidebar && totalLayers > 0 && (
        <div style={{ width: '240px', height: '100%', backgroundColor: '#1a1a1a', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <Layers size={18} />
              <span style={{ fontWeight: 'bold' }}>Layers</span>
            </div>
            <button onClick={() => setShowSidebar(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}>✕</button>
          </div>

          {/* Stats */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#111' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '4px' }}>
              Total Layers: <span style={{ color: 'white', fontWeight: 'bold' }}>{totalLayers}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '4px' }}>
              Total Lines: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{gcodeLines.length.toLocaleString()}</span>
            </div>
            {viewMode === 'layer' && (
              <div style={{ color: '#FFD700', fontSize: '11px' }}>
                Showing: Layer {currentLayer + 1} of {totalLayers}
              </div>
            )}
          </div>

          {/* Legend */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '14px', fontSize: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: RAPID_TRAVEL_COLOR, borderRadius: 2 }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Rapid (G0)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: EXTRUSION_COLORS[0], borderRadius: 2 }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Extrusion</span>
            </div>
          </div>

          {/* Layer list */}
          <div style={{ flex: 1, overflowY: 'auto', fontSize: '12px' }}>
            {layerEndIndices.map((endIdx, layerIdx) => {
              const startIdx = layerIdx === 0 ? 0 : layerEndIndices[layerIdx - 1] + 1;
              const lineCount = endIdx - startIdx + 1;
              const isActive = layerIdx === currentLayer && viewMode === 'layer';
              const isPast = layerIdx < currentLayer && viewMode === 'layer';

              return (
                <div
                  key={layerIdx}
                  onClick={() => { if (viewMode === 'layer') jumpToLayer(layerIdx); }}
                  style={{
                    padding: '8px 16px',
                    cursor: viewMode === 'layer' ? 'pointer' : 'default',
                    backgroundColor: isActive ? 'rgba(255,215,0,0.15)' : isPast ? 'rgba(255,255,255,0.03)' : 'transparent',
                    borderLeft: isActive ? '3px solid #FFD700' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Layer colour swatch */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isActive ? '#FFD700' : isPast ? 'rgba(255,255,255,0.25)' : EXTRUSION_COLORS[layerIdx % EXTRUSION_COLORS.length], flexShrink: 0 }} />
                    <span style={{ color: isActive ? '#FFD700' : isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)', fontWeight: isActive ? 'bold' : 'normal' }}>
                      Layer {layerIdx + 1}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                    {lineCount} lines
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Canvas area ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>

        {/* Loading overlay */}
        {/* {isLoading && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '12px', zIndex: 20 }}>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Parsing G-Code...</div>
            <div style={{ width: '200px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
              <div style={{ width: `${loadProgress}%`, height: '100%', backgroundColor: '#8BB4CC', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '12px', opacity: 0.6 }}>{loadProgress}%</div>
          </div>
        )} */}

        {/* Show sidebar button */}
        {!showSidebar && totalLayers > 0 && (
          <button onClick={() => setShowSidebar(true)} style={{ position: 'absolute', top: '16px', left: '16px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <ChevronRight size={18} />
            Layers
          </button>
        )}

        {/* Top-right buttons */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
          <button onClick={handleReset} style={{ padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)' }}>
            <RotateCcw size={18} /> Reset
          </button>

          <button
            onClick={toggleViewMode}
            disabled={totalLayers === 0}
            style={{ padding: '10px', backgroundColor: viewMode === 'layer' ? 'rgba(139,180,204,0.2)' : 'rgba(255,255,255,0.1)', border: `1px solid ${viewMode === 'layer' ? 'rgba(139,180,204,0.5)' : 'rgba(255,255,255,0.2)'}`, borderRadius: '6px', color: 'white', cursor: totalLayers === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)', opacity: totalLayers === 0 ? 0.5 : 1 }}
          >
            <Layers size={18} />
            {viewMode === 'full' ? 'Animate' : 'Full'}
          </button>
        </div>

        {/* ── Layer playback bar ── */}
        {viewMode === 'layer' && totalLayers > 0 && (
          <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 24px', backdropFilter: 'blur(10px)', minWidth: '420px', maxWidth: '620px', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={toggleAnimation} style={{ padding: '8px', backgroundColor: 'rgba(139,180,204,0.2)', border: '1px solid rgba(139,180,204,0.4)', borderRadius: '6px', color: '#8BB4CC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isAnimating ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="0"
                  max={totalLayers - 1}
                  value={currentLayer}
                  onChange={handleSliderChange}
                  style={{ width: '100%', height: '6px', borderRadius: '3px', outline: 'none', background: `linear-gradient(to right, #8BB4CC 0%, #8BB4CC ${(currentLayer / Math.max(totalLayers - 1, 1)) * 100}%, rgba(255,255,255,0.2) ${(currentLayer / Math.max(totalLayers - 1, 1)) * 100}%, rgba(255,255,255,0.2) 100%)` }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                  <span style={{ color: '#FFD700', fontWeight: 'bold' }}>Layer {currentLayer + 1} / {totalLayers}</span>
                  <span>{gcodeLines.slice(0, currentEndLine + 1).length.toLocaleString()} lines rendered</span>
                  <span>{((currentLayer / Math.max(totalLayers - 1, 1)) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        input[type="range"] { -webkit-appearance: none; appearance: none; cursor: pointer; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #8BB4CC; cursor: pointer; box-shadow: 0 0 10px rgba(139,180,204,0.5); }
        input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #8BB4CC; cursor: pointer; border: none; }
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        div::-webkit-scrollbar-thumb { background: rgba(139,180,204,0.25); border-radius: 3px; }
        div::-webkit-scrollbar-thumb:hover { background: rgba(139,180,204,0.45); }
      `}</style>
    </div>
  );
};

export default GCodeViewer;