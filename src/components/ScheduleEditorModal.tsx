import React, { useState, useEffect } from 'react';
import { ChurchPreset, ChurchServiceTemplate } from '../types/timer';
import { CHURCH_SERVICE_TEMPLATES } from '../data/churchTemplates';
import { useUITheme } from '../context/ThemeContext';
import {
  Calendar,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Clock,
  Sparkles,
  BookOpen,
  Music,
  HeartHandshake,
  Megaphone,
  Coins,
  Sliders,
  Copy,
  Play,
  Save,
} from 'lucide-react';

export const SCHEDULES_STORAGE_KEY = 'sanctuary_church_schedules';

export function getStoredSchedules(): ChurchServiceTemplate[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored church schedules', e);
    }
  }
  return CHURCH_SERVICE_TEMPLATES;
}

export function saveStoredSchedules(schedules: ChurchServiceTemplate[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
    } catch (e) {
      console.warn('Failed to save church schedules to storage', e);
    }
  }
}

interface ScheduleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedulesUpdated: (schedules: ChurchServiceTemplate[]) => void;
  onLoadPreset: (preset: ChurchPreset) => void;
  activePresetTitle?: string;
}

const CATEGORY_CONFIG: Record<
  ChurchPreset['category'],
  { label: string; bg: string; text: string; icon: React.FC<{ className?: string }> }
> = {
  worship: {
    label: 'Worship / Music',
    bg: 'bg-purple-500/20 border-purple-500/30',
    text: 'text-purple-300',
    icon: Music,
  },
  word: {
    label: 'Sermon / Word',
    bg: 'bg-emerald-500/20 border-emerald-500/30',
    text: 'text-emerald-300',
    icon: BookOpen,
  },
  prayer: {
    label: 'Prayer & Ministry',
    bg: 'bg-blue-500/20 border-blue-500/30',
    text: 'text-blue-300',
    icon: HeartHandshake,
  },
  announcements: {
    label: 'Announcements / Welcome',
    bg: 'bg-amber-500/20 border-amber-500/30',
    text: 'text-amber-300',
    icon: Megaphone,
  },
  offering: {
    label: 'Offering & Tithes',
    bg: 'bg-teal-500/20 border-teal-500/30',
    text: 'text-teal-300',
    icon: Coins,
  },
  custom: {
    label: 'Custom Segment',
    bg: 'bg-slate-500/20 border-slate-500/30',
    text: 'text-slate-300',
    icon: Sliders,
  },
};

