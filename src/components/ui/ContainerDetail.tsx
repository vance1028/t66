import { useStore } from '@/store/useStore';
import { X, Package, Weight, Anchor, Thermometer, AlertTriangle, Box, Ruler } from 'lucide-react';
import { PORT_COLORS } from '@/types';
import { getIssuesByContainer } from '@/stowage/validation';

export function ContainerDetail() {
  const selectedContainer = useStore((state) => state.viewState.selectedContainer);
  const containers = useStore((state) => state.containers);
  const validationIssues = useStore((state) => state.validationIssues);
  const setSelectedContainer = useStore((state) => state.setSelectedContainer);

  const container = containers.find((c) => c.containerNo === selectedContainer);

  if (!selectedContainer || !container) return null;

  const issues = getIssuesByContainer(validationIssues, selectedContainer);
  const portColor = PORT_COLORS[container.dischargePort] || '#888888';

  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-700/60 shadow-2xl z-10">
      <div
        className="h-1 rounded-t-xl"
        style={{
          background: hasErrors
            ? 'linear-gradient(90deg, #ff4757, #ff6b35)'
            : hasWarnings
              ? 'linear-gradient(90deg, #ffd32a, #ff6b35)'
              : `linear-gradient(90deg, ${portColor}, #00d4ff)`,
        }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white font-mono tracking-wide">
                {container.containerNo}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${portColor}20`,
                  color: portColor,
                }}
              >
                {container.dischargePort}
              </span>
              <span className="text-slate-400">第 {container.portOrder} 卸货港</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedContainer(null)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <InfoCard
            icon={<Weight className="w-4 h-4" />}
            label="重量"
            value={`${container.weight.toFixed(1)} t`}
            color="#00d4ff"
          />
          <InfoCard
            icon={<Ruler className="w-4 h-4" />}
            label="尺寸"
            value={container.size}
            color="#2ed573"
          />
          <InfoCard
            icon={<Box className="w-4 h-4" />}
            label="位置"
            value={`${container.bay! + 1}/${container.row}/${container.tier}`}
            color="#ffd32a"
          />
        </div>

        <div className="flex gap-4 mb-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Bay:</span>
            <span className="text-slate-200 font-mono">{container.bay! + 1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Row:</span>
            <span className="text-slate-200 font-mono">{container.row}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Tier:</span>
            <span className="text-slate-200 font-mono">{container.tier}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">区域:</span>
            <span className="text-slate-200">
              {container.tier! <= 4 ? '舱内' : '甲板上'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {container.isReefer && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
              <Thermometer className="w-3.5 h-3.5" />
              冷藏箱
            </div>
          )}
          {container.imoClass && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              危险品 IMO {container.imoClass}
            </div>
          )}
        </div>

        {issues.length > 0 && (
          <div className="border-t border-slate-700/50 pt-3 mt-2">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              违规问题 ({issues.length})
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`text-xs p-2 rounded ${
                    issue.severity === 'error'
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                      : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-300'
                  }`}
                >
                  <div className="font-medium mb-0.5">
                    {issue.severity === 'error' ? '错误' : '警告'}: {issue.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="p-2.5 rounded-lg border text-center"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      <div className="flex justify-center mb-1" style={{ color }}>
        {icon}
      </div>
      <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
      <div className="text-sm font-bold text-slate-100 font-mono">{value}</div>
    </div>
  );
}
