import React, { useRef, useState } from 'react';
import { ChurchLogoConfig, LogoPosition, LogoSize, LogoPreset, DEFAULT_CHURCH_LOGO } from '../types/timer';
import { ChurchLogo } from './ChurchLogo';
import { Upload, X, Check, Image as ImageIcon, Trash2, Sliders, Shield, Eye, Flame, Landmark, Cross } from 'lucide-react';
import { useUITheme } from '../context/ThemeContext';

interface ChurchLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ChurchLogoConfig;
  onUpdate: (updated: Partial<ChurchLogoConfig>) => void;
}

export const ChurchLogoModal: React.FC<ChurchLogoModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_CHURCH_LOGO,
  onUpdate,
}) => {
  const { theme } = useUITheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localConfig, setLocalConfig] = useState<ChurchLogoConfig>({
    ...DEFAULT_CHURCH_LOGO,
    ...config,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, SVG, JPG, WebP).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setUploadError('Image size exceeds 2.5MB. Please choose a smaller logo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updated = {
        ...localConfig,
        customDataUrl: result,
        presetId: 'custom' as LogoPreset,
        enabled: true,
      };
      setLocalConfig(updated);
      onUpdate(updated);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetId: LogoPreset) => {
    const updated = {
      ...localConfig,
      presetId,
      customDataUrl: undefined,
      enabled: true,
    };
    setLocalConfig(updated);
    onUpdate(updated);
  };

  const handleClearCustomLogo = () => {
    const updated = {
      ...localConfig,
      customDataUrl: undefined,
      presetId: 'cross' as LogoPreset,
    };
    setLocalConfig(updated);
    onUpdate(updated);
  };

  const handleFieldChange = <K extends keyof ChurchLogoConfig>(key: K, value: ChurchLogoConfig[K]) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onUpdate({ [key]: value });
  };

  const presets: { id: LogoPreset; name: string; icon: React.ReactNode }[] = [
    { id: 'cross', name: 'Golden Cross', icon: <Cross className="w-5 h-5 text-amber-400" /> },
    { id: 'dove', name: 'Holy Spirit Dove', icon: <Flame className="w-5 h-5 text-amber-500" /> },
    { id: 'shield', name: 'Faith Shield', icon: <Shield className="w-5 h-5 text-blue-400" /> },
    { id: 'cathedral', name: 'Sanctuary Spire', icon: <Landmark className="w-5 h-5 text-purple-400" /> },
  ];

  const positions: { id: LogoPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'watermark', label: 'Center Watermark' },
  ];

  const sizes: { id: LogoSize; label: string }[] = [
    { id: 'sm', label: 'Small (28px)' },
    { id: 'md', label: 'Medium (36px)' },
    { id: 'lg', label: 'Large (48px)' },
    { id: 'xl', label: 'Extra Large (64px)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl ${theme.cardClass} border ${theme.borderClass} p-6 shadow-2xl space-y-6 text-slate-100`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Church Brand & Logo Setup
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Offline Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Brand your stage monitor, controller header, and NDI live video output.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div>
            <div className="font-semibold text-white">Enable Church Logo & Name</div>
            <div className="text-xs text-slate-400">
              Display identity across stage displays, confidence screens, and NDI feeds.
            </div>
          </div>
          <button
            onClick={() => handleFieldChange('enabled', !localConfig.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              localConfig.enabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localConfig.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" /> Live Preview
          </label>
          <div className="relative h-28 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
            {/* Grid background simulation */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            {localConfig.enabled ? (
              <div className="z-10 flex flex-col items-center gap-1">
                <ChurchLogo config={localConfig} showText={true} />
                <span className="text-[10px] text-slate-500 mt-1">
                  Position: {localConfig.position} • Size: {localConfig.size} • Opacity: {Math.round(localConfig.opacity * 100)}%
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Logo is currently disabled</div>
            )}
          </div>
        </div>

        {/* Custom Upload or Select Preset */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Logo Graphic Source
            </label>
            {localConfig.customDataUrl && (
              <button
                onClick={handleClearCustomLogo}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Custom Upload
              </button>
            )}
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
              localConfig.customDataUrl
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-7 h-7 mx-auto mb-2 text-amber-400 animate-pulse" />
            <div className="text-sm font-semibold text-white">
              {localConfig.customDataUrl ? 'Replace Custom Church Logo' : 'Upload Church Logo File'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Supports PNG with transparent alpha, SVG, JPG, or WebP (max 2.5MB).
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-2">
              ✓ Stored locally in device memory — works completely offline without internet!
            </div>
          </div>
          {uploadError && <div className="text-xs text-rose-400">{uploadError}</div>}

          {/* Or Pick a Sacred Preset */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400">Or choose a church sacred symbol preset:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {presets.map((preset) => {
                const isSelected = !localConfig.customDataUrl && localConfig.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/20 text-white shadow-md'
                        : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {preset.icon}
                    <span className="text-xs font-medium">{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Church Name & Typography */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Church / Ministry Name
          </label>
          <input
            type="text"
            value={localConfig.churchName}
            onChange={(e) => handleFieldChange('churchName', e.target.value)}
            placeholder="e.g. Grace Fellowship Church"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>

        {/* Position & Size Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Stage Placement
            </label>
            <select
              value={localConfig.position}
              onChange={(e) => handleFieldChange('position', e.target.value as LogoPosition)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Logo Size
            </label>
            <select
              value={localConfig.size}
              onChange={(e) => handleFieldChange('size', e.target.value as LogoSize)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
            >
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Logo Opacity</span>
            <span className="text-amber-400 font-mono">{Math.round(localConfig.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={localConfig.opacity}
            onChange={(e) => handleFieldChange('opacity', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Display Targets / Visibility */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Display Destinations
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={localConfig.showOnStage}
                onChange={(e) => handleFieldChange('showOnStage', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-xs text-slate-200">Stage Screen</span>
            </label>
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={localConfig.showOnController}
                onChange={(e) => handleFieldChange('showOnController', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-xs text-slate-200">Controller Bar</span>
            </label>
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={localConfig.showOnNdi}
                onChange={(e) => handleFieldChange('showOnNdi', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-xs text-slate-200">NDI Overlays</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
