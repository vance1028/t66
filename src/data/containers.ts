import type { Container, ShipConfig, CellSlot } from '@/types';

const PORTS = [
  { name: 'Shanghai', order: 1 },
  { name: 'Singapore', order: 2 },
  { name: 'Dubai', order: 3 },
  { name: 'Rotterdam', order: 4 },
  { name: 'Hamburg', order: 5 },
];

const IMO_CLASSES = ['1.1', '2.1', '3', '4.1', '5.1', '6.1', '8', '9'];

function generateContainerNo(index: number): string {
  const prefix = ['MSKU', 'MAEU', 'CSLU', 'EMCU', 'HLCU', 'YMLU', 'ONEU', 'COSU'];
  const p = prefix[index % prefix.length];
  const num = String(100000 + index).padStart(6, '0');
  return `${p}${num}`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateMockContainers(shipConfig: ShipConfig): Container[] {
  const containers: Container[] = [];
  const { bayCount, rowsPerSide, tiersBelowDeck, tiersAboveDeck, hasPowerSlots } = shipConfig;
  const totalTiers = tiersBelowDeck + tiersAboveDeck;
  const rand = seededRandom(42);
  const totalRows = rowsPerSide * 2;

  const powerSet = new Set(
    hasPowerSlots.map((s) => `${s.bay}-${s.row}-${s.tier}`)
  );

  const tierPortMap = new Map<number, { name: string; order: number }>();
  for (let tier = 1; tier <= totalTiers; tier++) {
    const norm = (tier - 1) / (totalTiers - 1);
    const portIdx = Math.min(
      PORTS.length - 1,
      Math.max(0, Math.floor(norm * PORTS.length + (rand() - 0.5) * 0.8))
    );
    tierPortMap.set(tier, PORTS[portIdx]);
  }

  const tierWeightBase = new Map<number, number>();
  for (let tier = 1; tier <= totalTiers; tier++) {
    const norm = (tier - 1) / (totalTiers - 1);
    const base = 22 - norm * 14;
    tierWeightBase.set(tier, base);
  }

  let idx = 0;
  const usedSlots = new Set<string>();
  const reeferSlots = Array.from(powerSet);
  let reeferIdx = 0;

  for (let bay = 0; bay < bayCount; bay++) {
    const is40ftBay = shipConfig.size40ftBays.includes(bay);

    for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
      const row = (rowIdx - rowsPerSide + 0.5) * 2;
      const rowRounded = Math.round(row);
      const absRow = Math.abs(rowRounded);

      let columnEmptyFromTier = totalTiers + 1;
      for (let tier = totalTiers; tier >= 1; tier--) {
        if (rand() < 0.12 && tier < columnEmptyFromTier - 1) {
          columnEmptyFromTier = tier;
        }
      }

      const isDangerousRow = absRow >= 6;
      const dangerousTiers: number[] = [];
      if (isDangerousRow && rand() < 0.3) {
        for (let tier = tiersBelowDeck + 1; tier <= totalTiers; tier++) {
          if (rand() < 0.15) dangerousTiers.push(tier);
        }
      }

      for (let tier = 1; tier <= totalTiers; tier++) {
        if (tier >= columnEmptyFromTier) continue;

        const slotKey = `${bay}-${rowRounded}-${tier}`;
        if (usedSlots.has(slotKey)) continue;

        const is40ft = is40ftBay && rand() > 0.4;
        if (is40ft && bay === bayCount - 1) continue;

        const hasPower = powerSet.has(slotKey);
        const isReefer = hasPower && reeferIdx < reeferSlots.length && rand() < 0.5;
        if (isReefer) reeferIdx++;

        const isDangerous = dangerousTiers.includes(tier);
        const imoClass = isDangerous
          ? IMO_CLASSES[Math.floor(rand() * IMO_CLASSES.length)]
          : null;

        const port = tierPortMap.get(tier)!;
        const baseW = tierWeightBase.get(tier)!;
        const weightVar = (rand() - 0.5) * 2;
        const weight = Math.max(6, Math.min(28, baseW + weightVar));

        if (is40ft) {
          const nextSlotKey = `${bay + 1}-${rowRounded}-${tier}`;
          if (usedSlots.has(nextSlotKey)) continue;
          usedSlots.add(slotKey);
          usedSlots.add(nextSlotKey);

          containers.push({
            containerNo: generateContainerNo(idx++),
            size: '40ft',
            weight: Math.round(weight * 1.8 * 10) / 10,
            dischargePort: port.name,
            portOrder: port.order,
            isReefer,
            imoClass,
            bay,
            row: rowRounded,
            tier,
          });
        } else {
          usedSlots.add(slotKey);

          containers.push({
            containerNo: generateContainerNo(idx++),
            size: '20ft',
            weight: Math.round(weight * 10) / 10,
            dischargePort: port.name,
            portOrder: port.order,
            isReefer,
            imoClass,
            bay,
            row: rowRounded,
            tier,
          });
        }
      }
    }
  }

  return containers;
}

export function getPortsList(): { name: string; order: number }[] {
  return [...PORTS].sort((a, b) => a.order - b.order);
}
