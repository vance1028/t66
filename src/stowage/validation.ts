import type { Container, CellSlot, ValidationIssue, ShipConfig } from '@/types';

export function validateAll(
  containers: Container[],
  cellSlots: CellSlot[],
  shipConfig: ShipConfig
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const stowedContainers = containers.filter(
    (c) => c.bay !== null && c.row !== null && c.tier !== null
  );

  issues.push(...validateWeightStacking(stowedContainers, shipConfig));
  issues.push(...validatePortOrder(stowedContainers, shipConfig));
  issues.push(...validateReeferPower(stowedContainers, cellSlots));
  issues.push(...validateDangerousIsolation(stowedContainers, shipConfig));
  issues.push(...validateSizeFit(stowedContainers, cellSlots, shipConfig));

  return issues;
}

function validateWeightStacking(
  containers: Container[],
  shipConfig: ShipConfig
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { bayCount } = shipConfig;

  for (let bay = 0; bay < bayCount; bay++) {
    const bayContainers = containers.filter((c) => c.bay === bay);
    const rows = new Set(bayContainers.map((c) => c.row));

    for (const row of rows) {
      const column = bayContainers
        .filter((c) => c.row === row)
        .sort((a, b) => a.tier! - b.tier!);

      for (let i = 1; i < column.length; i++) {
        const lower = column[i - 1];
        const upper = column[i];

        if (upper.weight > lower.weight * 1.1) {
          issues.push({
            id: `weight-${upper.containerNo}`,
            ruleType: 'weight_stack',
            severity: upper.weight > lower.weight * 1.3 ? 'error' : 'warning',
            containerNo: upper.containerNo,
            message: `重不压轻违规: 上层箱 ${upper.containerNo}(${upper.weight}t) 重于下层箱 ${lower.containerNo}(${lower.weight}t)`,
            relatedContainers: [lower.containerNo],
          });
        }
      }
    }
  }

  return issues;
}

function validatePortOrder(
  containers: Container[],
  shipConfig: ShipConfig
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { bayCount } = shipConfig;

  for (let bay = 0; bay < bayCount; bay++) {
    const bayContainers = containers.filter((c) => c.bay === bay);
    const rows = new Set(bayContainers.map((c) => c.row));

    for (const row of rows) {
      const column = bayContainers
        .filter((c) => c.row === row)
        .sort((a, b) => a.tier! - b.tier!);

      for (let i = 0; i < column.length; i++) {
        for (let j = i + 1; j < column.length; j++) {
          const lower = column[i];
          const upper = column[j];

          if (lower.portOrder > upper.portOrder) {
            issues.push({
              id: `portorder-${upper.containerNo}-${lower.containerNo}`,
              ruleType: 'port_order',
              severity: 'error',
              containerNo: upper.containerNo,
              message: `翻箱问题: 后卸港口 ${upper.dischargePort}(第${upper.portOrder}港) 的箱子压在先卸港口 ${lower.dischargePort}(第${lower.portOrder}港) 的箱子上面`,
              relatedContainers: [lower.containerNo],
            });
            break;
          }
        }
      }
    }
  }

  return issues;
}

function validateReeferPower(
  containers: Container[],
  cellSlots: CellSlot[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const slotMap = new Map(cellSlots.map((s) => [s.slotId, s]));

  for (const container of containers) {
    if (!container.isReefer) continue;
    if (container.bay === null || container.row === null || container.tier === null) continue;

    const slotId = `${container.bay}-${container.row}-${container.tier}`;
    const slot = slotMap.get(slotId);

    if (!slot || !slot.hasPower) {
      issues.push({
        id: `reefer-${container.containerNo}`,
        ruleType: 'reefer_power',
        severity: 'error',
        containerNo: container.containerNo,
        message: `冷藏箱 ${container.containerNo} 放置在无电源箱位`,
        slotId,
      });
    }
  }

  return issues;
}

function validateDangerousIsolation(
  containers: Container[],
  shipConfig: ShipConfig
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const dangerousContainers = containers.filter((c) => c.imoClass !== null);

  const normalContainers = containers.filter((c) => c.imoClass === null);

  for (const dg of dangerousContainers) {
    if (dg.bay === null || dg.row === null || dg.tier === null) continue;

    for (const normal of normalContainers) {
      if (normal.bay === null || normal.row === null || normal.tier === null) continue;

      const bayDist = Math.abs(dg.bay - normal.bay);
      const rowDist = Math.abs(dg.row! - normal.row!);
      const tierDist = Math.abs(dg.tier! - normal.tier!);

      if (bayDist <= 1 && rowDist <= 2 && tierDist <= 1) {
        const isAdjacent = bayDist <= 1 && rowDist <= 1 && tierDist === 0;
        if (isAdjacent) {
          issues.push({
            id: `isolation-${dg.containerNo}-${normal.containerNo}`,
            ruleType: 'dangerous_isolation',
            severity: 'warning',
            containerNo: dg.containerNo,
            message: `危险品箱 ${dg.containerNo} (IMO ${dg.imoClass}) 与普通箱 ${normal.containerNo} 相邻，建议保持隔离`,
            relatedContainers: [normal.containerNo],
          });
        }
      }
    }
  }

  return issues;
}

function validateSizeFit(
  containers: Container[],
  cellSlots: CellSlot[],
  shipConfig: ShipConfig
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const slotMap = new Map(cellSlots.map((s) => [s.slotId, s]));

  for (const container of containers) {
    if (container.bay === null || container.row === null || container.tier === null) continue;

    if (container.size === '40ft') {
      const slotId = `${container.bay}-${container.row}-${container.tier}`;
      const slot = slotMap.get(slotId);

      if (slot && slot.sizeType === '20ft') {
        issues.push({
          id: `sizefit-${container.containerNo}`,
          ruleType: 'size_fit',
          severity: 'error',
          containerNo: container.containerNo,
          message: `40尺箱 ${container.containerNo} 不能放置在仅支持20尺的箱位`,
          slotId,
        });
      }

      if (container.bay >= shipConfig.bayCount - 1) {
        issues.push({
          id: `sizefit-end-${container.containerNo}`,
          ruleType: 'size_fit',
          severity: 'error',
          containerNo: container.containerNo,
          message: `40尺箱 ${container.containerNo} 超出船尾范围`,
        });
      }
    }
  }

  return issues;
}

export function getIssuesByContainer(
  issues: ValidationIssue[],
  containerNo: string
): ValidationIssue[] {
  return issues.filter(
    (i) =>
      i.containerNo === containerNo ||
      i.relatedContainers?.includes(containerNo)
  );
}

export function hasViolation(
  issues: ValidationIssue[],
  containerNo: string
): boolean {
  return getIssuesByContainer(issues, containerNo).some(
    (i) => i.severity === 'error'
  );
}

export function hasWarning(
  issues: ValidationIssue[],
  containerNo: string
): boolean {
  return getIssuesByContainer(issues, containerNo).some(
    (i) => i.severity === 'warning'
  );
}
