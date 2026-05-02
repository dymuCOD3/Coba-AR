import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, AlertTriangle, ZoomIn, ZoomOut, RefreshCw, Info, X, Search, RotateCcw } from 'lucide-react';

// --- Injected during AR: forces camera/canvas to fill viewport ---
const AR_STYLE_ID = 'ar-override-styles';
const AR_CSS = `
  #ar-backdrop {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: #000 !important;
    z-index: 9996 !important;
  }
  a-scene {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9998 !important;
  }
  a-scene .a-canvas {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9998 !important;
  }
  #arjs-video {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 9997 !important;
    overflow: hidden !important;
    margin: 0 !important;
  }
  #arjs-video video,
  a-scene video,
  video[autoplay] {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    min-width: 100vw !important;
    min-height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    object-fit: cover !important;
    z-index: 9997 !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  .a-loader, .a-enter-vr-button, .a-orientation-modal, .a-enter-ar-button {
    display: none !important;
  }
`;

// --- Injected AFTER AR cleanup: permanently overrides A-Frame body modifications ---
// CSS !important in stylesheet BEATS regular inline styles set by A-Frame's async callbacks.
// This is the nuclear option: A-Frame keeps setting body.style.marginTop="-243px" etc.
// via async rAF callbacks that run even after scene removal. This stylesheet wins.
const AR_CLEANUP_ID = 'ar-cleanup-styles';
const AR_CLEANUP_CSS = `
  body.ar-cleaned {
    position: static !important;
    overflow: visible !important;
    margin: 0 !important;
    width: auto !important;
    height: auto !important;
    top: auto !important;
    left: auto !important;
  }
  html.ar-cleaned {
    overflow: visible !important;
  }
`;

