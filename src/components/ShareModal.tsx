import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, ExternalLink, X, Monitor, QrCode, PlayCircle, ShieldCheck } from 'lucide-react';
import { useUITheme } from '../context/ThemeContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const { theme } = useUITheme();
  const [copiedStage, setCopiedStage] = useState(false);
  const [copiedStageAlt, setCopiedStageAlt] = useState(false);
  const [copiedControl, setCopiedControl] = useState(false);
  const [copiedNdi, setCopiedNdi] = useState(false);
  const [stageQrDataUrl, setStageQrDataUrl] = useState<string>('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  // Support both standard query param and direct /stage path
  const stageUrl = `${baseUrl}/?view=stage&room=${encodeURIComponent(roomId)}`;
  const stageDirectPath = `${baseUrl}/stage?room=${encodeURIComponent(roomId)}`;
  const controlUrl = `${baseUrl}/?room=${encodeURIComponent(roomId)}`;
  const ndiUrl = `${baseUrl}/?view=ndi&room=${encodeURIComponent(roomId)}&layout=lower-third&bg=transparent`;

  useEffect(() => {
    if (isOpen && stageUrl) {
      QRCode.toDataURL(stageUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setStageQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, stageUrl]);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, type: 'stage' | 'stageAlt' | 'control') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'stage') {
        setCopiedStage(true);
        setTimeout(() => setCopiedStage(false), 2000);
      } else if (type === 'stageAlt') {
        setCopiedStageAlt(true);
        setTimeout(() => setCopiedStageAlt(false), 2000);
      } else {
        setCopiedControl(true);
        setTimeout(() => setCopiedControl(false), 2000);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const openSecondScreen = () => {
    const width = 1280;
    const height = 720;
    const left = window.screen.width ? window.screen.width : 100;
    const top = 0;
    const newWindow = window.open(
      stageUrl,
      `SanctuaryStage_${roomId}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.open(stageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto ${theme.cardClass}`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${theme.borderClass} ${theme.surfaceClass}`}>
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className={`text-base font-bold ${theme.textPrimaryClass}`}>Online URLs & Stage Display</h2>
              <p className={`text-xs ${theme.textMutedClass}`}>
                Live synchronized stage confidence screen for sanctuary monitors, iPads, and TVs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg hover:bg-slate-800/40 transition-colors ${theme.textMutedClass}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Direct Dual Monitor Popout */}
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Dual-Monitor Extension
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Launch the dedicated clutter-free stage window to drag onto your second sanctuary monitor or HDMI TV.
                </p>
              </div>
              <button
                onClick={openSecondScreen}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shrink-0 shadow-md active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Pop Out</span>
              </button>
            </div>
          </div>

          {/* Primary Online Stage URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${theme.textSecondaryClass}`}>
                <QrCode className="w-4 h-4 text-emerald-400" /> Stage / Confidence Display URL
              </label>
              <a
                href={stageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline underline-offset-2"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Open Screen Now</span>
              </a>
            </div>
            <p className={`text-xs ${theme.textMutedClass}`}>
              Open on any wireless tablet, iPad at the pulpit, stage floor monitor, or church smart TV:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={stageUrl}
                className={`flex-1 px-3 py-2 text-xs font-mono rounded-lg border select-all focus:outline-none ${theme.surfaceClass} ${theme.borderClass} ${theme.textPrimaryClass}`}
              />
              <button
                onClick={() => copyToClipboard(stageUrl, 'stage')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                {copiedStage ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStage ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={stageUrl}
                target="_blank"
                rel="noreferrer"
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 border ${theme.surfaceClass} ${theme.borderClass} ${theme.textSecondaryClass}`}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Direct /stage Path Link */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className={theme.textMutedClass}>Direct path alias:</span>
              <button
                onClick={() => copyToClipboard(stageDirectPath, 'stageAlt')}
                className="text-emerald-400 hover:text-emerald-300 font-mono underline underline-offset-2 flex items-center gap-1"
              >
                {copiedStageAlt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{stageDirectPath}</span>
              </button>
            </div>

            {/* QR Code */}
            {stageQrDataUrl && (
              <div className="flex flex-col items-center justify-center p-3.5 bg-white rounded-xl w-fit mx-auto mt-2 shadow-md">
                <img src={stageQrDataUrl} alt="Stage URL QR Code" className="w-36 h-36" />
                <span className="text-[10px] text-slate-800 font-mono font-bold mt-1.5">
                  Scan with iPad / Stage Tablet
                </span>
              </div>
            )}
          </div>

          {/* Controller URL */}
          <div className={`space-y-2 pt-3 border-t ${theme.borderClass}`}>
            <label className={`text-xs font-semibold uppercase tracking-wider block ${theme.textSecondaryClass}`}>
              Co-Director / AV Booth Console URL
            </label>
            <p className={`text-xs ${theme.textMutedClass}`}>
              Share with another media crew member to control the timer simultaneously.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={controlUrl}
                className={`flex-1 px-3 py-2 text-xs font-mono rounded-lg border select-all focus:outline-none ${theme.surfaceClass} ${theme.borderClass} ${theme.textPrimaryClass}`}
              />
              <button
                onClick={() => copyToClipboard(controlUrl, 'control')}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 border ${theme.surfaceClass} ${theme.borderClass} ${theme.textSecondaryClass}`}
              >
                {copiedControl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedControl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* NDI® & OBS Studio Transparent Browser Source URL */}
          <div className={`space-y-2 pt-3 border-t ${theme.borderClass}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                NDI® & Live Video Overlay URL (Transparent Alpha)
              </label>
              <span className="text-[10px] text-cyan-300 font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                vMix / OBS / ProPresenter
              </span>
            </div>
            <p className={`text-xs ${theme.textMutedClass}`}>
              Load into OBS Studio (Browser Source) or vMix (Web Browser Input) with transparent background.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={ndiUrl}
                className={`flex-1 px-3 py-2 text-xs font-mono rounded-lg border select-all focus:outline-none bg-slate-950 border-cyan-500/40 text-cyan-300`}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(ndiUrl);
                    setCopiedNdi(true);
                    setTimeout(() => setCopiedNdi(false), 2000);
                  } catch {}
                }}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                {copiedNdi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNdi ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={ndiUrl}
                target="_blank"
                rel="noreferrer"
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0 border ${theme.surfaceClass} ${theme.borderClass} ${theme.textSecondaryClass}`}
                title="Preview NDI output"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex justify-end ${theme.borderClass} ${theme.surfaceClass}`}>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border ${theme.borderClass} ${theme.textSecondaryClass} hover:bg-slate-800/40 transition-colors`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
