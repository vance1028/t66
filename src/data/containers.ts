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
  const { bayCount, rowsPerSide, tiersBelowDeck, tiersAboveDeck } = shipConfig;
  const totalTiers = tiersBelowDeck + tiersAboveDeck;
  const rand = seededRandom(42);
  const totalRows = rowsPerSide * 2;

  let idx = 0;

  for (let bay = 0; bay < bayCount; bay++) {
    const is40ftBay = shipConfig.size40ftBays.includes(bay);
    
    for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
      const row = (rowIdx - rowsPerSide + 0.5) * 2;
      const absRow = Math.abs(row);
      
      const fillRate = 0.7 + rand() * 0.25;
      
      for (let tier = 1; tier <= totalTiers; tier++) {
        if (rand() > fillRate - tier * 0.03) continue;

        const is40ft = is40ftBay && rand() > 0.5;
        if (is40ft && bay === bayCount - 1) continue;

        const portIdx = Math.min(
          PORTS.length - 1,
          Math.floor(rand() * PORTS.length)
        );
        const port = PORTS[portIdx];

        const baseWeight = 8 + rand() * 15;
        const tierAdjust = 1 - (tier - 1) * 0.08;
        const weight = Math.round(baseWeight * tierAdjust * 10) / 10;

        const isReefer = rand() < 0.08 && tier <= 6;
        const imoClass = rand() < 0.05 ? IMO_CLASSES[Math.floor(rand() * IMO_CLASSES.length)] : null;

        if (is40ft) {
          containers.push({
            containerNo: generateContainerNo(idx++),
            size: '40ft',
            weight: weight * 1.8,
            dischargePort: port.name,
            portOrder: port.order,
            isReefer,
            imoClass,
            bay,
            row: Math.round(row),
            tier,
          });
        } else {
          containers.push({
            containerNo: generateContainerNo(idx++),
            size: '20ft',
            weight,
            dischargePort: port.name,
            portOrder: port.order,
            isReefer,
            imoClass,
            bay,
            row: Math.round(row),
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