export const ScheduleEditorModal: React.FC<ScheduleEditorModalProps> = ({
  isOpen,
  onClose,
  onSchedulesUpdated,
  onLoadPreset,
  activePresetTitle,
}) => {
  const { theme } = useUITheme();
  const [schedules, setSchedules] = useState<ChurchServiceTemplate[]>(() => getStoredSchedules());
  const [activeScheduleId, setActiveScheduleId] = useState<string>(() => {
    const initial = getStoredSchedules();
    return initial[0]?.id || 'sunday-main';
  });

  // State for editing an item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSpeaker, setEditSpeaker] = useState('');
  const [editMinutes, setEditMinutes] = useState(15);
  const [editSeconds, setEditSeconds] = useState(0);
  const [editCategory, setEditCategory] = useState<ChurchPreset['category']>('word');

  // State for creating a new item
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSpeaker, setNewSpeaker] = useState('');
  const [newMinutes, setNewMinutes] = useState(15);
  const [newSeconds, setNewSeconds] = useState(0);
  const [newCategory, setNewCategory] = useState<ChurchPreset['category']>('worship');

  // State for creating a new schedule
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  const [newScheduleDesc, setNewScheduleDesc] = useState('');

  // Status feedback message
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSchedules(getStoredSchedules());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSchedule =
    schedules.find((s) => s.id === activeScheduleId) || schedules[0];

  // Calculate total schedule time
  const totalSecondsAll = currentSchedule?.items.reduce((acc, item) => {
    return acc + (item.durationMinutes || 0) * 60 + (item.durationSeconds || 0);
  }, 0) || 0;

  const totalHours = Math.floor(totalSecondsAll / 3600);
  const totalMins = Math.floor((totalSecondsAll % 3600) / 60);
  const totalSecs = totalSecondsAll % 60;

  let totalDurationFormatted = '';
  if (totalHours > 0) {
    totalDurationFormatted = `${totalHours}h ${totalMins}m${totalSecs > 0 ? ` ${totalSecs}s` : ''}`;
  } else {
    totalDurationFormatted = `${totalMins}m${totalSecs > 0 ? ` ${totalSecs}s` : ''}`;
  }

  const notifyChange = (updated: ChurchServiceTemplate[], msg?: string) => {
    setSchedules(updated);
    saveStoredSchedules(updated);
    onSchedulesUpdated(updated);
    if (msg) {
      setStatusMsg(msg);
      setTimeout(() => setStatusMsg(null), 3500);
    }
  };

  // Reorder items
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!currentSchedule) return;
    const items = [...currentSchedule.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    const updatedSchedules = schedules.map((s) =>
      s.id === currentSchedule.id ? { ...s, items } : s
    );
    notifyChange(updatedSchedules, `Moved "${temp.title}" ${direction}`);
  };

  // Start editing item
  const handleStartEditItem = (item: ChurchPreset) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditSpeaker(item.speaker || '');
    setEditMinutes(item.durationMinutes);
    setEditSeconds(item.durationSeconds || 0);
    setEditCategory(item.category || 'custom');
  };

  // Save edited item
  const handleSaveEditItem = () => {
    if (!currentSchedule || !editingItemId) return;
    if (!editTitle.trim()) {
      setStatusMsg('Please provide a title for the segment.');
      return;
    }

    const items = currentSchedule.items.map((item) => {
      if (item.id === editingItemId) {
        return {
          ...item,
          title: editTitle.trim(),
          speaker: editSpeaker.trim() || undefined,
          durationMinutes: Math.max(0, editMinutes),
          durationSeconds: Math.max(0, Math.min(59, editSeconds)),
          category: editCategory,
        };
      }
      return item;
    });

    const updatedSchedules = schedules.map((s) =>
      s.id === currentSchedule.id ? { ...s, items } : s
    );
    notifyChange(updatedSchedules, `Updated segment "${editTitle}"`);
    setEditingItemId(null);
  };

  // Delete item
  const handleDeleteItem = (itemId: string, itemTitle: string) => {
    if (!currentSchedule) return;
    const items = currentSchedule.items.filter((i) => i.id !== itemId);
    const updatedSchedules = schedules.map((s) =>
      s.id === currentSchedule.id ? { ...s, items } : s
    );
    notifyChange(updatedSchedules, `Removed "${itemTitle}" from schedule`);
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  // Add new item to current schedule
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchedule) return;
    if (!newTitle.trim()) {
      setStatusMsg('Please enter a segment title.');
      return;
    }

    const newItem: ChurchPreset = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      speaker: newSpeaker.trim() || undefined,
      durationMinutes: Math.max(0, newMinutes),
      durationSeconds: Math.max(0, Math.min(59, newSeconds)),
      category: newCategory,
    };

    const items = [...currentSchedule.items, newItem];
    const updatedSchedules = schedules.map((s) =>
      s.id === currentSchedule.id ? { ...s, items } : s
    );
    notifyChange(updatedSchedules, `Added "${newItem.title}" to ${currentSchedule.name}`);

    // Reset add form
    setNewTitle('');
    setNewSpeaker('');
    setNewMinutes(15);
    setNewSeconds(0);
    setIsAddingItem(false);
  };

  // Create brand new schedule
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim()) return;

    const newId = `schedule-${Date.now()}`;
    const newSched: ChurchServiceTemplate = {
      id: newId,
      name: newScheduleName.trim(),
      description: newScheduleDesc.trim() || 'Custom church service schedule',
      items: [
        {
          id: `item-${Date.now()}-1`,
          title: 'Opening Prayer & Welcome',
          durationMinutes: 5,
          category: 'prayer',
        },
        {
          id: `item-${Date.now()}-2`,
          title: 'Praise & Worship',
          durationMinutes: 20,
          category: 'worship',
        },
        {
          id: `item-${Date.now()}-3`,
          title: 'The Message / Sermon',
          speaker: 'Pastor',
          durationMinutes: 35,
          category: 'word',
        },
      ],
    };

    const updated = [...schedules, newSched];
    notifyChange(updated, `Created schedule "${newSched.name}"`);
    setActiveScheduleId(newId);
    setNewScheduleName('');
    setNewScheduleDesc('');
    setIsCreatingSchedule(false);
  };

  // Duplicate current schedule
  const handleDuplicateSchedule = () => {
    if (!currentSchedule) return;
    const newId = `schedule-${Date.now()}`;
    const duplicated: ChurchServiceTemplate = {
      id: newId,
      name: `${currentSchedule.name} (Copy)`,
      description: currentSchedule.description,
      items: currentSchedule.items.map((it) => ({
        ...it,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };

    const updated = [...schedules, duplicated];
    notifyChange(updated, `Duplicated "${currentSchedule.name}"`);
    setActiveScheduleId(newId);
  };

  // Delete current schedule (if not the last one)
  const handleDeleteSchedule = () => {
    if (!currentSchedule || schedules.length <= 1) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the schedule "${currentSchedule.name}"?`
    );
    if (!confirmDelete) return;

    const updated = schedules.filter((s) => s.id !== currentSchedule.id);
    const nextActive = updated[0].id;
    setActiveScheduleId(nextActive);
    notifyChange(updated, `Deleted schedule "${currentSchedule.name}"`);
  };

  // Reset to original built-in templates
  const handleResetToDefaults = () => {
    const confirmReset = window.confirm(
      'Reset all service schedules and presets back to original factory defaults? Any custom modifications will be replaced.'
    );
    if (!confirmReset) return;

    notifyChange(CHURCH_SERVICE_TEMPLATES, 'Reset service schedules to factory defaults.');
    setActiveScheduleId('sunday-main');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl ${theme.cardClass} border ${theme.borderClass} shadow-2xl overflow-hidden text-slate-100`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Church Service Schedule & Presets Editor
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Customizable
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, reorder, edit durations, and customize church service segments for AV booth & stage displays.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Selector Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs for schedules */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {schedules.map((sched) => (
              <button
                key={sched.id}
                onClick={() => {
                  setActiveScheduleId(sched.id);
                  setEditingItemId(null);
                  setIsAddingItem(false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap border ${
                  activeScheduleId === sched.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                    : 'bg-slate-900/70 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {sched.name}
              </button>
            ))}

            <button
              onClick={() => setIsCreatingSchedule(true)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 flex items-center gap-1 transition-colors whitespace-nowrap"
              title="Create a new service schedule"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Service</span>
            </button>
          </div>

          {/* Schedule management tools */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleDuplicateSchedule}
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-colors"
              title="Duplicate current schedule"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
            {schedules.length > 1 && (
              <button
                onClick={handleDeleteSchedule}
                className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-800/60 flex items-center gap-1 transition-colors"
                title="Delete this schedule"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              onClick={handleResetToDefaults}
              className="px-2.5 py-1 rounded-lg bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700/60 flex items-center gap-1 transition-colors"
              title="Reset to factory templates"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Create Schedule Sub-form Modal (when requested) */}
        {isCreatingSchedule && (
          <form
            onSubmit={handleCreateSchedule}
            className="p-4 mx-6 my-3 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Create New Church Service Schedule
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingSchedule(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Easter Sunday Celebration"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Special Easter service with baptism & communion"
                  value={newScheduleDesc}
                  onChange={(e) => setNewScheduleDesc(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingSchedule(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md"
              >
                Create Schedule
              </button>
            </div>
          </form>
        )}

        {/* Status banner */}
        {statusMsg && (
          <div className="mx-6 mt-3 px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="text-emerald-400/80 hover:text-white text-[10px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Schedule Info Summary Bar */}
        {currentSchedule && (
          <div className="px-6 py-2.5 bg-slate-900/30 flex items-center justify-between border-b border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400">Schedule:</span>{' '}
                <strong className="text-white">{currentSchedule.name}</strong>
              </div>
              <div className="hidden sm:block text-slate-500">·</div>
              <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Service Duration:</span>
                <strong className="text-amber-300">{totalDurationFormatted}</strong>
              </div>
              <div className="hidden sm:block text-slate-500">·</div>
              <div className="text-slate-400">
                <span>Segments:</span> <strong className="text-slate-200">{currentSchedule.items.length}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setIsAddingItem(true);
                setEditingItemId(null);
              }}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Segment</span>
            </button>
          </div>
        )}

        {/* Add Item Form (expandable) */}
        {isAddingItem && (
          <form
            onSubmit={handleAddNewItem}
            className="p-4 mx-6 my-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add New Segment to {currentSchedule?.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold">Segment Title</label>
                <input
                  type="text"
                  placeholder="e.g. Communion Meditation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Speaker / Leader (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Elder Samuel"
                  value={newSpeaker}
                  onChange={(e) => setNewSpeaker(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="600"
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={newSeconds}
                  onChange={(e) => setNewSeconds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ChurchPreset['category'])}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="worship">Worship / Music</option>
                  <option value="word">Sermon / Word</option>
                  <option value="prayer">Prayer & Ministry</option>
                  <option value="announcements">Announcements</option>
                  <option value="offering">Offering & Tithes</option>
                  <option value="custom">Custom / Special</option>
                </select>
              </div>
            </div>

            {/* Quick minute helper buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Presets:</span>
              {[3, 5, 10, 15, 20, 30, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setNewMinutes(m);
                    setNewSeconds(0);
                  }}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700"
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Schedule</span>
              </button>
            </div>
          </form>
        )}

        {/* Main List of Schedule Segments */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {!currentSchedule || currentSchedule.items.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-800 rounded-2xl space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No segments in this schedule yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click &ldquo;Add Segment&rdquo; above to start building the order of service for this church service.
              </p>
            </div>
          ) : (
            currentSchedule.items.map((item, index) => {
              const isEditing = editingItemId === item.id;
              const isCurrentActive = activePresetTitle === item.title;
              const catConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.custom;
              const CatIcon = catConfig.icon;

              const durationLabel =
                item.durationSeconds && item.durationSeconds > 0
                  ? `${item.durationMinutes}m ${item.durationSeconds}s`
                  : `${item.durationMinutes} min`;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900 border-2 border-amber-500/80 shadow-lg space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" /> Edit Segment #{index + 1}
                      </span>
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 font-semibold">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold">Speaker / Leader</label>
                        <input
                          type="text"
                          value={editSpeaker}
                          onChange={(e) => setEditSpeaker(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 font-semibold">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          max="600"
                          value={editMinutes}
                          onChange={(e) => setEditMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold">Seconds</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={editSeconds}
                          onChange={(e) => setEditSeconds(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold">Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as ChurchPreset['category'])}
                          className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="worship">Worship / Music</option>
                          <option value="word">Sermon / Word</option>
                          <option value="prayer">Prayer & Ministry</option>
                          <option value="announcements">Announcements</option>
                          <option value="offering">Offering & Tithes</option>
                          <option value="custom">Custom / Special</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEditItem}
                        className="px-4 py-1.5 text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg flex items-center gap-1.5 shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isCurrentActive
                      ? 'bg-emerald-950/40 border-emerald-600 shadow-md text-white'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  {/* Left: Reorder up/down + Number + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Up / Down Reorder Arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                        title="Move Up in Schedule"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveItem(index, 'down')}
                        disabled={index === currentSchedule.items.length - 1}
                        className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                        title="Move Down in Schedule"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Step Number Badge */}
                    <span className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-slate-300 shrink-0">
                      {index + 1}
                    </span>

                    {/* Segment Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-semibold truncate text-white">{item.title}</h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catConfig.bg} ${catConfig.text}`}
                        >
                          <CatIcon className="w-2.5 h-2.5" />
                          <span>{catConfig.label}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-amber-400 font-bold">{durationLabel}</span>
                        {item.speaker && (
                          <>
                            <span>·</span>
                            <span className="truncate">Speaker: {item.speaker}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Load to Stage button */}
                    <button
                      onClick={() => {
                        onLoadPreset(item);
                        setStatusMsg(`Queued "${item.title}" (${durationLabel}) directly to Stage Monitor`);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                        isCurrentActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title="Load this segment directly to the stage timer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isCurrentActive ? 'Active' : 'Queue'}</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEditItem(item)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                      title="Edit this segment (title, duration, speaker)"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete this segment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Changes save automatically to offline storage & backup profiles</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
