import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Search, Package, Thermometer, AlertTriangle, Anchor } from 'lucide-react';
import { PORT_COLORS } from '@/types';

export function ContainerList() {
  const containers = useStore((state) => state.containers);
  const validationIssues = useStore((state) => state.validationIssues);
  const portStats = useStore((state) => state.portStats);
  const viewState = useStore((state) => state.viewState);
  const setSelectedContainer = useStore((state) => state.setSelectedContainer);
  const setHighlightPort = useStore((state) => state.setHighlightPort);
  const toggleShowViolationsOnly = useStore((state) => state.toggleShowViolationsOnly);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPort, setFilterPort] = useState<string | null>(null);

  const violationMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const issue of validationIssues) {
      if (issue.severity === 'error') {
        map.set(issue.containerNo, true);
        issue.relatedContainers?.forEach((c) => map.set(c, true));
      }
    }
    return map;
  }, [validationIssues]);

  const warningMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const issue of validationIssues) {
      if (issue.severity === 'warning') {
        map.set(issue.containerNo, true);
      }
    }
    return map;
  }, [validationIssues]);

  const filteredContainers = useMemo(() => {
    let result = containers.filter((c) => c.bay !== null);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.containerNo.toLowerCase().includes(q));
    }

    if (filterPort) {
      result = result.filter((c) => c.dischargePort === filterPort);
    }

    if (viewState.showViolationsOnly) {
      result = result.filter((c) => violationMap.has(c.containerNo));
    }

    return result.slice(0, 200);
  }, [containers, searchQuery, filterPort, viewState.showViolationsOnly, violationMap]);

  const handleContainerClick = (containerNo: string) => {
    setSelectedContainer(
      viewState.selectedContainer === containerNo ? null : containerNo
    );
  };

  const handlePortClick = (portName: string) => {
    const newPort = viewState.highlightPort === portName ? null : portName;
    setHighlightPort(newPort);
    setFilterPort(newPort);
  };

  return (
    <div className="w-72 bg-slate-900/80 backdrop-blur-sm border-r border-slate-700/50 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-cyan-400" />
          箱单列表
          <span className="ml-auto text-xs font-normal text-slate-500">
            共 {containers.filter((c) => c.bay !== null).length} 箱
          </span>
        </h2>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索箱号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/70 text-slate-200 text-sm pl-9 pr-3 py-2 rounded border border-slate-700/50 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-300">
          <input
            type="checkbox"
            checked={viewState.showViolationsOnly}
            onChange={toggleShowViolationsOnly}
            className="rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500/20"
          />
          只显示违规箱子
        </label>
      </div>

      <div className="p-3 border-b border-slate-700/50">
        <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
          <Anchor className="w-3.5 h-3.5" />
          卸货港
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {portStats.map((port) => (
            <button
              key={port.portName}
              onClick={() => handlePortClick(port.portName)}
              className={`text-xs px-2 py-1 rounded font-medium transition-all ${
                viewState.highlightPort === port.portName
                  ? 'ring-2 ring-offset-1 ring-offset-slate-900'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: `${port.color}20`,
                color: port.color,
                border: `1px solid ${port.color}40`,
                boxShadow: viewState.highlightPort === port.portName ? `0 0 0 2px ${port.color}` : 'none',
              }}
            >
              {port.portName}
              <span className="ml-1 text-slate-400">{port.teuCount}TEU</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <Package className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">没有匹配的箱子</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filteredContainers.map((container) => {
              const hasViolation = violationMap.has(container.containerNo);
              const hasWarning = warningMap.has(container.containerNo);
              const isSelected = viewState.selectedContainer === container.containerNo;
              const portColor = PORT_COLORS[container.dischargePort] || '#888888';

              return (
                <div
                  key={container.containerNo}
                  onClick={() => handleContainerClick(container.containerNo)}
                  className={`px-3 py-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/15 border-l-2 border-cyan-400'
                      : hasViolation
                        ? 'bg-red-500/5 border-l-2 border-red-500/50 hover:bg-red-500/10'
                        : 'border-l-2 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-mono font-semibold"
                      style={{ color: isSelected ? '#22d3ee' : '#cbd5e1' }}
                    >
                      {container.containerNo}
                    </span>
                    <div className="flex items-center gap-1">
                      {container.isReefer && (
                        <span title="冷藏箱">
                          <Thermometer
                            className="w-3.5 h-3.5 text-emerald-400"
                          />
                        </span>
                      )}
                      {container.imoClass && (
                        <span title={`危险品 IMO ${container.imoClass}`}>
                          <AlertTriangle
                            className="w-3.5 h-3.5 text-red-400"
                          />
                        </span>
                      )}
                      {hasViolation && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">
                          违规
                        </span>
                      )}
                      {hasWarning && !hasViolation && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                          警告
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: portColor }}
                    />
                    <span>{container.dischargePort}</span>
                    <span className="text-slate-600">·</span>
                    <span>{container.weight.toFixed(1)}t</span>
                    <span className="text-slate-600">·</span>
                    <span>{container.size}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Bay {container.bay! + 1} · Row {container.row! > 0 ? `0${container.row!}` : container.row!} · Tier {container.tier}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
