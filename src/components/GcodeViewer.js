

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as GCodePreview from "gcode-preview";
import { Play, Pause, RotateCcw, ChevronRight, Layers } from "lucide-react";

const RAPID_TRAVEL_COLOR = "#8BB4CC";
const EXTRUSION_COLORS = [
  "#5C6E7A", "#4A5C66", "#627080", "#536170",
  "#4E6070", "#5A6B78", "#486070", "#506878",
];
const THREE_COLORS = ["#00D9FF","#FF6B35","#FFD700","#7FFF00","#FF1493","#00FFD1","#FFA500","#8A2BE2"];

// Returns true if the gcode has E (extrusion) values — if not, Three.js is used
function detectExtrusion(text) {
  const lines = text.split('\n');
  for (let i = 0; i < Math.min(300, lines.length); i++) {
    if (/ E[\d.-]/.test(lines[i])) return true;
  }
  return false;
}

const GCodeViewer = ({
  gcode,
  buildVolume = { x: 200, y: 200, z: 200 },
  backgroundColor = "#0a0a0a",
  onProgress,
  onFinishLoading,
  onError,
}) => {
  const canvasRef      = useRef(null); // gcode-preview canvas
  const threeCanvasRef = useRef(null); // Three.js canvas — separate to avoid WebGL context conflict
  const containerRef   = useRef(null);
  const [preview, setPreview]               = useState(null);
  const [activeRenderer, setActiveRenderer] = useState('gcode'); // 'gcode' | 'three'
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const processingTimeoutRef = useRef(null);

  // Layer-aware state
  const [gcodeLines, setGcodeLines] = useState([]);
  const [layerEndIndices, setLayerEndIndices] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [showSidebar, setShowSidebar] = useState(true);

  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const lastProcessedGcodeRef = useRef(null);
  const savedCameraRef = useRef(null);

  // Three.js refs (used when gcode has no E values)
  const useThreeRef = useRef(false);
  const threeSceneRef = useRef(null);
  const threeCameraRef = useRef(null);
  const threeRendererRef = useRef(null);
  const threeControlsRef = useRef(null);
  const threeGroupRef = useRef(null);
  const threeRafRef = useRef(null);

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

  // Store THREE module so we only import it once
  const THREERef = useRef(null);
  const gcodeFullBoundsRef = useRef(null); // bounds from the first full render

  const getThree = useCallback(async () => {
    if (THREERef.current) return THREERef.current;
    const THREE = await import('three');
    THREERef.current = THREE;
    return THREE;
  }, []);

  // ── Three.js init (called once when needed) ─────────────────────────────
  const initThreeJS = useCallback(async () => {
    if (threeSceneRef.current) return true;
    try {
      const THREE = await getThree();
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
      const canvas = threeCanvasRef.current;
      const rect = containerRef.current.getBoundingClientRect();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f0f1a);
      threeSceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.01, 50000);
      threeCameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setSize(rect.width, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      threeRendererRef.current = renderer;

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      threeControlsRef.current = controls;

      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const dl = new THREE.DirectionalLight(0xffffff, 0.6);
      dl.position.set(0, 1, 0);
      scene.add(dl);

      const loop = () => {
        threeRafRef.current = requestAnimationFrame(loop);
        controls.update();
        renderer.render(scene, camera);
      };
      loop();
      return true;
    } catch (e) {
      console.error("Three.js init failed:", e);
      return false;
    }
  }, [getThree]);

  // ── Fit camera to bounds — called only when not preserving camera ────────
  const fitCamera = useCallback((bounds) => {
    if (!threeCameraRef.current || !threeControlsRef.current) return;
    const { minX, maxX, minY, maxY } = bounds;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    // FOV-based distance so the object fills ~80% of view
    const fovRad = (threeCameraRef.current.fov * Math.PI) / 180;
    const dist = (Math.max(sizeX, sizeY) / 2) / Math.tan(fovRad / 2) * 1.2;

    // Position camera above, looking straight down at center
    threeCameraRef.current.position.set(cx, dist, cy);
    threeControlsRef.current.target.set(cx, 0, cy);
    threeControlsRef.current.update();
  }, []);

  // ── Three.js render a slice of gcode lines ──────────────────────────────
  const threeRender = useCallback(async (lines, preserveCamera = false) => {
    const ok = await initThreeJS();
    if (!ok) return;

    const THREE = await getThree();
    const scene = threeSceneRef.current;

    // Remove old gcode group
    if (threeGroupRef.current) {
      scene.remove(threeGroupRef.current);
      threeGroupRef.current.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); });
    }
    // Remove old grid (rebuild after we know bounds)
    scene.children
      .filter(c => c.isGridHelper || c.isAxesHelper)
      .forEach(c => scene.remove(c));

    const group = new THREE.Group();
    threeGroupRef.current = group;

    let cx=0, cy=0, cz=0;
    let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
    const pts=[], cols=[];
    let laserOn = true;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith(';')) continue;
      if (line.startsWith('M80')) { laserOn = true; continue; }
      if (line.startsWith('M81')) { laserOn = false; continue; }
      if (!line.startsWith('G0') && !line.startsWith('G1')) continue;

      const parts = line.split(/\s+/);
      let nx=cx, ny=cy, nz=cz, hasCoord=false;
      for (const p of parts) {
        if (p[0]==='X') { nx=parseFloat(p.slice(1)); hasCoord=true; }
        if (p[0]==='Y') { ny=parseFloat(p.slice(1)); hasCoord=true; }
        if (p[0]==='Z') { nz=parseFloat(p.slice(1)); hasCoord=true; }
      }
      if (!hasCoord) continue;

      // Map: GCode X→X, GCode Y→Z (Three.js), GCode Z→Y (height in Three.js)
      minX = Math.min(minX, cx, nx);
      maxX = Math.max(maxX, cx, nx);
      minY = Math.min(minY, cy, ny);
      maxY = Math.max(maxY, cy, ny);

      if (laserOn && (nx!==cx || ny!==cy || nz!==cz)) {
        // Color by Z layer height
        const layerColor = THREE_COLORS[Math.round(nz * 1000) % THREE_COLORS.length];
        const c = new THREE.Color(layerColor);
        pts.push(new THREE.Vector3(cx, nz * 100, cy), new THREE.Vector3(nx, nz * 100, ny));
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
      cx=nx; cy=ny; cz=nz;
    }

    if (pts.length > 0) {
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
        vertexColors: true, linewidth: 1.5,
      })));
    }
    scene.add(group);

    // Add grid fitted to bounds
    if (isFinite(maxX)) {
      const bounds = { minX, maxX, minY, maxY };
      // Save bounds on first (full) render so we can reuse for layer renders
      if (!gcodeFullBoundsRef.current) gcodeFullBoundsRef.current = bounds;

      const useBounds = gcodeFullBoundsRef.current;
      const gridCx = (useBounds.minX + useBounds.maxX) / 2;
      const gridCy = (useBounds.minY + useBounds.maxY) / 2;
      const gridSize = Math.max(useBounds.maxX - useBounds.minX, useBounds.maxY - useBounds.minY) * 1.3;
      const grid = new THREE.GridHelper(gridSize, 20, 0x334455, 0x1a2530);
      grid.position.set(gridCx, -0.1, gridCy);
      scene.add(grid);
      scene.add(new THREE.AxesHelper(gridSize * 0.15));

      if (!preserveCamera) {
        fitCamera(useBounds);
      }
    }
  }, [initThreeJS, getThree, fitCamera]);

  // ── Save / restore camera for Three.js ──────────────────────────────────
  const saveThreeCamera = useCallback(() => {
    if (!threeCameraRef.current) return;
    savedCameraRef.current = {
      pos: threeCameraRef.current.position.clone(),
      target: threeControlsRef.current?.target.clone(),
    };
  }, []);

  const restoreThreeCamera = useCallback(() => {
    if (!savedCameraRef.current || !threeCameraRef.current) return;
    threeCameraRef.current.position.copy(savedCameraRef.current.pos);
    if (savedCameraRef.current.target && threeControlsRef.current)
      threeControlsRef.current.target.copy(savedCameraRef.current.target);
    threeControlsRef.current?.update();
  }, []);

  // ── Parse gcode into layers ─────────────────────────────────────────────────
  const parseGCodeLayers = useCallback((gcodeText) => {
    if (!gcodeText) return { lines: [], layerEndIndices: [] };

    const rawLines = gcodeText.split('\n');
    const optimized = [];
    const ends = [];
    let inLayer = false;

    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i].trim();

      if (raw.toUpperCase().startsWith(';LAYER_CHANGE')) {
        if (inLayer && optimized.length > 0) {
          ends.push(optimized.length - 1);
        }
        inLayer = true;
        continue;
      }

      if (!raw || raw.startsWith(';') || (raw.startsWith('(') && raw.endsWith(')'))) {
        continue;
      }

      const semi = raw.indexOf(';');
      const clean = semi !== -1 ? raw.substring(0, semi).trim() : raw;
      if (clean.length > 0) optimized.push(clean);
    }

    if (optimized.length > 0) {
      ends.push(optimized.length - 1);
    }

    if (ends.length === 0 && optimized.length > 0) {
      ends.push(optimized.length - 1);
    }

    return { lines: optimized, layerEndIndices: ends };
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentEndLine = useMemo(() => {
    if (layerEndIndices.length === 0) return 0;
    return layerEndIndices[Math.min(currentLayer, layerEndIndices.length - 1)];
  }, [currentLayer, layerEndIndices]);

  const totalLayers = layerEndIndices.length;

  // ── Initialize canvas (once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas    = canvasRef.current;
    const container = containerRef.current;
    const rect      = container.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    if (threeCanvasRef.current) {
      threeCanvasRef.current.width  = rect.width;
      threeCanvasRef.current.height = rect.height;
    }

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
          if (threeCanvasRef.current) {
            threeCanvasRef.current.width = r.width;
            threeCanvasRef.current.height = r.height;
          }
          if (threeRendererRef.current && threeCameraRef.current) {
            threeCameraRef.current.aspect = r.width / r.height;
            threeCameraRef.current.updateProjectionMatrix();
            threeRendererRef.current.setSize(r.width, r.height);
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
      if (threeRafRef.current) cancelAnimationFrame(threeRafRef.current);
      threeRendererRef.current?.dispose();
    };
  }, []);

  // ── Process gcode when it changes ──────────────────────────────────────────
  useEffect(() => {
    if (!gcode) return;
    if (lastProcessedGcodeRef.current === gcode) return;

    lastProcessedGcodeRef.current = gcode;
    setIsLoading(true);
    setLoadProgress(0);
    setCurrentLayer(0);
    setIsAnimating(false);
    savedCameraRef.current = null;
    gcodeFullBoundsRef.current = null; // reset so camera fits to new file

    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

    const { lines, layerEndIndices: ends } = parseGCodeLayers(gcode);
    setGcodeLines(lines);
    setLayerEndIndices(ends);

    const hasE = detectExtrusion(gcode);
    useThreeRef.current = !hasE;

    if (!hasE) {
      // No extrusion values — use Three.js renderer
      setActiveRenderer('three');
      processingTimeoutRef.current = setTimeout(async () => {
        await threeRender(lines);
        setIsLoading(false);
        setLoadProgress(100);
        onFinishLoading?.({ totalLines: lines.length });
      }, 300);
    } else {
      // Standard extrusion gcode — use gcode-preview
      setActiveRenderer('gcode');
      if (!preview) return;
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
    }
  }, [gcode, preview, threeRender]);

  // ── Layer animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAnimating || viewMode !== 'layer' || totalLayers === 0) return;
    if (!useThreeRef.current && !preview) return;

    const FRAME_TIME = 300;

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

        const slice = gcodeLines.slice(0, layerEndIndices[next] + 1);
        try {
          if (useThreeRef.current) {
            saveThreeCamera();
            threeRender(slice, true).then(restoreThreeCamera);
          } else {
            saveCameraState(preview);
            preview.clear();
            preview.processGCode(slice.join('\n'));
            restoreCameraState(preview);
          }
        } catch (e) { console.error("Layer animate error:", e); }

        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isAnimating, viewMode, totalLayers, layerEndIndices, gcodeLines, preview, threeRender, saveCameraState, restoreCameraState, saveThreeCamera, restoreThreeCamera]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    savedCameraRef.current = null;
    if (useThreeRef.current) {
      if (gcodeLines.length > 0) threeRender(gcodeLines);
    } else if (preview?.camera) {
      preview.camera.position.set(buildVolume.x * 1.5, buildVolume.y * 1.5, buildVolume.z * 1.5);
      if (preview.controls?.target) preview.controls.target.set(buildVolume.x / 2, buildVolume.y / 2, buildVolume.z / 2);
      preview.controls?.update?.();
    }
  }, [preview, buildVolume, gcodeLines, threeRender]);

  const jumpToLayer = useCallback((layerIndex) => {
    if (layerIndex < 0 || layerIndex >= totalLayers) return;
    // Always switch to layer mode when clicking a layer
    setViewMode('layer');
    setCurrentLayer(layerIndex);
    setIsAnimating(false);

    const slice = gcodeLines.slice(0, layerEndIndices[layerIndex] + 1);
    if (useThreeRef.current) {
      saveThreeCamera();
      threeRender(slice, true).then(restoreThreeCamera);
    } else if (preview) {
      saveCameraState(preview);
      preview.clear();
      preview.processGCode(slice.join('\n'));
      restoreCameraState(preview);
    }
  }, [preview, gcodeLines, layerEndIndices, totalLayers, saveCameraState, restoreCameraState, threeRender, saveThreeCamera, restoreThreeCamera]);

  const toggleViewMode = useCallback(() => {
    if (totalLayers === 0) return;
    if (!useThreeRef.current && !preview) return;
    const newMode = viewMode === 'full' ? 'layer' : 'full';
    setViewMode(newMode);
    setIsAnimating(false);

    if (newMode === 'full') {
      if (useThreeRef.current) threeRender(gcodeLines, true);
      else { preview.clear(); preview.processGCode(gcodeLines.join('\n')); }
    } else {
      setCurrentLayer(0);
      const slice = gcodeLines.slice(0, layerEndIndices[0] + 1);
      if (useThreeRef.current) threeRender(slice, true);
      else { preview.clear(); preview.processGCode(slice.join('\n')); }
    }
  }, [preview, gcodeLines, layerEndIndices, viewMode, totalLayers, threeRender]);

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

      {showSidebar && totalLayers > 0 && (
        <div style={{ width: '240px', height: '100%', backgroundColor: '#1a1a1a', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a0a0a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <Layers size={18} />
              <span style={{ fontWeight: 'bold' }}>Layers</span>
            </div>
            <button onClick={() => setShowSidebar(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}>✕</button>
          </div>

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

          <div style={{ flex: 1, overflowY: 'auto', fontSize: '12px' }}>
            {layerEndIndices.map((endIdx, layerIdx) => {
              const startIdx = layerIdx === 0 ? 0 : layerEndIndices[layerIdx - 1] + 1;
              const lineCount = endIdx - startIdx + 1;
              const isActive = layerIdx === currentLayer && viewMode === 'layer';
              const isPast = layerIdx < currentLayer && viewMode === 'layer';

              return (
                <div
                  key={layerIdx}
                  onClick={() => jumpToLayer(layerIdx)}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(255,215,0,0.15)' : isPast ? 'rgba(255,255,255,0.03)' : 'transparent',
                    borderLeft: isActive ? '3px solid #FFD700' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(139,180,204,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? 'rgba(255,215,0,0.15)' : isPast ? 'rgba(255,255,255,0.03)' : 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* gcode-preview canvas — hidden when Three.js is active */}
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, visibility: activeRenderer === 'gcode' ? 'visible' : 'hidden' }}
          />
          {/* Three.js canvas — hidden when gcode-preview is active */}
          <canvas
            ref={threeCanvasRef}
            style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, visibility: activeRenderer === 'three' ? 'visible' : 'hidden' }}
          />
        </div>

        {/* {isLoading && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', gap: '12px', zIndex: 20 }}>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Parsing G-Code...</div>
            <div style={{ width: '200px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
              <div style={{ width: `${loadProgress}%`, height: '100%', backgroundColor: '#8BB4CC', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '12px', opacity: 0.6 }}>{loadProgress}%</div>
          </div>
        )} */}

        {!showSidebar && totalLayers > 0 && (
          <button onClick={() => setShowSidebar(true)} style={{ position: 'absolute', top: '16px', left: '16px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)', zIndex: 10 }}>
            <ChevronRight size={18} /> Layers
          </button>
        )}

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