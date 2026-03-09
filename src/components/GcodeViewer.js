import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as GCodePreview from "gcode-preview";
import { Play, Pause, RotateCcw, ChevronRight, Layers } from "lucide-react";

const RAPID_TRAVEL_COLOR = "#8BB4CC";
const EXTRUSION_COLORS = [
  "#5C6E7A", "#4A5C66", "#627080", "#536170",
  "#4E6070", "#5A6B78", "#486070", "#506878",
];
const THREE_CUT_COLORS = [
  "#00D9FF","#FF6B35","#FFD700","#7FFF00",
  "#FF1493","#00FFD1","#FFA500","#8A2BE2",
  "#39FF14","#FF073A","#0FF0FC","#FFBF00",
];

function detectExtrusion(text) {
  const lines = text.split('\n');
  for (let i = 0; i < Math.min(300, lines.length); i++) {
    if (/ E[\d.-]/.test(lines[i])) return true;
  }
  return false;
}

// ── Parse one gcode line, return { cmd, x, y, z, hasMove } ─────────────────
function parseLine(raw) {
  const line = raw.trim();
  if (!line || line[0] === ';' || line[0] === '(' ) return null;
  const semiIdx = line.indexOf(';');
  const clean = semiIdx !== -1 ? line.slice(0, semiIdx).trim() : line;
  if (!clean) return null;

  const parts = clean.split(/\s+/);
  const cmd = parts[0].toUpperCase();
  const result = { cmd, x: null, y: null, z: null, hasMove: false };

  for (let i = 1; i < parts.length; i++) {
    const ch = parts[i][0]?.toUpperCase();
    const val = parseFloat(parts[i].slice(1));
    if (isNaN(val)) continue;
    if (ch === 'X') { result.x = val; result.hasMove = true; }
    if (ch === 'Y') { result.y = val; result.hasMove = true; }
    if (ch === 'Z') { result.z = val; result.hasMove = true; }
  }
  return result;
}