const ARScanner = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [markerFound, setMarkerFound] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMobileScale, setShowMobileScale] = useState(false);
  const [showMobileRotate, setShowMobileRotate] = useState(false);
  const sceneRef = useRef(null);

  const getModels = () => [
    document.getElementById('ar-model-entity'),
    document.getElementById('ar-model-manusia-entity')
  ].filter(Boolean);

  const handleScale = (delta) => {
    getModels().forEach(model => {
      const currentScale = model.getAttribute('scale');
      const newScaleValue = Math.max(0.001, currentScale.x + delta);
      model.setAttribute('scale', `${newScaleValue} ${newScaleValue} ${newScaleValue}`);
    });
  };

  const handleRotate = (axis, delta) => {
    getModels().forEach(model => {
      const currentRotation = model.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
      const newRotation = { ...currentRotation };
      newRotation[axis] += delta;
      model.setAttribute('rotation', `${newRotation.x} ${newRotation.y} ${newRotation.z}`);
    });
  };

  const handleReset = () => {
    getModels().forEach(model => {
      model.setAttribute('scale', '0.02 0.02 0.02');
      model.setAttribute('rotation', '0 -90 0');
    });
  };

  const injectARStyles = () => {
    if (!document.getElementById(AR_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = AR_STYLE_ID;
      style.textContent = AR_CSS;
      document.head.appendChild(style);
    }
  };

  const removeARStyles = () => {
    const el = document.getElementById(AR_STYLE_ID);
    if (el) el.remove();
  };

  const injectCleanupStyles = () => {
    if (!document.getElementById(AR_CLEANUP_ID)) {
      const style = document.createElement('style');
      style.id = AR_CLEANUP_ID;
      style.textContent = AR_CLEANUP_CSS;
      document.head.appendChild(style);
    }
  };

  const removeCleanupStyles = () => {
    const el = document.getElementById(AR_CLEANUP_ID);
    if (el) el.remove();
  };

  const cleanupScene = useCallback(() => {
    // Remove AR display styles
    removeARStyles();

    // Remove a-scene
    document.querySelectorAll('a-scene').forEach((s) => {
      try { s.remove(); } catch (e) { /* ignore */ }
    });
    sceneRef.current = null;

    // Stop video tracks
    document.querySelectorAll('video').forEach((v) => {
      try {
        if (v.srcObject) {
          v.srcObject.getTracks().forEach((t) => t.stop());
          v.srcObject = null;
        }
        v.remove();
      } catch (e) { /* ignore */ }
    });

    // Remove AR.js elements
    const arjsVideo = document.getElementById('arjs-video');
    if (arjsVideo) try { arjsVideo.remove(); } catch (e) { /* ignore */ }

    // Remove backdrop
    const backdrop = document.getElementById('ar-backdrop');
    if (backdrop) try { backdrop.remove(); } catch (e) { /* ignore */ }

    // Remove A-Frame UI
    document.querySelectorAll('.a-loader, .a-enter-vr-button, .a-orientation-modal').forEach((el) => {
      try { el.remove(); } catch (e) { /* ignore */ }
    });

    // Strip A-Frame classes
    document.body.classList.remove('a-fullscreen');
    document.documentElement.classList.remove('a-fullscreen');

    // Add cleanup class + inject cleanup stylesheet
    // CSS !important from stylesheet PERMANENTLY overrides A-Frame's inline styles
    // No matter how many times A-Frame's async callbacks set body.style.marginTop,
    // our !important stylesheet rule wins every time.
    document.body.classList.add('ar-cleaned');
    document.documentElement.classList.add('ar-cleaned');
    injectCleanupStyles();

    window.scrollTo(0, 0);

    setMarkerFound(false);
  }, []);

  const startAR = useCallback(() => {
    setIsLoading(true);
    setCameraError(null);

    // Remove cleanup override — let A-Frame control body during scan
    document.body.classList.remove('ar-cleaned');
    document.documentElement.classList.remove('ar-cleaned');
    removeCleanupStyles();

    // Lock scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Inject AR display styles
    injectARStyles();

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'ar-backdrop';
    document.body.appendChild(backdrop);

    // Scene
    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('loading-screen', 'enabled: false');
    scene.setAttribute('renderer', 'logarithmicDepthBuffer: true; antialias: true; alpha: true;');

    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    marker.setAttribute('id', 'ar-marker-hiro');

    // Preload assets for the 3D models
    const assets = document.createElement('a-assets');
    const objItem = document.createElement('a-asset-item');
    objItem.setAttribute('id', 'f1-obj');
    objItem.setAttribute('src', '/models/formula1/formula1.obj');
    const mtlItem = document.createElement('a-asset-item');
    mtlItem.setAttribute('id', 'f1-mtl');
    mtlItem.setAttribute('src', '/models/formula1/formula1.mtl');
    const manusiaObjItem = document.createElement('a-asset-item');
    manusiaObjItem.setAttribute('id', 'manusia-obj');
    manusiaObjItem.setAttribute('src', '/models/manusia/Manusia.obj');
    assets.appendChild(objItem);
    assets.appendChild(mtlItem);
    assets.appendChild(manusiaObjItem);
    scene.appendChild(assets);

    // Load the Formula 1 3D model on Hiro marker
    const model = document.createElement('a-entity');
    model.setAttribute('id', 'ar-model-entity');
    model.setAttribute('obj-model', 'obj: #f1-obj; mtl: #f1-mtl');
    model.setAttribute('position', '0 0 0');
    // Setting a smaller scale as raw 3D models are often very large
    model.setAttribute('scale', '0.02 0.02 0.02');
    model.setAttribute('rotation', '0 -90 0'); // Adjust rotation as needed
    marker.appendChild(model);
    scene.appendChild(marker);

    // Marker 2: pattern-angka-1
    const marker2 = document.createElement('a-marker');
    marker2.setAttribute('type', 'pattern');
    marker2.setAttribute('url', '/markers/pattern-angka-1.patt');
    marker2.setAttribute('id', 'ar-marker-angka1');

    const model2 = document.createElement('a-entity');
    model2.setAttribute('id', 'ar-model-manusia-entity');
    model2.setAttribute('obj-model', 'obj: #manusia-obj');
    model2.setAttribute('position', '0 0 0');
    model2.setAttribute('scale', '0.02 0.02 0.02');
    model2.setAttribute('rotation', '0 -90 0');
    marker2.appendChild(model2);
    scene.appendChild(marker2);

    const cam = document.createElement('a-entity');
    cam.setAttribute('camera', '');
    scene.appendChild(cam);

    let foundCount = 0;
    const onMarkerFound = () => { foundCount++; setMarkerFound(foundCount > 0); };
    const onMarkerLost = () => { foundCount = Math.max(0, foundCount - 1); setMarkerFound(foundCount > 0); };
    
    marker.addEventListener('markerFound', onMarkerFound);
    marker.addEventListener('markerLost', onMarkerLost);
    marker2.addEventListener('markerFound', onMarkerFound);
    marker2.addEventListener('markerLost', onMarkerLost);

    document.body.insertBefore(scene, document.body.firstChild);
    sceneRef.current = scene;

    setIsLoading(false);
    setHasStarted(true);
  }, []);

  useEffect(() => {
    return () => cleanupScene();
  }, [cleanupScene]);

  const handleStop = () => {
    cleanupScene();
    setHasStarted(false);
  };

  // --- AR Active ---
  if (hasStarted) {
    return (
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 10000, background: 'transparent' }}
      >
        <div className="absolute top-0 left-0 w-full">
          <div className="flex justify-center pt-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg pointer-events-auto ${
                markerFound ? 'bg-[#4a7c59] text-white' : 'bg-white/90 text-gray-600'
              }`}
            >
              {markerFound ? '✓ Marker Terdeteksi!' : '◎ Arahkan ke Marker Hiro atau Angka 1'}
            </motion.div>
          </div>

          {!markerFound && (
            <div className="flex justify-center mt-12">
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 border-2 border-dashed border-[#a8d5ba] rounded-lg"
              />
            </div>
          )}
        </div>

        <button
          id="btn-stop-scan"
          onClick={handleStop}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full text-sm font-bold transition-colors shadow-lg active:scale-95 pointer-events-auto"
        >
          Berhenti Scan
        </button>

        {/* Info Toggle Button */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="absolute bottom-8 left-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-95 transition-all pointer-events-auto flex items-center justify-center z-50"
        >
          <Info size={24} />
        </button>

        {/* Info Panel */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-24 left-6 right-24 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl pointer-events-auto border border-blue-100 max-h-[40vh] overflow-y-auto z-50"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Info size={20} className="text-blue-500" />
                Informasi Daun Tembakau
              </h3>
              <button 
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-gray-600 text-sm leading-relaxed">
              <p>isikan informasi mengenai daun tembakau</p>
            </div>
          </motion.div>
        )}

        {/* 3D Model Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto items-end z-50">
          
          {/* --- SCALE CONTROLS --- */}
          {/* Mobile Scale Toggle */}
          <button 
            onClick={() => {
              setShowMobileScale(true);
              setShowMobileRotate(false);
            }} 
            className={`md:hidden p-3 bg-white/90 text-emerald-700 rounded-full shadow-lg backdrop-blur-sm active:scale-95 transition-all ${!showMobileScale ? 'block' : 'hidden'}`}
          >
            <Search size={24} />
          </button>

          {/* Scale Controls Panel */}
          <div className={`${showMobileScale ? 'flex' : 'hidden'} md:flex bg-white/90 p-2 rounded-2xl shadow-lg backdrop-blur-sm flex-col gap-2 origin-right transition-all items-center`}>
            <div className="flex w-full justify-between items-center px-1 mb-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ukuran</p>
              <button onClick={() => setShowMobileScale(false)} className="md:hidden text-gray-400 hover:text-gray-600"><X size={14}/></button>
            </div>
            <button onClick={() => handleScale(0.005)} className="p-3 w-full bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 active:scale-95 transition-all flex justify-center">
              <ZoomIn size={20}/>
            </button>
            <button onClick={() => handleScale(-0.005)} className="p-3 w-full bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 active:scale-95 transition-all flex justify-center">
              <ZoomOut size={20}/>
            </button>
          </div>

          {/* --- ROTATION CONTROLS --- */}
          {/* Mobile Rotate Toggle */}
          <button 
            onClick={() => {
              setShowMobileRotate(true);
              setShowMobileScale(false);
            }} 
            className={`md:hidden p-3 bg-white/90 text-blue-700 rounded-full shadow-lg backdrop-blur-sm active:scale-95 transition-all ${!showMobileRotate ? 'block' : 'hidden'}`}
          >
            <RotateCcw size={24} />
          </button>

          {/* Rotation Controls Panel */}
          <div className={`${showMobileRotate ? 'flex' : 'hidden'} md:flex bg-white/90 p-2 rounded-2xl shadow-lg backdrop-blur-sm flex-col gap-2 origin-right transition-all items-center`}>
            <div className="flex w-full justify-between items-center px-1 mb-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rotasi</p>
              <button onClick={() => setShowMobileRotate(false)} className="md:hidden text-gray-400 hover:text-gray-600"><X size={14}/></button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleRotate('x', -15)} className="p-2 bg-blue-100 text-blue-700 rounded-l-xl hover:bg-blue-200 active:scale-95 transition-all font-bold w-8">-</button>
              <div className="p-2 bg-blue-50 text-blue-800 text-xs font-bold flex items-center justify-center w-6">X</div>
              <button onClick={() => handleRotate('x', 15)} className="p-2 bg-blue-100 text-blue-700 rounded-r-xl hover:bg-blue-200 active:scale-95 transition-all font-bold w-8">+</button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleRotate('y', -15)} className="p-2 bg-green-100 text-green-700 rounded-l-xl hover:bg-green-200 active:scale-95 transition-all font-bold w-8">-</button>
              <div className="p-2 bg-green-50 text-green-800 text-xs font-bold flex items-center justify-center w-6">Y</div>
              <button onClick={() => handleRotate('y', 15)} className="p-2 bg-green-100 text-green-700 rounded-r-xl hover:bg-green-200 active:scale-95 transition-all font-bold w-8">+</button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleRotate('z', -15)} className="p-2 bg-purple-100 text-purple-700 rounded-l-xl hover:bg-purple-200 active:scale-95 transition-all font-bold w-8">-</button>
              <div className="p-2 bg-purple-50 text-purple-800 text-xs font-bold flex items-center justify-center w-6">Z</div>
              <button onClick={() => handleRotate('z', 15)} className="p-2 bg-purple-100 text-purple-700 rounded-r-xl hover:bg-purple-200 active:scale-95 transition-all font-bold w-8">+</button>
            </div>
          </div>

          {/* Reset Control */}
          <button 
            onClick={handleReset} 
            className="flex items-center justify-center gap-2 bg-amber-100 text-amber-700 p-3 rounded-2xl hover:bg-amber-200 active:scale-95 transition-all shadow-lg font-bold text-sm backdrop-blur-sm"
          >
            <RefreshCw size={18} /> <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Initial View ---
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-emerald-50 h-full min-h-[400px]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <Camera size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mulai Pemindaian</h2>
        <p className="text-center text-gray-600 mb-8 max-w-xs">
          Izinkan akses kamera dan arahkan perangkat Anda ke marker khusus untuk melihat artefak 3D.
        </p>

        {cameraError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-sm flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{cameraError}</p>
          </div>
        )}

        <button
          id="btn-start-scan"
          onClick={startAR}
          disabled={isLoading}
          className={`font-bold py-4 px-10 rounded-2xl transition-all shadow-md active:scale-95 ${
            isLoading ? 'bg-gray-400 cursor-wait text-white' : 'bg-[#4a7c59] hover:bg-[#3d664a] text-white'
          }`}
        >
          {isLoading ? 'Meminta Izin Kamera...' : 'Aktifkan Kamera'}
        </button>

        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-sm">
          <p className="text-sm text-amber-700 text-center">
            💡 <b>Tips:</b> Anda memerlukan <b>Marker Hiro</b> atau <b>Marker Angka 1</b> untuk melihat objek 3D.{' '}
            <a
              href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-amber-900"
            >
              Unduh marker di sini
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ARScanner;
