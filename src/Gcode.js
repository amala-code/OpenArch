
// import React, { useEffect, useRef, useState } from "react";
// import * as GCodePreview from "gcode-preview";
// import "./GCodeViewer.css";

// const GCodeViewer = ({
//   gcode,
//   url,
//   extrusionColor = [
//     "#FF6B6B", // Red for tool 0
//     "#4ECDC4", // Teal for tool 1
//     "#45B7D1", // Blue for tool 2
//     "#FFA07A", // Orange for tool 3
//     "#98D8C8", // Mint for tool 4
//     "#FFD93D", // Yellow for tool 5
//     "#C084FC", // Purple for tool 6
//     "#F472B6"  // Pink for tool 7
//   ],
//   buildVolume = { x: 200, y: 200, z: 200 },
//   backgroundColor = "#1a1a1a",
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

//     const container = containerRef.current;
//     const canvas = canvasRef.current;
    
//     // Set canvas dimensions to match container
//     canvas.width = container.clientWidth;
//     canvas.height = container.clientHeight;

//     console.log("Initializing GCodePreview with dimensions:", canvas.width, "x", canvas.height);

//     try {
//       const instance = GCodePreview.init({
//         canvas: canvas,
//         extrusionColor: extrusionColor,
//         travelColor: "#666666",
//         buildVolume: buildVolume,
//         backgroundColor: backgroundColor,
//         // Enable camera controls for zoom/pan/rotate
//         allowDragNDrop: false,
//         // Quality settings
//         lineWidth: 1,
//         renderTravels: false,
//         renderExtrusion: true,
//         startLayer: 0,
//         endLayer: Infinity,
//         topLayerColor: "#FFFFFF",
//         lastSegmentColor: "#00FF00",
//         // Show XYZ axis lines
//         renderAxes: true,
//         axesSize: Math.max(buildVolume.x, buildVolume.y, buildVolume.z) * 1.2,
//         // Show build volume box
//         renderBuildVolume: true,
//         // Callbacks
//         onProgress: (p) => {
//           console.log("Loading progress:", Math.round(p * 100) + "%");
//           onProgress && onProgress(p);
//         },
//         onFinishLoading: (info) => {
//           console.log("Finished loading G-code:", info);
//           onFinishLoading && onFinishLoading(info);
//         },
//         onError: (err) => {
//           console.error("Preview error:", err);
//           onError && onError(err);
//         },
//       });
      
//       console.log("GCodePreview instance created:", instance);
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
        
//         console.log("Resizing canvas to:", newWidth, "x", newHeight);
        
//         // Re-render the preview
//         if (preview && gcode) {
//           try {
//             preview.clear();
//             preview.processGCode(gcode);
//           } catch (e) {
//             console.error("Error re-rendering after resize:", e);
//           }
//         }
//       }
//     };

//     window.addEventListener("resize", handleResize);

//     // Cleanup
//     return () => {
//       window.removeEventListener("resize", handleResize);
//       if (preview && preview.clear) {
//         try {
//           preview.clear();
//         } catch (e) {
//           console.error("Error disposing preview:", e);
//         }
//       }
//     };
//   }, []); // Only run once on mount

//   // Process gcode when it changes
//   useEffect(() => {
//     if (!preview || !gcode) return;

//     console.log("Processing G-code, length:", gcode.length);
//     console.log("First 500 chars:", gcode.substring(0, 500));
    
//     try {
//       preview.clear();
//       preview.processGCode(gcode);
//     } catch (err) {
//       console.error("Error processing G-code:", err);
//       if (onError) onError(err);
//     }
//   }, [preview, gcode, onError]);

//   // Process URL if provided
//   useEffect(() => {
//     if (!preview || !url || gcode) return;

//     console.log("Fetching G-code from URL:", url);
    
