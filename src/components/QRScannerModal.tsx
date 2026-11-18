import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Camera,
  CameraOff,
  Keyboard,
  Upload,
  AlertOctagon,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Play,
  CheckCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { queueService } from '../services/queueService';
import { StopServiceModal } from './StopServiceModal';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ScannerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('QR Scanner ErrorBoundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  counterId?: string;
  initialTokenNumber?: string;
  initialMode?: 'camera' | 'manual';
  onScanSuccess: (tokenData: any) => void;
}

export type ScanState =
  | { type: 'IDLE' }
  | { type: 'SCANNING' }
  | { type: 'VALID'; data: any }
  | { type: 'INVALID'; message: string }
  | { type: 'WRONG_QUEUE'; message: string }
  | { type: 'STATUS_REJECTED'; status: string; message: string };

export const QRScannerModalContent: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  branchId,
  counterId,
  initialTokenNumber,
  initialMode = 'camera',
  onScanSuccess
}) => {
  const [mode, setMode] = useState<'camera' | 'manual'>(initialMode);
  const [manualCode, setManualCode] = useState(initialTokenNumber || '');
  const [scanState, setScanState] = useState<ScanState>({ type: 'IDLE' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [stopModalError, setStopModalError] = useState<string | null>(null);

  // Camera management states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'html5-qr-modal-viewport';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!isOpen || mode !== 'camera' || scanState.type !== 'IDLE') return;

    setCameraStarting(true);
    setCameraUnavailable(false);

    // Stop existing instance
    await stopScanner();

    // Verify container element exists in DOM
    const container = document.getElementById(scannerContainerId);
    if (!container) {
      setCameraStarting(false);
      return;
    }

    // Clear any leftover DOM children safely before Html5Qrcode mounts
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    try {
      // Check for mediaDevices support
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
        console.warn('Could not enumerate cameras:', enumErr);
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
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0
        },
        async (decodedText: string) => {
          await stopScanner();
          handleProcessScannedText(decodedText);
        },
        () => {
          // ignore scan frame misses
        }
      );

      setCameraActive(true);
      setCameraUnavailable(false);
    } catch (err: any) {
      console.warn('Failed to start camera scanner:', err);
      setCameraActive(false);
      setCameraUnavailable(true);
    } finally {
      setCameraStarting(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

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
  }, [isOpen, mode, scanState.type]);

  // Lock background page scroll while popup is open and restore when closed
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

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
      const response = await queueService.scanQR(text, branchId);

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

  // Staff action: Serve Customer (Start Service) directly without remarks dialog
  const handleStartService = async (tokenId: string) => {
    if (scanState.type !== 'VALID' || actionLoading) return;
    setActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await queueService.startService(tokenId);
      const updatedData = {
        ...scanState.data,
        token: { ...scanState.data.token, ...res.token }
      };
      setScanState({
        type: 'VALID',
        data: updatedData
      });
      setActionFeedback('Service started successfully!');
      onScanSuccess(updatedData);
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
      const updatedData = {
        ...scanState.data,
        token: { ...scanState.data.token, status: 'COMPLETED', staffRemarks: remarks }
      };
      setScanState({
        type: 'VALID',
        data: updatedData
      });
      onScanSuccess(updatedData);
      setTimeout(() => {
        onClose();
      }, 700);
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
    if (!counterId) {
      setActionFeedback('Assign or select a counter desk first.');
      return;
    }
    setActionLoading(true);
    try {
      await queueService.recallToken(tokenId, counterId);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScanner();
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top 3D Accent Line */}
        <div className="h-2 shrink-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Customer Token Verification
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cryptographic QR verification required before serving
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content based on scanState - dedicated vertical scroll area */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 touch-pan-y">
          {/* STATE 1: IDLE / SCANNING */}
          {scanState.type === 'IDLE' && (
            <div className="space-y-4">
              {/* Camera vs Manual Tabs */}
              <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setMode('camera')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition ${
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition ${
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
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Querying secure queue database...
                  </p>
                </div>
              ) : mode === 'camera' ? (
                <div className="flex flex-col items-center space-y-3">
                  {/* Camera Controls Bar (if multiple cameras detected) */}
                  {availableCameras.length > 1 && !cameraUnavailable && (
                    <div className="w-full flex items-center justify-between text-xs px-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Camera Source:
                      </span>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => handleCameraChange(e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                      >
                        {availableCameras.map((cam, idx) => (
                          <option key={cam.id} value={cam.id}>
                            {cam.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Camera Scanner Viewport - Keep container completely free of React children! */}
                  <div className="relative w-full max-w-xs rounded-3xl overflow-hidden border-2 border-indigo-500/40 bg-slate-950 p-2 shadow-inner">
                    <div
                      id={scannerContainerId}
                      className="w-full rounded-2xl overflow-hidden min-h-[220px] bg-slate-900 flex items-center justify-center text-slate-500"
                    />

                    {/* Camera Active Indicator */}
                    {cameraActive && (
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        Live
                      </div>
                    )}
                  </div>

                  {/* Required Exact Error Card for Camera Unavailable */}
                  {cameraUnavailable && (
                    <div className="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left space-y-3 animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <CameraOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            CAMERA UNAVAILABLE – Please allow camera access or enter the token manually.
                          </h5>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                            Unable to access camera feed in this environment. You can retry permission or enter the token number manually.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
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

                  {/* Fallback Option: Upload QR Image / File */}
                  <div className="w-full pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-[11px]">Testing with a QR screenshot?</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="modal-qr-file-upload"
                    />
                    <label
                      htmlFor="modal-qr-file-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition text-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-500" />
                      Upload QR Image
                    </label>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Token Number or QR Pass ID
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder='e.g. A001 or 8f5c2c1e-...'
                      className="w-full px-4 py-3 text-xs font-mono rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs uppercase"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!manualCode.trim() || loading}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    Verify Pass with Backend
                  </button>
                </form>
              )}

              {/* Quick Preset Tests */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Simulation Tests:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleProcessScannedText('INVALID-TEST-999')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-semibold hover:bg-rose-100 transition cursor-pointer"
                  >
                    Test Invalid QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcessScannedText('tampered-token-id-000')}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-semibold hover:bg-rose-100 transition cursor-pointer"
                  >
                    Test Tampered Pass
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: INVALID TOKEN (scan again) */}
          {scanState.type === 'INVALID' && (
            <div className="relative rounded-3xl p-6 bg-gradient-to-b from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900 border-2 border-rose-300 dark:border-rose-900/80 shadow-md text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner ring-4 ring-rose-500/20">
                <AlertOctagon className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  INVALID TOKEN
                </h4>
                <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-1 font-semibold">
                  Please scan again or enter a valid token.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  The pass was not recognized or has invalid cryptographic integrity. Customer cannot be served.
                </p>
              </div>

              <button
                type="button"
                onClick={resetToScanAgain}
                className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                Scan Again
              </button>
            </div>
          )}

          {/* STATE 3: INVALID QUEUE */}
          {scanState.type === 'WRONG_QUEUE' && (
            <div className="relative rounded-3xl p-6 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-900/80 shadow-md text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner ring-4 ring-amber-500/20">
                <AlertTriangle className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  INVALID QUEUE
                </h4>
                <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-1 font-semibold">
                  Token does not belong to this service queue.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/60 text-xs text-slate-600 dark:text-slate-400">
                Please direct the customer to the branch location where their token was issued.
              </div>

              <button
                type="button"
                onClick={resetToScanAgain}
                className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                Scan Another Pass
              </button>
            </div>
          )}

          {/* STATE 4: STATUS REJECTED (COMPLETED OR CANCELLED) */}
          {scanState.type === 'STATUS_REJECTED' && (
            <div className="relative rounded-3xl p-6 bg-gradient-to-b from-slate-100 to-white dark:from-slate-850 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-md text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto shadow-inner ring-4 ring-slate-500/20">
                <AlertTriangle className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {scanState.status === 'COMPLETED' ? 'TOKEN ALREADY COMPLETED' : 'TOKEN CANCELLED'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {scanState.status === 'COMPLETED'
                    ? 'This token has already been serviced and completed. Double-processing prevented.'
                    : 'This token has been cancelled and cannot be served.'}
                </p>
              </div>

              <button
                type="button"
                onClick={resetToScanAgain}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                Scan Another Pass
              </button>
            </div>
          )}

          {/* STATE 5: VALID QR CODE - CUSTOMER DETAILS 3D CARD (ISSUE 5) */}
          {scanState.type === 'VALID' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              {/* 3D Elevated Card */}
              <div className="relative rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-850 dark:via-slate-900 dark:to-slate-850 border border-indigo-200/80 dark:border-indigo-900/60 p-6 shadow-xl">
                {/* Header Verification Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>✓ TOKEN VERIFIED</span>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Verification: ✓ VALID
                  </span>
                </div>

                {/* Details Grid as required by Issue 5: Customer, Token, Service, Queue, Position, Status: VERIFIED */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Customer
                    </span>
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">
                      {scanState.data.customer?.name || 'Customer'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Token
                    </span>
                    <p className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 truncate">
                      {scanState.data.token.tokenNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Service
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {scanState.data.service?.name || 'General Service'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Queue
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {scanState.data.branch?.name || 'Main Queue'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Position
                    </span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Position #{scanState.data.token.queuePosition || 1}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Status
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      VERIFIED
                    </span>
                  </div>
                </div>

                {/* Feedback note if action taken */}
                {actionFeedback && (
                  <div className="mb-4 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 text-center animate-in fade-in">
                    {actionFeedback}
                  </div>
                )}

                {/* START SERVICE / STOP SERVICE buttons (REQ 3) */}
                <div className="space-y-2">
                  {scanState.data.token.status !== 'SERVING' ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleStartService(scanState.data.token._id)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{actionLoading ? 'Starting Service...' : 'START SERVICE'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleOpenStopModal}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{actionLoading ? 'Stopping Service...' : 'Stop Service'}</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleCallOrRecall(scanState.data.token._id)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Call to Desk
                    </button>
                    {scanState.data.token.status === 'SERVING' && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleOpenStopModal}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Stop Service
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={resetToScanAgain}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Scan Another Pass
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopScanner();
                    onScanSuccess(scanState.data);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
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

export const QRScannerModal: React.FC<QRScannerModalProps> = (props) => {
  return (
    <ScannerErrorBoundary
      fallback={(_error, reset) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <CameraOff className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                CAMERA UNAVAILABLE – Please allow camera access or enter the token manually.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Camera initialization stopped to prevent UI issues.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                TRY AGAIN
              </button>
              <button
                onClick={props.onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <QRScannerModalContent {...props} />
    </ScannerErrorBoundary>
  );
};

export default QRScannerModal;
