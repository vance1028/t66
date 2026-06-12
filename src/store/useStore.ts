import { create } from 'zustand';
import type { StoreState, Container, CellSlot, StabilityData, PortStats, ValidationIssue } from '@/types';
import { defaultShipConfig, generateCellSlots } from '@/data/shipConfig';
import { generateMockContainers } from '@/data/containers';
import { validateAll } from '@/stowage/validation';
import { calculateStability, calculatePortStats } from '@/stability/calculator';

const initialCellSlots = generateCellSlots(defaultShipConfig);
const initialContainers = generateMockContainers(defaultShipConfig);
const initialValidationIssues = validateAll(initialContainers, initialCellSlots, defaultShipConfig);
const initialStability = calculateStability(initialContainers, defaultShipConfig);
const initialPortStats = calculatePortStats(initialContainers);

export const useStore = create<StoreState>((set, get) => ({
  shipConfig: defaultShipConfig,
  cellSlots: initialCellSlots,
  containers: initialContainers,
  validationIssues: initialValidationIssues,
  stabilityData: initialStability,
  portStats: initialPortStats,
  viewState: {
    showRack: true,
    showBelowDeck: true,
    showAboveDeck: true,
    highlightPort: null,
    selectedContainer: null,
    baySlice: null,
    showViolationsOnly: false,
  },

  setSelectedContainer: (containerNo: string | null) =>
    set((state) => ({
      viewState: { ...state.viewState, selectedContainer: containerNo },
    })),

  setHighlightPort: (portName: string | null) =>
    set((state) => ({
      viewState: { ...state.viewState, highlightPort: portName },
    })),

  setBaySlice: (bay: number | null) =>
    set((state) => ({
      viewState: { ...state.viewState, baySlice: bay },
    })),

  toggleShowRack: () =>
    set((state) => ({
      viewState: { ...state.viewState, showRack: !state.viewState.showRack },
    })),

  toggleShowBelowDeck: () =>
    set((state) => ({
      viewState: { ...state.viewState, showBelowDeck: !state.viewState.showBelowDeck },
    })),

  toggleShowAboveDeck: () =>
    set((state) => ({
      viewState: { ...state.viewState, showAboveDeck: !state.viewState.showAboveDeck },
    })),

  toggleShowViolationsOnly: () =>
    set((state) => ({
      viewState: { ...state.viewState, showViolationsOnly: !state.viewState.showViolationsOnly },
    })),

  recomputeAll: () => {
    const { containers, cellSlots, shipConfig } = get();
    const issues = validateAll(containers, cellSlots, shipConfig);
    const stability = calculateStability(containers, shipConfig);
    const portStats = calculatePortStats(containers);
    set({
      validationIssues: issues,
      stabilityData: stability,
      portStats,
    });
  },
}));
