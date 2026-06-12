import type { ShipConfig, CellSlot, PowerSlotConfig } from '@/types';

export const defaultShipConfig: ShipConfig = {
  shipId: 'ship-001',
  shipName: 'Pacific Voyager',
  bayCount: 10,
  rowsPerSide: 5,
  tiersBelowDeck: 4,
  tiersAboveDeck: 5,
  containerLength20ft: 6.058,
  containerWidth: 2.438,
  containerHeight: 2.591,
  maxWeightPerSlot: 30.48,
  shipLength: 120,
  shipWidth: 25,
  keelHeight: 5,
  size40ftBays: [0, 1, 2, 3, 6, 7, 8, 9],
  hasPowerSlots: generatePowerSlots(),
};

function generatePowerSlots(): PowerSlotConfig[] {
  const slots: PowerSlotConfig[] = [];
  const powerBays = [0, 2, 4, 6, 8];
  const powerRows = [-5, -3, -1, 0, 1, 3, 5];
  
  for (const bay of powerBays) {
    for (const row of powerRows) {
      for (let tier = 1; tier <= 5; tier++) {
        slots.push({ bay, row, tier });
      }
    }
  }
  return slots;
}

export function generateCellSlots(shipConfig: ShipConfig): CellSlot[] {
  const slots: CellSlot[] = [];
  const {
    bayCount,
    rowsPerSide,
    tiersBelowDeck,
    tiersAboveDeck,
    size40ftBays,
    hasPowerSlots,
    maxWeightPerSlot,
  } = shipConfig;

  const hasPowerSet = new Set(
    hasPowerSlots.map((s) => `${s.bay}-${s.row}-${s.tier}`)
  );

  for (let bay = 0; bay < bayCount; bay++) {
    const is40ftBay = size40ftBays.includes(bay);
    const sizeType = is40ftBay ? 'both' : '20ft';

    for (let rowSide = -rowsPerSide; rowSide <= rowsPerSide; rowSide++) {
      const row = rowSide * 2 - (rowSide > 0 ? 1 : 0);

      for (let tier = 1; tier <= tiersBelowDeck + tiersAboveDeck; tier++) {
        const isBelowDeck = tier <= tiersBelowDeck;
        const slotId = `${bay}-${row}-${tier}`;
        const hasPower = hasPowerSet.has(`${bay}-${row}-${tier}`);

        slots.push({
          slotId,
          bay,
          row,
          tier,
          isBelowDeck,
          hasPower,
          sizeType,
          maxWeight: maxWeightPerSlot,
        });
      }
    }
  }

  return slots;
}

export function slotToPosition(
  bay: number,
  row: number,
  tier: number,
  shipConfig: ShipConfig,
  size: '20ft' | '40ft' = '20ft'
): { x: number; y: number; z: number } {
  const {
    containerLength20ft,
    containerWidth,
    containerHeight,
    bayCount,
    keelHeight,
    tiersBelowDeck,
  } = shipConfig;

  const length = size === '40ft' ? containerLength20ft * 2 : containerLength20ft;
  
  const x = (bay - (bayCount - 1) / 2) * containerLength20ft * 2 + (size === '40ft' ? containerLength20ft * 0.5 : 0);
  const y = (row / 2) * containerWidth * 2;
  const z = keelHeight + (tier - 1) * containerHeight;

  return { x, y, z };
}

export function getContainerDimensions(
  size: '20ft' | '40ft',
  shipConfig: ShipConfig
): { width: number; height: number; depth: number } {
  return {
    width: size === '40ft' ? shipConfig.containerLength20ft * 2 : shipConfig.containerLength20ft,
    height: shipConfig.containerHeight,
    depth: shipConfig.containerWidth * 2 - 0.1,
  };
}
