import { useStore } from '@/store/useStore';
import { Layers, Layers2, Box, Ship, Eye, EyeOff, Slice, RotateCcw } from 'lucide-react';

export function Toolbar() {
  const viewState = useStore((state) => state.viewState);
  const shipConfig = useStore((state) => state.shipConfig);
  const toggleShowRack = useStore((state) => state.toggleShowRack);
  const toggleShowBelowDeck = useStore((state) => state.toggleShowBelowDeck);
  const toggleShowAboveDeck = useStore((state) => state.toggleShowAboveDeck);
  const setBaySlice = useStore((state) => state.setBaySlice);
  const recomputeAll = useStore((state) => state.recomputeAll);

  const bays = Array.from({ length: shipConfig.bayCount }, (_, i) => i);

  return (
    <div className="h-14 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 flex items-center px-4 gap-6">
      <div className="flex items-center gap-3">
        <Ship className="w-7 h-7 text-cyan-400" />
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            集装箱船积载可视化
          </h1>
          <p className="text-xs text-slate-400">{shipConfig.shipName}</p>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-700" />

      <div className="flex items-center gap-1">
        <button
          onClick={toggleShowRack}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
            viewState.showRack
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
          }`}
        >
          <Layers2 className="w-4 h-4" />
          <span>箱架</span>
        </button>

        <button
          onClick={toggleShowBelowDeck}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
            viewState.showBelowDeck
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
          }`}
        >
          {viewState.showBelowDeck ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>舱内</span>
        </button>

        <button
          onClick={toggleShowAboveDeck}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
            viewState.showAboveDeck
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
          }`}
        >
          {viewState.showAboveDeck ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>甲板上</span>
        </button>
      </div>

      <div className="h-8 w-px bg-slate-700" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Slice className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">贝位切片:</span>
        </div>
        <select
          value={viewState.baySlice ?? ''}
          onChange={(e) => setBaySlice(e.target.value === '' ? null : Number(e.target.value))}
          className="bg-slate-800/80 text-slate-200 text-sm rounded px-2.5 py-1.5 border border-slate-600/50 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="">全部</option>
          {bays.map((bay) => (
            <option key={bay} value={bay}>
              Bay {bay + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      <button
        onClick={recomputeAll}
        className="flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        <span>重新计算</span>
      </button>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Box className="w-4 h-4" />
        <span>拖拽旋转 · 滚轮缩放 · 点击选箱</span>
      </div>
    </div>
  );
}
