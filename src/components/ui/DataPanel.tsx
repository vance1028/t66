import { useStore } from '@/store/useStore';
import {
  Gauge,
  Scale,
  Navigation,
  ArrowUpDown,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Package,
  TrendingUp,
} from 'lucide-react';
import { getStabilityRatingColor, getStabilityRatingText } from '@/stability/calculator';
import type { ValidationRuleType } from '@/types';

const RULE_NAMES: Record<ValidationRuleType, string> = {
  weight_stack: '重不压轻',
  port_order: '翻箱问题',
  reefer_power: '冷藏箱电源',
  dangerous_isolation: '危险品隔离',
  size_fit: '尺寸适配',
  max_weight: '最大重量',
};

const RULE_COLORS: Record<ValidationRuleType, string> = {
  weight_stack: '#ffd32a',
  port_order: '#ff4757',
  reefer_power: '#2ed573',
  dangerous_isolation: '#ff6b35',
  size_fit: '#a55eea',
  max_weight: '#ff4757',
};

export function DataPanel() {
  const stabilityData = useStore((state) => state.stabilityData);
  const validationIssues = useStore((state) => state.validationIssues);
  const portStats = useStore((state) => state.portStats);
  const shipConfig = useStore((state) => state.shipConfig);

  const errorCount = validationIssues.filter((i) => i.severity === 'error').length;
  const warningCount = validationIssues.filter((i) => i.severity === 'warning').length;

  const ratingColor = getStabilityRatingColor(stabilityData.rating);
  const ratingText = getStabilityRatingText(stabilityData.rating);

  const totalSlots =
    shipConfig.bayCount *
    shipConfig.rowsPerSide *
    2 *
    (shipConfig.tiersBelowDeck + shipConfig.tiersAboveDeck);
  const utilization = (stabilityData.teuCount / totalSlots) * 100;

  const issuesByType = validationIssues.reduce((acc, issue) => {
    const type = issue.ruleType;
    if (!acc[type]) {
      acc[type] = { errors: 0, warnings: 0 };
    }
    if (issue.severity === 'error') {
      acc[type].errors++;
    } else {
      acc[type].warnings++;
    }
    return acc;
  }, {} as Record<string, { errors: number; warnings: number }>);

  return (
    <div className="w-80 bg-slate-900/80 backdrop-blur-sm border-l border-slate-700/50 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-orange-400" />
          稳性指标
        </h2>

        <div
          className="text-center py-4 mb-3 rounded-lg border"
          style={{
            backgroundColor: `${ratingColor}10`,
            borderColor: `${ratingColor}30`,
          }}
        >
          <div
            className="text-2xl font-bold mb-1"
            style={{ color: ratingColor }}
          >
            {ratingText}
          </div>
          <div className="text-xs text-slate-400">稳性评级</div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <DataItem
            label="GM 值"
            value={`${stabilityData.gm.toFixed(2)} m`}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            color={ratingColor}
          />
          <DataItem
            label="总重量"
            value={`${stabilityData.totalWeight.toFixed(1)} t`}
            icon={<Scale className="w-3.5 h-3.5" />}
            color="#00d4ff"
          />
          <DataItem
            label="TEU 箱量"
            value={`${stabilityData.teuCount}`}
            icon={<Package className="w-3.5 h-3.5" />}
            color="#2ed573"
          />
          <DataItem
            label="舱位利用率"
            value={`${utilization.toFixed(1)}%`}
            icon={<Info className="w-3.5 h-3.5" />}
            color="#ffd32a"
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ArrowUpDown className="w-3 h-3" />
              重心高度 (CoG Z)
            </span>
            <span className="text-slate-200 font-mono">
              {stabilityData.cogZ.toFixed(2)} m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3 h-3" />
              纵向重心 (CoG X)
            </span>
            <span className="text-slate-200 font-mono">
              {stabilityData.cogX.toFixed(2)} m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3 h-3" />
              横向重心 (CoG Y)
            </span>
            <span className="text-slate-200 font-mono">
              {stabilityData.cogY.toFixed(2)} m
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-xs font-semibold text-slate-400 mb-2">配平状态</h3>
        <div className="grid grid-cols-2 gap-2">
          <TrimIndicator
            label="纵倾"
            angle={stabilityData.trimAngle}
            direction={stabilityData.trimAngle > 0 ? '首倾' : '尾倾'}
          />
          <TrimIndicator
            label="横倾"
            angle={stabilityData.listAngle}
            direction={stabilityData.listAngle > 0 ? '右倾' : '左倾'}
          />
        </div>
      </div>

      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          约束校验
          <span className="ml-auto flex gap-2">
            {errorCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                {errorCount} 错误
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                {warningCount} 警告
              </span>
            )}
            {errorCount === 0 && warningCount === 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                全部通过
              </span>
            )}
          </span>
        </h2>

        <div className="space-y-2">
          {(Object.keys(RULE_NAMES) as ValidationRuleType[]).map((rule) => {
            const data = issuesByType[rule] || { errors: 0, warnings: 0 };
            const passed = data.errors === 0 && data.warnings === 0;

            return (
              <div
                key={rule}
                className="flex items-center justify-between py-1.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: RULE_COLORS[rule] }}
                  />
                  <span className="text-slate-300">{RULE_NAMES[rule]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {passed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      通过
                    </span>
                  ) : (
                    <>
                      {data.errors > 0 && (
                        <span className="text-red-400 flex items-center gap-0.5">
                          <XCircle className="w-3.5 h-3.5" />
                          {data.errors}
                        </span>
                      )}
                      {data.warnings > 0 && (
                        <span className="text-yellow-400 flex items-center gap-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {data.warnings}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 flex-1">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-cyan-400" />
          各港箱量
        </h2>

        <div className="space-y-2.5">
          {portStats.map((port) => (
            <div key={port.portName} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: port.color }}
                  />
                  <span className="text-slate-200 font-medium">{port.portName}</span>
                  <span className="text-slate-500 text-[10px]">
                    第 {port.portOrder} 港
                  </span>
                </div>
                <span className="text-slate-300 font-mono">
                  {port.teuCount} TEU
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(port.teuCount / Math.max(...portStats.map((p) => p.teuCount))) * 100}%`,
                    backgroundColor: port.color,
                  }}
                />
              </div>
              <div className="text-right text-[10px] text-slate-500 mt-0.5">
                {port.totalWeight.toFixed(1)} t
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataItem({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      className="p-2.5 rounded-lg border"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
        <span style={{ color }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-sm font-bold text-slate-100 font-mono">{value}</div>
    </div>
  );
}

function TrimIndicator({
  label,
  angle,
  direction,
}: {
  label: string;
  angle: number;
  direction: string;
}) {
  const absAngle = Math.abs(angle);
  const severity = absAngle > 3 ? 'danger' : absAngle > 1 ? 'warning' : 'good';
  const color =
    severity === 'danger'
      ? '#ff4757'
      : severity === 'warning'
        ? '#ffd32a'
        : '#2ed573';

  return (
    <div
      className="p-2.5 rounded-lg border"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
      <div className="text-base font-bold font-mono" style={{ color }}>
        {absAngle.toFixed(2)}°
      </div>
      <div className="text-[10px] text-slate-500">
        {absAngle < 0.1 ? '正浮' : direction}
      </div>
    </div>
  );
}
