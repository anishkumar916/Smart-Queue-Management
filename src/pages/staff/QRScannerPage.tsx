import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Keyboard,
  Upload,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Volume2,
  Play,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { queueService } from '../../services/queueService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { ScanState } from '../../components/QRScannerModal';
import { StopServiceModal } from '../../components/StopServiceModal';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ScannerPageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('QR Scanner Page caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <CameraOff className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              CAMERA UNAVAILABLE – Please allow camera access or enter the token manually.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Please check your browser permissions or reload the scanner terminal.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Reload Scanner
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const QRScannerPageContent: React.FC = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '');
  const [selectedCounterId, setSelectedCounterId] = useState<string>(user?.counterId || '');

  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scanState, setScanState] = useState<ScanState>({ type: 'IDLE' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopModalError, setStopModalError] = useState<string | null>(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'html5-qr-page-viewport';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    adminService.getBranches().then((res) => {
      if (res.success && res.branches?.length > 0) {
        setBranches(res.branches);
        if (!selectedBranchId) setSelectedBranchId(res.branches[0]._id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    adminService.getCounters(selectedBranchId).then((res) => {
      if (res.success && res.counters?.length > 0) {
        setCounters(res.counters);
        if (!selectedCounterId) setSelectedCounterId(res.counters[0]._id);
      } else {
        setCounters([]);
        setSelectedCounterId('');
      }
    });
  }, [selectedBranchId]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.debug('Stop scanner error:', err);
      }
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.debug('Clear scanner error:', err);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const startScanner = async (preferredCamId?: string) => {
    if (mode !== 'camera' || scanState.type !== 'IDLE') return;

    setCameraStarting(true);
    setCameraUnavailable(false);

    await stopScanner();

    const container = document.getElementById(scannerContainerId);
    if (!container) {
      setCameraStarting(false);
      return;
    }

    // Ensure DOM container has no child nodes before library starts
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser or iframe');
      }

      let cameras: Array<{ id: string; label: string }> = [];
      try {
        cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
        }
      } catch (enumErr) {
        console.warn('Could not enumerate cameras prior to start:', enumErr);
      }

      const instance = new Html5Qrcode(scannerContainerId);
      scannerRef.current = instance;

      const targetCamera =
        preferredCamId ||
        selectedCameraId ||
        (cameras.length > 0 ? cameras[0].id : { facingMode: 'environment' });

      await instance.start(
        targetCamera,
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        async (decodedText: string) => {
          await stopScanner();
          handleProcessScannedText(decodedText);
        },
        () => {
          // ignore scan misses
        }
      );

      setCameraActive(true);
      setCameraUnavailable(false);
    } catch (err: any) {
      console.warn('Failed to start camera scanner on page:', err);
      setCameraActive(false);
      setCameraUnavailable(true);
    } finally {
      setCameraStarting(false);
    }
  };

  useEffect(() => {
    if (mode === 'camera' && scanState.type === 'IDLE') {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [mode, scanState.type]);

  const handleCameraChange = async (newCamId: string) => {
    setSelectedCameraId(newCamId);
    await startScanner(newCamId);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setCameraUnavailable(false);

    try {
      await stopScanner();
      const container = document.getElementById(scannerContainerId);
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }

      const instance = new Html5Qrcode(scannerContainerId);
      scannerRef.current = instance;

      const decodedText = await instance.scanFile(file, true);
      handleProcessScannedText(decodedText);
    } catch (err: any) {
      console.error('File scan error:', err);
      setScanState({
        type: 'INVALID',
        message: 'INVALID TOKEN – Please scan again.'
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProcessScannedText = async (text: string) => {
    setLoading(true);
    setActionFeedback(null);
    try {
      const response = await queueService.scanQR(text, selectedBranchId);

      if (response && response.valid && response.token) {
        setScanState({ type: 'VALID', data: response });
      } else {
        const msg = response?.message || 'INVALID TOKEN – Please scan again.';
        if (msg.includes('INVALID QUEUE') || msg.includes('NOT VALID FOR THIS QUEUE')) {
          setScanState({ type: 'WRONG_QUEUE', message: 'INVALID QUEUE – Token does not belong to this service queue.' });
        } else if (response?.status === 'COMPLETED' || msg.includes('COMPLETED')) {
          setScanState({
            type: 'STATUS_REJECTED',
            status: 'COMPLETED',
            message: 'TOKEN ALREADY COMPLETED'
          });
        } else if (response?.status === 'CANCELLED' || msg.includes('CANCELLED')) {
          setScanState({
            type: 'STATUS_REJECTED',
            status: 'CANCELLED',
            message: 'TOKEN CANCELLED'
          });
        } else {
          setScanState({ type: 'INVALID', message: 'INVALID TOKEN – Please scan again.' });
        }
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'INVALID TOKEN – Please scan again.';
      if (errorMsg.includes('INVALID QUEUE') || errorMsg.includes('NOT VALID FOR THIS QUEUE')) {
        setScanState({ type: 'WRONG_QUEUE', message: 'INVALID QUEUE – Token does not belong to this service queue.' });
      } else if (err?.response?.data?.status === 'COMPLETED' || errorMsg.includes('COMPLETED') || errorMsg.includes('Completed')) {
        setScanState({
          type: 'STATUS_REJECTED',
          status: 'COMPLETED',
          message: 'TOKEN ALREADY COMPLETED'
        });
      } else if (err?.response?.data?.status === 'CANCELLED' || errorMsg.includes('CANCELLED') || errorMsg.includes('Cancelled')) {
        setScanState({
          type: 'STATUS_REJECTED',
          status: 'CANCELLED',
          message: 'TOKEN CANCELLED'
        });
      } else {
        setScanState({ type: 'INVALID', message: 'INVALID TOKEN – Please scan again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessScannedText(manualCode.trim());
  };

  const resetToScanAgain = () => {
    setScanState({ type: 'IDLE' });
    setManualCode('');
    setActionFeedback(null);
    setCameraUnavailable(false);
  };

  const handleStartService = async (tokenId: string) => {
    if (scanState.type !== 'VALID' || actionLoading) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await queueService.startService(tokenId);
      setActionFeedback('Service started successfully!');
      setScanState({
        type: 'VALID',
        data: {
          ...scanState.data,
          token: { ...scanState.data.token, ...res.token }
        }
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to serve customer';
      setActionFeedback(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStopModal = () => {
    setStopModalError(null);
    setIsStopModalOpen(true);
  };

  const handleConfirmStopService = async (remarks: string) => {
    if (scanState.type !== 'VALID') return;
    const tokenId = scanState.data.token._id;
    setActionLoading(true);
    setStopModalError(null);
    try {
      await queueService.completeService(tokenId, remarks);
      setIsStopModalOpen(false);
      setActionFeedback('Service completed!');
      setScanState({
        type: 'VALID',
        data: {
          ...scanState.data,
          token: { ...scanState.data.token, status: 'COMPLETED', staffRemarks: remarks }
        }
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Failed to complete service';
      setStopModalError(msg);
      setActionFeedback(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleServeCustomer = async (tokenId: string) => {
    handleStartService(tokenId);
  };

  const handleCompleteService = async (_tokenId: string) => {
    handleOpenStopModal();
  };

  const handleCallOrRecall = async (tokenId: string) => {
    if (!selectedCounterId) {
      setActionFeedback('Select a counter desk first.');
      return;
    }
    setActionLoading(true);
    try {
      await queueService.recallToken(tokenId, selectedCounterId);
      setActionFeedback('Customer called to desk!');
      if (scanState.type === 'VALID') {
        setScanState({
          type: 'VALID',
          data: {
            ...scanState.data,
            token: { ...scanState.data.token, status: 'CALLED' }
          }
        });
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)]">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Staff Verification Station
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            FastPass QR Scanner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Instant cryptographic verification of customer queue passes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
            >
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {counters.length > 0 && (
            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white outline-none"
            >
              {counters.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Scanner Container with 3D elevation */}
      <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]">
        <div className="absolute inset-x-12 -top-2 h-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-md pointer-events-none" />

        {/* STATE 1: IDLE / SCANNER AREA */}
        {scanState.type === 'IDLE' && (
          <div className="space-y-6">
            <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setMode('camera')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
                  mode === 'camera'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                SCAN CUSTOMER QR
              </button>
              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  setMode('manual');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition ${
                  mode === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                ENTER TOKEN MANUALLY
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Verifying QR identifier in database...
                </p>
              </div>
            ) : mode === 'camera' ? (
              <div className="flex flex-col items-center space-y-4">
                {/* Camera source selector if multiple cameras detected */}
                {availableCameras.length > 1 && !cameraUnavailable && (
                  <div className="w-full flex items-center justify-between text-xs px-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Select Camera Device:
                    </span>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => handleCameraChange(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 outline-none"
                    >
                      {availableCameras.map((cam, idx) => (
                        <option key={cam.id} value={cam.id}>
                          {cam.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Viewport - Completely isolated for Html5Qrcode without React children */}
                <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border-2 border-indigo-500/40 bg-slate-950 p-2 shadow-inner">
                  <div
                    id={scannerContainerId}
                    className="w-full rounded-2xl overflow-hidden min-h-[260px] bg-slate-900 flex items-center justify-center text-slate-500"
                  />

                  {cameraActive && (
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      Live Feed
                    </div>
                  )}
                </div>

                {/* Exact Required Camera Unavailable Banner */}
                {cameraUnavailable && (
                  <div className="w-full p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <CameraOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          CAMERA UNAVAILABLE – Please allow camera access or enter the token manually.
                        </h4>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                          The camera feed cannot be opened in this environment. Please enable camera access in your browser or switch to manual pass verification.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startScanner()}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        TRY AGAIN
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopScanner();
                          setMode('manual');
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-850 text-amber-900 dark:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Keyboard className="w-3.5 h-3.5" />
                        ENTER TOKEN MANUALLY
                      </button>
                    </div>
                  </div>
                )}

                {/* File Upload Option */}
                <div className="w-full pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Testing with a pass screenshot?</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="page-qr-file-upload"
                  />
                  <label
                    htmlFor="page-qr-file-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition text-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-500" />
                    Upload QR Image
                  </label>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Token Number or QR Pass ID
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder='e.g. A001 or 8f5c2c1e-...'
                    className="w-full px-4 py-3 text-sm font-mono rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs uppercase"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  Verify Pass with Backend
                </button>
              </form>
            )}

            {/* Quick Test Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Simulate Tampered / Fake Pass Test:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleProcessScannedText('INVALID-TEST-999')}
                  className="px-3 py-1.5 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-semibold hover:bg-rose-100 transition cursor-pointer"
                >
                  Test Invalid QR
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessScannedText('tampered-token-uuid-000')}
                  className="px-3 py-1.5 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-semibold hover:bg-rose-100 transition cursor-pointer"
                >
                  Test Tampered Security ID
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: INVALID TOKEN */}
        {scanState.type === 'INVALID' && (
          <div className="relative rounded-3xl p-8 bg-gradient-to-b from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900 border-2 border-rose-300 dark:border-rose-900/80 shadow-[0_20px_45px_-10px_rgba(244,63,94,0.2)] text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner ring-8 ring-rose-500/20">
              <AlertOctagon className="w-12 h-12" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                INVALID TOKEN
              </h3>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
                Please scan again or enter a valid token.
              </p>
              <p className="text-sm text-rose-600 font-semibold mt-0.5">
                Do not process this customer.
              </p>
            </div>

            <button
              type="button"
              onClick={resetToScanAgain}
              className="py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition inline-flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Again
            </button>
          </div>
        )}

        {/* STATE 3: INVALID QUEUE */}
        {scanState.type === 'WRONG_QUEUE' && (
          <div className="relative rounded-3xl p-8 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-900/80 shadow-[0_20px_45px_-10px_rgba(245,158,11,0.2)] text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner ring-8 ring-amber-500/20">
              <AlertTriangle className="w-12 h-12" />
            </div>

            <div>
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                INVALID QUEUE
              </h3>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-2">
                Token does not belong to this service queue.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/60 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Please direct the customer to the branch location where their token was issued.
            </div>

            <button
              type="button"
              onClick={resetToScanAgain}
              className="py-3.5 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition inline-flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Another Pass
            </button>
          </div>
        )}

        {/* STATE 4: STATUS REJECTED */}
        {scanState.type === 'STATUS_REJECTED' && (
          <div className="relative rounded-3xl p-8 bg-gradient-to-b from-slate-100 to-white dark:from-slate-850 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto shadow-inner ring-8 ring-slate-500/20">
              <AlertTriangle className="w-12 h-12" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {scanState.status === 'COMPLETED' ? 'TOKEN ALREADY COMPLETED' : 'TOKEN CANCELLED'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {scanState.status === 'COMPLETED'
                  ? 'This token has already been serviced. Cannot be processed again.'
                  : 'This token has been cancelled.'}
              </p>
            </div>

            <button
              type="button"
              onClick={resetToScanAgain}
              className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm shadow-md transition inline-flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              Scan Another Pass
            </button>
          </div>
        )}

        {/* STATE 5: VALID QR CODE - CUSTOMER DETAILS 3D CARD (ISSUE 5) */}
        {scanState.type === 'VALID' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-200">
            {/* 3D Verified Customer Card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border border-indigo-200/80 dark:border-indigo-900/60 p-6 sm:p-8 shadow-xl">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span>✓ TOKEN VERIFIED</span>
                </div>
                <span className="px-3 py-1 text-xs font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Verification: ✓ VALID
                </span>
              </div>

              {/* Details Grid as required by Issue 5: Customer, Token, Service, Queue, Position, Status: VERIFIED */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 text-xs mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customer
                  </span>
                  <p className="font-extrabold text-base text-slate-900 dark:text-white truncate mt-0.5">
                    {scanState.data.customer?.name || 'Customer'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Token
                  </span>
                  <p className="font-mono font-black text-2xl text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                    {scanState.data.token.tokenNumber}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Service
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {scanState.data.service?.name || 'General Service'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Queue
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {scanState.data.branch?.name || 'Main Queue'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Position
                  </span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    Position #{scanState.data.token.queuePosition || 1}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status
                  </span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    VERIFIED
                  </span>
                </div>
              </div>

              {actionFeedback && (
                <div className="mb-6 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 text-center animate-in fade-in">
                  {actionFeedback}
                </div>
              )}

              {/* SERVE CUSTOMER button as required by Issue 5 */}
              {/* START SERVICE / STOP SERVICE buttons (REQ 3) */}
              <div className="space-y-3">
                {scanState.data.token.status !== 'SERVING' ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStartService(scanState.data.token._id)}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>
                      {actionLoading ? 'Starting Service...' : 'START SERVICE'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleOpenStopModal}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>
                      {actionLoading ? 'Stopping Service...' : 'Stop Service'}
                    </span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleCallOrRecall(scanState.data.token._id)}
                    className="flex-1 py-3 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    Call to Counter Desk
                  </button>
                  {scanState.data.token.status === 'SERVING' && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleOpenStopModal}
                      className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Stop Service
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={resetToScanAgain}
                className="px-6 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Scan Another Pass
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stop Service Remarks Modal (REQ 3) */}
      {scanState.type === 'VALID' && (
        <StopServiceModal
          isOpen={isStopModalOpen}
          onClose={() => {
            setIsStopModalOpen(false);
            setStopModalError(null);
          }}
          onConfirm={handleConfirmStopService}
          customerName={scanState.data.customer?.name || 'Customer'}
          tokenNumber={scanState.data.token.tokenNumber}
          serviceName={scanState.data.service?.name || 'Service'}
          loading={actionLoading}
          error={stopModalError}
        />
      )}
    </div>
  );
};

export const QRScannerPage: React.FC = () => {
  return (
    <ScannerPageErrorBoundary>
      <QRScannerPageContent />
    </ScannerPageErrorBoundary>
  );
};

export default QRScannerPage;