//     fetch(url)
//       .then((res) => res.text())
//       .then((data) => {
//         console.log("Fetched G-code from URL, length:", data.length);
//         preview.clear();
//         preview.processGCode(data);
//       })
//       .catch((err) => {
//         console.error("Failed to fetch G-code:", err);
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

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./GCodeViewer.css";

const GCodeViewer = ({
  gcode,
  url,
  extrusionColor = "#FF6B6B",
  travelColor = "#666666",
  buildVolume = { x: 200, y: 200, z: 200 },
  backgroundColor = "#1a1a1a",
  lineWidth = 2,
  renderTravels = false,
  onProgress,
  onFinishLoading,
  onError,
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const gcodeGroupRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(buildVolume.x * 1.5, buildVolume.y * 1.5, buildVolume.z * 1.5);
    camera.lookAt(buildVolume.x / 2, buildVolume.y / 2, buildVolume.z / 2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(buildVolume.x / 2, buildVolume.y / 2, buildVolume.z / 2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Grid Helper
    const gridSize = Math.max(buildVolume.x, buildVolume.y);
    const gridHelper = new THREE.GridHelper(gridSize, 20, 0x444444, 0x222222);
    gridHelper.position.set(buildVolume.x / 2, 0, buildVolume.y / 2);
    scene.add(gridHelper);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(gridSize / 2);
    axesHelper.position.set(0, 0, 0);
    scene.add(axesHelper);

    // Build Volume Box
    const boxGeometry = new THREE.BoxGeometry(buildVolume.x, buildVolume.z, buildVolume.y);
    const boxEdges = new THREE.EdgesGeometry(boxGeometry);
    const boxLines = new THREE.LineSegments(
      boxEdges,
      new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.3, transparent: true })
    );
    boxLines.position.set(buildVolume.x / 2, buildVolume.z / 2, buildVolume.y / 2);
    scene.add(boxLines);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [backgroundColor, buildVolume]);

  // Parse and render G-code
  const parseAndRenderGCode = (gcodeText) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
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

    try {
      const lines = gcodeText.split('\n');
      const movements = [];
      
      let currentX = 0, currentY = 0, currentZ = 0;
      let currentE = 0;
      let isExtruding = false;
      let layerCount = 0;
      let moveCount = 0;

      // Parse G-code
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip comments and empty lines
        if (!line || line.startsWith(';')) {
          if (line.includes('LAYER_CHANGE')) layerCount++;
          continue;
        }

        // Parse G1 commands (linear move)
        if (line.startsWith('G1') || line.startsWith('G0')) {
          const parts = line.split(/\s+/);
          let newX = currentX, newY = currentY, newZ = currentZ;
          let newE = currentE;
          let hasE = false;
          let hasCoordinate = false;

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

          // Skip if this is just a feedrate change (G1 F600) with no coordinates
          if (!hasCoordinate) {
            continue;
          }

          // Determine if this is an extrusion move
          // If E value is present and increases, it's extruding
          // If no E value but XY coordinates change (not just Z), treat as extrusion
          const xyChanged = Math.abs(newX - currentX) > 0.001 || Math.abs(newY - currentY) > 0.001;
          const zOnlyMove = !xyChanged && Math.abs(newZ - currentZ) > 0.001;
          
          const extrusionMove = hasE ? (newE > currentE) : xyChanged;

          // Only add movement if coordinates changed
          if (newX !== currentX || newY !== currentY || newZ !== currentZ) {
            movements.push({
              from: { x: currentX, y: currentY, z: currentZ },
              to: { x: newX, y: newY, z: newZ },
              isExtrusion: extrusionMove && !zOnlyMove
            });
            moveCount++;
          }

          currentX = newX;
          currentY = newY;
          currentZ = newZ;
          currentE = newE;
        }

        // Report progress
        if (i % 100 === 0 && onProgress) {
          onProgress(i / lines.length);
        }
      }

      // Calculate bounds for debugging
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      
      for (const move of movements) {
        minX = Math.min(minX, move.from.x, move.to.x);
        maxX = Math.max(maxX, move.from.x, move.to.x);
        minY = Math.min(minY, move.from.y, move.to.y);
        maxY = Math.max(maxY, move.from.y, move.to.y);
        minZ = Math.min(minZ, move.from.z, move.to.z);
        maxZ = Math.max(maxZ, move.from.z, move.to.z);
      }

      console.log(`Parsed ${moveCount} movements, ${layerCount} layers`);
      console.log(`Bounds: X[${minX.toFixed(2)}, ${maxX.toFixed(2)}] Y[${minY.toFixed(2)}, ${maxY.toFixed(2)}] Z[${minZ.toFixed(2)}, ${maxZ.toFixed(2)}]`);
      console.log(`Extrusion moves: ${movements.filter(m => m.isExtrusion).length}`);
      console.log(`Travel moves: ${movements.filter(m => !m.isExtrusion).length}`);

      // Create line geometries for movements
      const extrusionPoints = [];
      const travelPoints = [];

      for (const move of movements) {
        const points = [
          new THREE.Vector3(move.from.x, move.from.z, move.from.y),
          new THREE.Vector3(move.to.x, move.to.z, move.to.y)
        ];

        if (move.isExtrusion) {
          extrusionPoints.push(...points);
        } else if (renderTravels) {
          travelPoints.push(...points);
        }
      }

      // Create extrusion lines
      if (extrusionPoints.length > 0) {
        const extrusionGeometry = new THREE.BufferGeometry().setFromPoints(extrusionPoints);
        const extrusionMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(extrusionColor),
          linewidth: lineWidth,
          transparent: true,
          opacity: 0.9
        });
        const extrusionLines = new THREE.LineSegments(extrusionGeometry, extrusionMaterial);
        gcodeGroup.add(extrusionLines);
      }

      // Create travel lines
      if (travelPoints.length > 0) {
        const travelGeometry = new THREE.BufferGeometry().setFromPoints(travelPoints);
        const travelMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(travelColor),
          linewidth: 1,
          transparent: true,
          opacity: 0.3
        });
        const travelLines = new THREE.LineSegments(travelGeometry, travelMaterial);
        gcodeGroup.add(travelLines);
      }

      scene.add(gcodeGroup);

      const stats = {
        totalMoves: moveCount,
        layers: layerCount,
        extrusionMoves: movements.filter(m => m.isExtrusion).length,
        travelMoves: movements.filter(m => !m.isExtrusion).length
      };

      setStats(stats);
      setIsLoading(false);

      if (onFinishLoading) {
        onFinishLoading(stats);
      }

    } catch (err) {
      console.error("Error parsing G-code:", err);
      setIsLoading(false);
      if (onError) onError(err);
    }
  };

  // Process gcode when it changes
  useEffect(() => {
    if (gcode && sceneRef.current) {
      console.log("Processing G-code, length:", gcode.length);
      parseAndRenderGCode(gcode);
    }
  }, [gcode]);

  // Process URL if provided
  useEffect(() => {
    if (url && !gcode && sceneRef.current) {
      console.log("Fetching G-code from URL:", url);
      fetch(url)
        .then((res) => res.text())
        .then((data) => {
          console.log("Fetched G-code from URL, length:", data.length);
          parseAndRenderGCode(data);
        })
        .catch((err) => {
          console.error("Failed to fetch G-code:", err);
          if (onError) onError(err);
        });
    }
  }, [url, gcode]);

  return (
    <div className="gcode-container" ref={containerRef}>
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading G-code...</div>
        </div>
      )}
      {stats && (
        <div className="gcode-stats">
          <div>Layers: {stats.layers}</div>
          <div>Moves: {stats.totalMoves}</div>
          <div>Extrusion: {stats.extrusionMoves}</div>
          {renderTravels && <div>Travel: {stats.travelMoves}</div>}
        </div>
      )}
    </div>
  );
};

export default GCodeViewer;