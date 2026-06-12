export type ContainerSize = '20ft' | '40ft';

export interface ShipConfig {
  shipId: string;
  shipName: string;
  bayCount: number;
  rowsPerSide: number;
  tiersBelowDeck: number;
  tiersAboveDeck: number;
  containerLength20ft: number;
  containerWidth: number;
  containerHeight: number;
  hasPowerSlots: PowerSlotConfig[];
  size40ftBays: number[];
  maxWeightPerSlot: number;
  shipLength: number;
  shipWidth: number;
  keelHeight: number;
}

export interface PowerSlotConfig {
  bay: number;
  row: number;
  tier: number;
}

export interface CellSlot {
  slotId: string;
  bay: number;
  row: number;
  tier: number;
  isBelowDeck: boolean;
  hasPower: boolean;
  sizeType: ContainerSize | 'both';
  maxWeight: number;
}

export interface Container {
  containerNo: string;
  size: ContainerSize;
  weight: number;
  dischargePort: string;
  portOrder: number;
  isReefer: boolean;
  imoClass: string | null;
  bay: number | null;
  row: number | null;
  tier: number | null;
}

export type ValidationRuleType =
  | 'weight_stack'
  | 'port_order'
  | 'reefer_power'
  | 'dangerous_isolation'
  | 'size_fit'
  | 'max_weight';

export interface ValidationIssue {
  id: string;
  ruleType: ValidationRuleType;
  severity: 'error' | 'warning';
  containerNo: string;
  slotId?: string;
  message: string;
  relatedContainers?: string[];
}

export interface StabilityData {
  totalWeight: number;
  teuCount: number;
  cogX: number;
  cogY: number;
  cogZ: number;
  buoyancyCenterZ: number;
  gm: number;
  listAngle: number;
  trimAngle: number;
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'danger';
  displacement: number;
  metacentricRadius: number;
}

export interface PortStats {
  portName: string;
  portOrder: number;
  teuCount: number;
  totalWeight: number;
  color: string;
}

export interface ViewState {
  showRack: boolean;
  showBelowDeck: boolean;
  showAboveDeck: boolean;
  highlightPort: string | null;
  selectedContainer: string | null;
  baySlice: number | null;
  showViolationsOnly: boolean;
}

export interface StoreState {
  shipConfig: ShipConfig;
  cellSlots: CellSlot[];
  containers: Container[];
  validationIssues: ValidationIssue[];
  stabilityData: StabilityData;
  portStats: PortStats[];
  viewState: ViewState;
  setSelectedContainer: (containerNo: string | null) => void;
  setHighlightPort: (portName: string | null) => void;
  setBaySlice: (bay: number | null) => void;
  toggleShowRack: () => void;
  toggleShowBelowDeck: () => void;
  toggleShowAboveDeck: () => void;
  toggleShowViolationsOnly: () => void;
  recomputeAll: () => void;
}

export const PORT_COLORS: Record<string, string> = {
  'Shanghai': '#00d4ff',
  'Singapore': '#ff6b35',
  'Rotterdam': '#2ed573',
  'Hamburg': '#ffd32a',
  'Los Angeles': '#ff4757',
  'Dubai': '#a55eea',
  'Hong Kong': '#26de81',
  'Busan': '#eb3b5a',
};
