import type { Container, ShipConfig, StabilityData, PortStats } from '@/types';
import { slotToPosition } from '@/data/shipConfig';
import { PORT_COLORS } from '@/types';

export function calculateStability(
  containers: Container[],
  shipConfig: ShipConfig
): StabilityData {
  const stowedContainers = containers.filter(
    (c) => c.bay !== null && c.row !== null && c.tier !== null
  );

  const { shipLength, shipWidth, keelHeight, containerHeight, tiersBelowDeck } = shipConfig;

  const lightshipWeight = shipLength * shipWidth * 0.45;
  const lightshipLcg = shipLength * 0.02;
  const lightshipTcg = 0;
  const lightshipVcg = keelHeight + shipWidth * 0.32;

  if (stowedContainers.length === 0) {
    const displacementVol = lightshipWeight / 1.025;
    const draft = displacementVol / (shipLength * shipWidth);
    const buoyancyCenterZ = draft * 0.5;
    const transverseI = (shipLength * Math.pow(shipWidth, 3)) / 12;
    const longitudinalI = (shipWidth * Math.pow(shipLength, 3)) / 12;
    const bmT = transverseI / displacementVol;
    const bmL = longitudinalI / displacementVol;
    const gmT = buoyancyCenterZ + bmT - lightshipVcg;
    const gmL = buoyancyCenterZ + bmL - lightshipVcg;

    return {
      totalWeight: 0,
      teuCount: 0,
      cogX: lightshipLcg,
      cogY: lightshipTcg,
      cogZ: lightshipVcg,
      buoyancyCenterZ,
      gm: gmT,
      listAngle: 0,
      trimAngle: 0,
      rating: 'good',
      displacement: lightshipWeight,
      metacentricRadius: bmT,
    };
  }

  let cargoWeight = 0;
  let weightedX = 0;
  let weightedY = 0;
  let weightedZ = 0;
  let teuCount = 0;

  for (const container of stowedContainers) {
    const pos = slotToPosition(
      container.bay!,
      container.row!,
      container.tier!,
      shipConfig,
      container.size
    );

    cargoWeight += container.weight;
    weightedX += container.weight * pos.x;
    weightedY += container.weight * pos.y;
    weightedZ += container.weight * (pos.z + containerHeight / 2);
    teuCount += container.size === '40ft' ? 2 : 1;
  }

  const cargoCogX = weightedX / cargoWeight;
  const cargoCogY = weightedY / cargoWeight;
  const cargoCogZ = weightedZ / cargoWeight;

  const totalDisplacement = cargoWeight + lightshipWeight;
  const finalCogX = (cargoWeight * cargoCogX + lightshipWeight * lightshipLcg) / totalDisplacement;
  const finalCogY = (cargoWeight * cargoCogY + lightshipWeight * lightshipTcg) / totalDisplacement;
  const finalCogZ = (cargoWeight * cargoCogZ + lightshipWeight * lightshipVcg) / totalDisplacement;

  const displacementVol = totalDisplacement / 1.025;
  const draft = displacementVol / (shipLength * shipWidth);
  const buoyancyCenterZ = draft * 0.5;

  const transverseI = (shipLength * Math.pow(shipWidth, 3)) / 12;
  const longitudinalI = (shipWidth * Math.pow(shipLength, 3)) / 12;

  const bmT = transverseI / displacementVol;
  const bmL = longitudinalI / displacementVol;

  const gmT = buoyancyCenterZ + bmT - finalCogZ;
  const gmL = buoyancyCenterZ + bmL - finalCogZ;

  const listAngle = Math.atan2(finalCogY, gmT) * (180 / Math.PI);
  const trimAngle = Math.atan2(finalCogX, gmL) * (180 / Math.PI);

  let rating: StabilityData['rating'];
  const absList = Math.abs(listAngle);
  const absTrim = Math.abs(trimAngle);

  if (gmT > 1.5 && absList < 0.5 && absTrim < 0.3) {
    rating = 'excellent';
  } else if (gmT > 1.0 && absList < 1.5 && absTrim < 0.8) {
    rating = 'good';
  } else if (gmT > 0.5 && absList < 3 && absTrim < 1.5) {
    rating = 'fair';
  } else if (gmT > 0.15 && absList < 5) {
    rating = 'poor';
  } else {
    rating = 'danger';
  }

  return {
    totalWeight: cargoWeight,
    teuCount,
    cogX: finalCogX,
    cogY: finalCogY,
    cogZ: finalCogZ,
    buoyancyCenterZ,
    gm: gmT,
    listAngle,
    trimAngle,
    rating,
    displacement: totalDisplacement,
    metacentricRadius: bmT,
  };
}

export function calculatePortStats(
  containers: Container[]
): PortStats[] {
  const stowedContainers = containers.filter(
    (c) => c.bay !== null && c.row !== null && c.tier !== null
  );

  const portMap = new Map<string, { teu: number; weight: number; order: number }>();

  for (const container of stowedContainers) {
    const existing = portMap.get(container.dischargePort) || {
      teu: 0,
      weight: 0,
      order: container.portOrder,
    };
    existing.teu += container.size === '40ft' ? 2 : 1;
    existing.weight += container.weight;
    portMap.set(container.dischargePort, existing);
  }

  const stats: PortStats[] = [];
  for (const [portName, data] of portMap.entries()) {
    stats.push({
      portName,
      portOrder: data.order,
      teuCount: data.teu,
      totalWeight: data.weight,
      color: PORT_COLORS[portName] || '#888888',
    });
  }

  return stats.sort((a, b) => a.portOrder - b.portOrder);
}

export function getStabilityRatingColor(rating: StabilityData['rating']): string {
  switch (rating) {
    case 'excellent':
      return '#2ed573';
    case 'good':
      return '#7bed9f';
    case 'fair':
      return '#ffd32a';
    case 'poor':
      return '#ff6b35';
    case 'danger':
      return '#ff4757';
  }
}

export function getStabilityRatingText(rating: StabilityData['rating']): string {
  switch (rating) {
    case 'excellent':
      return '优秀';
    case 'good':
      return '良好';
    case 'fair':
      return '一般';
    case 'poor':
      return '较差';
    case 'danger':
      return '危险';
  }
}
