import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, ShieldCheck, Sparkles } from 'lucide-react';

interface QRCodeDisplayProps {
  tokenNumber: string;
  tokenId: string;
  branchId: string;
  qrTokenId?: string;
  serviceName?: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  tokenNumber,
  tokenId,
  branchId,
  qrTokenId,
  serviceName,
  size = 180
}) => {
  // Pure secure reference containing only the cryptographic qrTokenId
  const secureIdentifier = qrTokenId || tokenId;
  const qrPayload = JSON.stringify({
    qrTokenId: secureIdentifier
  });

  const handleDownload = () => {
    const svg = document.getElementById(`qr-svg-${tokenNumber}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 90;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Token: ${tokenNumber}`, canvas.width / 2, size + 50);
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(`ID: ${secureIdentifier.slice(0, 12)}...`, canvas.width / 2, size + 70);
        const a = document.createElement('a');
        a.download = `Token-${tokenNumber}-FastPass.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="relative group perspective-[1000px] w-full max-w-[280px] mx-auto">
      {/* 3D Elevated Card Container */}
      <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:shadow-[0_22px_45px_-8px_rgba(99,102,241,0.2)] text-center">
        {/* Subtle Ambient Backlight Glow */}
        <div className="absolute inset-x-8 -top-3 h-6 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-md pointer-events-none" />

        {/* Security Badge Header */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Encrypted Fast-Pass</span>
        </div>

        {/* Crisp Standard High-Contrast QR Code Container */}
        {/* NOTE: QR code itself remains completely flat, standard, unskewed, and fully scannable */}
        <div className="p-3.5 bg-white rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800/80 inline-block mb-3.5 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
          <QRCodeSVG
            id={`qr-svg-${tokenNumber}`}
            value={qrPayload}
            size={size}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        {/* Token Info & Short ID */}
        <div className="text-center mb-3.5">
          <div className="text-2xl font-mono font-black tracking-tight text-slate-900 dark:text-white">
            {tokenNumber}
          </div>
          {serviceName && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{serviceName}</p>
          )}
          <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            Ref: {secureIdentifier.slice(0, 8)}...
          </span>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleDownload}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Save Fast-Pass
          </button>
        </div>
      </div>
    </div>
  );
};
