import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, ExternalLink, X, Monitor, QrCode } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copiedStage, setCopiedStage] = useState(false);
  const [copiedControl, setCopiedControl] = useState(false);
  const [stageQrDataUrl, setStageQrDataUrl] = useState<string>('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const stageUrl = `${baseUrl}/?view=stage&room=${roomId}`;
  const controlUrl = `${baseUrl}/?view=controller&room=${roomId}`;

  useEffect(() => {
    if (isOpen && stageUrl) {
      QRCode.toDataURL(stageUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setStageQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, stageUrl]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: 'stage' | 'control') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'stage') {
        setCopiedStage(true);
        setTimeout(() => setCopiedStage(false), 2000);
      } else {
        setCopiedControl(true);
        setTimeout(() => setCopiedControl(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const openSecondScreen = () => {
    // Open a popup window with stage display parameters optimized for dual-monitor
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? window.screen.width : 100;
    const top = 0;
    window.open(
      stageUrl,
      `SanctuaryStage_${roomId}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Online URLs & Second Screen</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Launch Button */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-emerald-300">Direct Dual-Monitor Extension</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pop out the stage display into a dedicated window to drag onto your second monitor or HDMI TV.
                </p>
              </div>
              <button
                onClick={openSecondScreen}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shrink-0 shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
                Pop Out Display
              </button>
            </div>
          </div>

          {/* QR Code and Stage Display URL */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-400" /> Stage / Confidence Display URL
            </label>
            <p className="text-xs text-slate-400">
              Open this URL on any wireless iPad, TV, smart monitor, or podium browser for the real-time stage view.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={stageUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(stageUrl, 'stage')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedStage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedStage ? 'Copied' : 'Copy'}
              </button>
              <a
                href={stageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* QR Code Display */}
            {stageQrDataUrl && (
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl w-fit mx-auto mt-2">
                <img src={stageQrDataUrl} alt="Stage URL QR Code" className="w-36 h-36" />
                <span className="text-[10px] text-slate-700 font-mono font-semibold mt-1">
                  Scan with Stage iPad / Phone
                </span>
              </div>
            )}
          </div>

          {/* Control Room URL */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Control Room / Director Console URL
            </label>
            <p className="text-xs text-slate-400">
              Share with another sound engineer, AV team member, or service director to co-control the timer.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={controlUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(controlUrl, 'control')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedControl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedControl ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