const GCodeViewer = ({
  gcode,
  buildVolume = { x: 200, y: 200, z: 200 },
  backgroundColor = "#0a0a0a",
  onProgress,
  onFinishLoading,
  onError,
}) => {
  const canvasRef      = useRef(null);
  const threeCanvasRef = useRef(null);
  const containerRef   = useRef(null);
  const [preview, setPreview]               = useState(null);
  const [activeRenderer, setActiveRenderer] = useState('gcode');
  const [loadProgress, setLoadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const processingTimeoutRef = useRef(null);

  const [gcodeLines, setGcodeLines] = useState([]);
  const [layerEndIndices, setLayerEndIndices] = useState([]);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [showSidebar, setShowSidebar] = useState(true);

  const animationRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const lastProcessedGcodeRef = useRef(null);

  const useThreeRef = useRef(false);
  const threeSceneRef = useRef(null);
  const threeCameraRef = useRef(null);
  const threeRendererRef = useRef(null);
  const threeControlsRef = useRef(null);
  const threeGroupRef = useRef(null);
  const threeRafRef = useRef(null);
  const THREERef = useRef(null);
  const gcodeFullBoundsRef = useRef(null);
  // saved camera for preserve-camera renders
  const savedThreeCamRef = useRef(null);

  // ── Get THREE (import once) ─────────────────────────────────────────────
  const getThree = useCallback(async () => {
    if (THREERef.current) return THREERef.current;
    const THREE = await import('three');
    THREERef.current = THREE;
    return THREE;
  }, []);

  // ── Three.js init ────────────────────────────────────────────────────────
  const initThreeJS = useCallback(async () => {
    if (threeSceneRef.current) return true;
    try {
      const THREE = await getThree();
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
      const canvas = threeCanvasRef.current;
      const rect = containerRef.current.getBoundingClientRect();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a12);
      threeSceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.01, 500000);
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
      const dl = new THREE.DirectionalLight(0xffffff, 0.5);
      dl.position.set(1, 2, 1);
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

  // ── Fit camera top-down to bounds ────────────────────────────────────────
  const fitCamera = useCallback((bounds) => {
    const cam = threeCameraRef.current;
    const ctrl = threeControlsRef.current;
    if (!cam || !ctrl) return;

    const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;   // GCode Y → Three.js Z
    const cz = (minZ + maxZ) / 2;   // GCode Z → Three.js Y (height)

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const spanZ = maxZ - minZ || 0;
    const maxSpan = Math.max(spanX, spanY);

    const fovRad = (cam.fov * Math.PI) / 180;
    const dist = (maxSpan / 2) / Math.tan(fovRad / 2) * 1.4;

    // Position camera above center, slightly angled for depth
    cam.position.set(cx, dist + cz, cy - maxSpan * 0.3);
    ctrl.target.set(cx, cz, cy);
    ctrl.update();
  }, []);

  // ── Save / restore Three.js camera ──────────────────────────────────────
  const saveThreeCamera = useCallback(() => {
    if (!threeCameraRef.current) return;
    savedThreeCamRef.current = {
      pos: threeCameraRef.current.position.clone(),
      target: threeControlsRef.current?.target.clone(),
    };
  }, []);

  const restoreThreeCamera = useCallback(() => {
    const saved = savedThreeCamRef.current;
    const cam = threeCameraRef.current;
    const ctrl = threeControlsRef.current;
    if (!saved || !cam) return;
    cam.position.copy(saved.pos);
    if (saved.target && ctrl) ctrl.target.copy(saved.target);
    ctrl?.update();
  }, []);

  // ── Core Three.js render ─────────────────────────────────────────────────
  const threeRender = useCallback(async (lines, preserveCamera = false) => {
    const ok = await initThreeJS();
    if (!ok) return;

    const THREE = await getThree();
    const scene = threeSceneRef.current;

    // Remove old gcode group and helpers
    if (threeGroupRef.current) {
      scene.remove(threeGroupRef.current);
      threeGroupRef.current.traverse(c => {
        c.geometry?.dispose();
        if (c.material) {
          Array.isArray(c.material)
            ? c.material.forEach(m => m.dispose())
            : c.material.dispose();
        }
      });
    }
    // Remove old grid / axes
    const toRemove = scene.children.filter(c => c.userData.isHelper);
    toRemove.forEach(c => scene.remove(c));

    const group = new THREE.Group();
    threeGroupRef.current = group;

    // ── Parse all moves ────────────────────────────────────────────────────
    let cx = 0, cy = 0, cz = 0;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    // Segment buffers: separate travel (G0) from cut (G1) per Z-layer
    const travelPositions = [];         // G0 moves (always grey-blue)
    const cutByLayer = new Map();       // layerKey → Float32Array positions
    let layerKey = 0;                   // increments on Z change
    let prevZ = null;
    let laserOn = true;

    for (const raw of lines) {
      const p = parseLine(raw);
      if (!p) continue;

      const cmd = p.cmd;

      // Laser on/off (for laser cutters)
      if (cmd === 'M80' || cmd === 'M3' || cmd === 'M03') { laserOn = true; continue; }
      if (cmd === 'M81' || cmd === 'M5' || cmd === 'M05') { laserOn = false; continue; }

      const isG0 = cmd === 'G0' || cmd === 'G00';
      const isG1 = cmd === 'G1' || cmd === 'G01';
      if (!isG0 && !isG1) continue;
      if (!p.hasMove) continue;

      const nx = p.x !== null ? p.x : cx;
      const ny = p.y !== null ? p.y : cy;
      const nz = p.z !== null ? p.z : cz;

      // Skip zero-length moves
      if (nx === cx && ny === cy && nz === cz) continue;

      // Track bounds (GCode X, Y)
      minX = Math.min(minX, cx, nx);
      maxX = Math.max(maxX, cx, nx);
      minY = Math.min(minY, cy, ny);
      maxY = Math.max(maxY, cy, ny);

      // Track Z for layer key and height bounds
      if (nz !== prevZ && prevZ !== null) {
        layerKey++;
        minZ = Math.min(minZ, nz);
        maxZ = Math.max(maxZ, nz);
      }
      if (prevZ === null) {
        minZ = Math.min(minZ, cz, nz);
        maxZ = Math.max(maxZ, cz, nz);
      }
      prevZ = nz;

      // Three.js coords: GCode X→X, GCode Y→Z(depth), GCode Z→Y(height)
      // We scale Z (height) so layers are visible even if very thin
      const scaleZ = 1; // actual units; camera fit handles visibility
      const p1 = [cx,  cz * scaleZ, cy];
      const p2 = [nx,  nz * scaleZ, ny];

      if (isG0) {
        travelPositions.push(...p1, ...p2);
      } else {
        // G1: cut/draw — group by layer for coloring
        if (!cutByLayer.has(layerKey)) cutByLayer.set(layerKey, []);
        cutByLayer.get(layerKey).push(...p1, ...p2);
      }

      cx = nx; cy = ny; cz = nz;
    }

    // ── Build geometry ─────────────────────────────────────────────────────

    // Travel lines (semi-transparent, thin)
    if (travelPositions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(travelPositions, 3));
      group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
        color: new THREE.Color(RAPID_TRAVEL_COLOR),
        linewidth: 1,
        transparent: true,
        opacity: 0.3,
      })));
    }

    // Cut lines — one material per layer (color-coded)
    let colorIdx = 0;
    for (const [, positions] of cutByLayer) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const color = new THREE.Color(THREE_CUT_COLORS[colorIdx % THREE_CUT_COLORS.length]);
      group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
      })));
      colorIdx++;
    }

    scene.add(group);

    // ── Add grid & axes ────────────────────────────────────────────────────
    if (isFinite(maxX) && isFinite(maxY)) {
      const bounds = {
        minX: isFinite(minX) ? minX : 0,
        maxX: isFinite(maxX) ? maxX : 200,
        minY: isFinite(minY) ? minY : 0,
        maxY: isFinite(maxY) ? maxY : 200,
        minZ: isFinite(minZ) ? minZ : 0,
        maxZ: isFinite(maxZ) ? maxZ : 0,
      };

      // Store full bounds on first (non-preserved) render
      if (!gcodeFullBoundsRef.current) gcodeFullBoundsRef.current = bounds;
      const useBounds = gcodeFullBoundsRef.current;

      const gridCx = (useBounds.minX + useBounds.maxX) / 2;
      const gridCy = (useBounds.minY + useBounds.maxY) / 2;
      const spanX = useBounds.maxX - useBounds.minX || 100;
      const spanY = useBounds.maxY - useBounds.minY || 100;
      const gridSize = Math.max(spanX, spanY) * 1.4;
      const gridY = (useBounds.minZ || 0) - 0.5; // just below the lowest Z

      const grid = new THREE.GridHelper(gridSize, 24, 0x223344, 0x152030);
      grid.position.set(gridCx, gridY, gridCy);
      grid.userData.isHelper = true;
      scene.add(grid);

      // Axes at the min-corner of the gcode bounding box (not at 0,0,0!)
      const axisSize = Math.min(spanX, spanY) * 0.12;
      const axes = new THREE.AxesHelper(axisSize);
      axes.position.set(useBounds.minX, gridY, useBounds.minY);
      axes.userData.isHelper = true;
      scene.add(axes);

      if (!preserveCamera) {
        fitCamera(useBounds);
      }
    }
  }, [initThreeJS, getThree, fitCamera]);

  // ── Parse gcode into layers ──────────────────────────────────────────────
  const parseGCodeLayers = useCallback((gcodeText) => {
    if (!gcodeText) return { lines: [], layerEndIndices: [] };

    const rawLines = gcodeText.split('\n');
    const optimized = [];
    const ends = [];
    let inLayer = false;

    for (let i = 0; i < rawLines.length; i++) {
      const raw = rawLines[i].trim();

      if (raw.toUpperCase().startsWith(';LAYER_CHANGE') ||
          raw.toUpperCase().startsWith(';LAYER:') ||
          raw.toUpperCase().startsWith('(LAYER')) {
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

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentEndLine = useMemo(() => {
    if (layerEndIndices.length === 0) return 0;
    return layerEndIndices[Math.min(currentLayer, layerEndIndices.length - 1)];
  }, [currentLayer, layerEndIndices]);

  const totalLayers = layerEndIndices.length;

  // ── Initialize gcode-preview canvas (once) ──────────────────────────────
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

  // ── Process gcode when it changes ───────────────────────────────────────
  useEffect(() => {
    if (!gcode) return;
    if (lastProcessedGcodeRef.current === gcode) return;
    lastProcessedGcodeRef.current = gcode;

    setIsLoading(true);
    setLoadProgress(0);
    setCurrentLayer(0);
    setIsAnimating(false);
    savedThreeCamRef.current = null;
    gcodeFullBoundsRef.current = null;

    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);

    const { lines, layerEndIndices: ends } = parseGCodeLayers(gcode);
    setGcodeLines(lines);
    setLayerEndIndices(ends);

    const hasE = detectExtrusion(gcode);
    useThreeRef.current = !hasE;

    if (!hasE) {
      setActiveRenderer('three');
      processingTimeoutRef.current = setTimeout(async () => {
        await threeRender(lines, false);
        setIsLoading(false);
        setLoadProgress(100);
        onFinishLoading?.({ totalLines: lines.length });
      }, 300);
    } else {
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
  }, [gcode, preview, threeRender, parseGCodeLayers]);

  // ── Layer animation ──────────────────────────────────────────────────────
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
          } else if (preview) {
            // gcode-preview camera save/restore
            const camPos = preview.camera?.position?.clone?.();
            const camTarget = preview.controls?.target?.clone?.();
            preview.clear();
            preview.processGCode(slice.join('\n'));
            if (camPos && preview.camera) preview.camera.position.copy(camPos);
            if (camTarget && preview.controls?.target) preview.controls.target.copy(camTarget);
            preview.controls?.update?.();
          }
        } catch (e) { console.error("Layer animate error:", e); }
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isAnimating, viewMode, totalLayers, layerEndIndices, gcodeLines, preview,
      threeRender, saveThreeCamera, restoreThreeCamera]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    savedThreeCamRef.current = null;
    if (useThreeRef.current) {
      gcodeFullBoundsRef.current = null; // re-fit camera
      if (gcodeLines.length > 0) threeRender(gcodeLines, false);
    } else if (preview?.camera) {
      preview.camera.position.set(buildVolume.x * 1.5, buildVolume.y * 1.5, buildVolume.z * 1.5);
      if (preview.controls?.target) preview.controls.target.set(buildVolume.x / 2, buildVolume.y / 2, buildVolume.z / 2);
      preview.controls?.update?.();
    }
  }, [preview, buildVolume, gcodeLines, threeRender]);

  const jumpToLayer = useCallback((layerIndex) => {
    if (layerIndex < 0 || layerIndex >= totalLayers) return;
    setViewMode('layer');
    setCurrentLayer(layerIndex);
    setIsAnimating(false);

    const slice = gcodeLines.slice(0, layerEndIndices[layerIndex] + 1);

    if (useThreeRef.current) {
      saveThreeCamera();
      threeRender(slice, true).then(() => {
        restoreThreeCamera();
      });
    } else if (preview) {
      const camPos = preview.camera?.position?.clone?.();
      const camTarget = preview.controls?.target?.clone?.();
      preview.clear();
      preview.processGCode(slice.join('\n'));
      if (camPos && preview.camera) preview.camera.position.copy(camPos);
      if (camTarget && preview.controls?.target) preview.controls.target.copy(camTarget);
      preview.controls?.update?.();
    }
  }, [preview, gcodeLines, layerEndIndices, totalLayers, threeRender, saveThreeCamera, restoreThreeCamera]);

  const toggleViewMode = useCallback(() => {
    if (totalLayers === 0) return;
    const newMode = viewMode === 'full' ? 'layer' : 'full';
    setViewMode(newMode);
    setIsAnimating(false);

    if (newMode === 'full') {
      if (useThreeRef.current) {
        saveThreeCamera();
        threeRender(gcodeLines, true).then(restoreThreeCamera);
      } else if (preview) {
        preview.clear();
        preview.processGCode(gcodeLines.join('\n'));
      }
    } else {
      setCurrentLayer(0);
      const slice = gcodeLines.slice(0, layerEndIndices[0] + 1);
      if (useThreeRef.current) {
        saveThreeCamera();
        threeRender(slice, true).then(restoreThreeCamera);
      } else if (preview) {
        preview.clear();
        preview.processGCode(slice.join('\n'));
      }
    }
  }, [preview, gcodeLines, layerEndIndices, viewMode, totalLayers,
      threeRender, saveThreeCamera, restoreThreeCamera]);

  const toggleAnimation = useCallback(() => {
    if (viewMode !== 'layer') return;
    if (currentLayer >= totalLayers - 1) jumpToLayer(0);
    setIsAnimating(a => !a);
  }, [viewMode, currentLayer, totalLayers, jumpToLayer]);

  const handleSliderChange = useCallback((e) => {
    jumpToLayer(parseInt(e.target.value));
  }, [jumpToLayer]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', width: '100%', height: '600px',
      backgroundColor: '#0a0a0a', borderRadius: '8px',
      overflow: 'hidden', position: 'relative',
    }}>

      {showSidebar && totalLayers > 0 && (
        <div style={{
          width: '240px', height: '100%', backgroundColor: '#1a1a1a',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#0a0a0a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
              <Layers size={18} />
              <span style={{ fontWeight: 'bold' }}>Layers</span>
            </div>
            <button onClick={() => setShowSidebar(false)} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px',
            }}>✕</button>
          </div>

          <div style={{
            padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: '#111',
          }}>
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

          <div style={{
            padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: '14px', fontSize: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: RAPID_TRAVEL_COLOR, borderRadius: 2 }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Travel (G0)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: THREE_CUT_COLORS[0], borderRadius: 2 }} />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Cut (G1)</span>
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
                    padding: '8px 16px', cursor: 'pointer',
                    backgroundColor: isActive ? 'rgba(255,215,0,0.15)' : isPast ? 'rgba(255,255,255,0.03)' : 'transparent',
                    borderLeft: isActive ? '3px solid #FFD700' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(139,180,204,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? 'rgba(255,215,0,0.15)' : isPast ? 'rgba(255,255,255,0.03)' : 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: isActive ? '#FFD700' : isPast ? 'rgba(255,255,255,0.25)' : THREE_CUT_COLORS[layerIdx % THREE_CUT_COLORS.length],
                      flexShrink: 0,
                    }} />
                    <span style={{
                      color: isActive ? '#FFD700' : isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.8)',
                      fontWeight: isActive ? 'bold' : 'normal',
                    }}>
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
          <canvas
            ref={canvasRef}
            style={{
              display: 'block', width: '100%', height: '100%',
              position: 'absolute', top: 0, left: 0,
              visibility: activeRenderer === 'gcode' ? 'visible' : 'hidden',
            }}
          />
          <canvas
            ref={threeCanvasRef}
            style={{
              display: 'block', width: '100%', height: '100%',
              position: 'absolute', top: 0, left: 0,
              visibility: activeRenderer === 'three' ? 'visible' : 'hidden',
            }}
          />
        </div>

        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', color: 'white', gap: '12px', zIndex: 20,
          }}>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>Parsing G-Code…</div>
            <div style={{ width: '200px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
              <div style={{
                width: `${loadProgress}%`, height: '100%',
                backgroundColor: '#8BB4CC', borderRadius: '2px', transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: '12px', opacity: 0.6 }}>{loadProgress}%</div>
          </div>
        )}

        {!showSidebar && totalLayers > 0 && (
          <button onClick={() => setShowSidebar(true)} style={{
            position: 'absolute', top: '16px', left: '16px', padding: '10px',
            backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            backdropFilter: 'blur(10px)', zIndex: 10,
          }}>
            <ChevronRight size={18} /> Layers
          </button>
        )}

        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10,
        }}>
          <button onClick={handleReset} style={{
            padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
            color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(10px)',
          }}>
            <RotateCcw size={18} /> Reset
          </button>
          <button
            onClick={toggleViewMode}
            disabled={totalLayers === 0}
            style={{
              padding: '10px',
              backgroundColor: viewMode === 'layer' ? 'rgba(139,180,204,0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${viewMode === 'layer' ? 'rgba(139,180,204,0.5)' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '6px', color: 'white',
              cursor: totalLayers === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              backdropFilter: 'blur(10px)', opacity: totalLayers === 0 ? 0.5 : 1,
            }}
          >
            <Layers size={18} />
            {viewMode === 'full' ? 'Animate' : 'Full'}
          </button>
        </div>

        {viewMode === 'layer' && totalLayers > 0 && (
          <div style={{
            position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px', padding: '16px 24px', backdropFilter: 'blur(10px)',
            minWidth: '420px', maxWidth: '620px', zIndex: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={toggleAnimation} style={{
                padding: '8px', backgroundColor: 'rgba(139,180,204,0.2)',
                border: '1px solid rgba(139,180,204,0.4)', borderRadius: '6px',
                color: '#8BB4CC', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {isAnimating ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="0"
                  max={totalLayers - 1}
                  value={currentLayer}
                  onChange={handleSliderChange}
                  style={{
                    width: '100%', height: '6px', borderRadius: '3px', outline: 'none',
                    background: `linear-gradient(to right, #8BB4CC 0%, #8BB4CC ${(currentLayer / Math.max(totalLayers - 1, 1)) * 100}%, rgba(255,255,255,0.2) ${(currentLayer / Math.max(totalLayers - 1, 1)) * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px',
                }}>
                  <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                    Layer {currentLayer + 1} / {totalLayers}
                  </span>
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
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #8BB4CC; cursor: pointer; box-shadow: 0 0 10px rgba(139,180,204,0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #8BB4CC; cursor: pointer; border: none;
        }
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        div::-webkit-scrollbar-thumb { background: rgba(139,180,204,0.25); border-radius: 3px; }
        div::-webkit-scrollbar-thumb:hover { background: rgba(139,180,204,0.45); }
      `}</style>
    </div>
  );
};

export default GCodeViewer;