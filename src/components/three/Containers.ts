import * as THREE from 'three';
import type { Container, ShipConfig, ValidationIssue } from '@/types';
import { slotToPosition, getContainerDimensions } from '@/data/shipConfig';
import { PORT_COLORS } from '@/types';

const REEFER_MARKER_COLOR = 0x2ed573;
const DANGEROUS_MARKER_COLOR = 0xff4757;
const SELECTED_EMISSIVE = 0x00d4ff;
const VIOLATION_EMISSIVE = 0xff4757;

export class ContainerMesh extends THREE.Group {
  containerNo: string;
  bay: number;
  row: number;
  tier: number;
  isBelowDeck: boolean;
  isSelected: boolean = false;
  isViolation: boolean = false;
  isDimmed: boolean = false;

  private boxMesh: THREE.Mesh;
  private topLabel: THREE.Mesh;
  private reeferMarker?: THREE.Mesh;
  private dangerousMarker?: THREE.Mesh;

  constructor(container: Container, shipConfig: ShipConfig) {
    super();

    this.containerNo = container.containerNo;
    this.bay = container.bay!;
    this.row = container.row!;
    this.tier = container.tier!;
    this.isBelowDeck = this.tier <= shipConfig.tiersBelowDeck;

    const dims = getContainerDimensions(container.size, shipConfig);
    const pos = slotToPosition(
      container.bay!,
      container.row!,
      container.tier!,
      shipConfig,
      container.size
    );

    this.position.set(pos.x, pos.z + dims.height / 2, pos.y);

    const portColor = PORT_COLORS[container.dischargePort] || '#888888';

    const geometry = new THREE.BoxGeometry(dims.width - 0.05, dims.height - 0.05, dims.depth - 0.05);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(portColor),
      metalness: 0.3,
      roughness: 0.7,
      transparent: true,
      opacity: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    this.boxMesh = new THREE.Mesh(geometry, material);
    this.boxMesh.castShadow = true;
    this.boxMesh.receiveShadow = true;
    this.add(this.boxMesh);

    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    this.add(edges);

    if (container.isReefer) {
      const reeferGeo = new THREE.BoxGeometry(dims.width * 0.8, 0.15, dims.depth * 0.25);
      const reeferMat = new THREE.MeshStandardMaterial({
        color: REEFER_MARKER_COLOR,
        emissive: REEFER_MARKER_COLOR,
        emissiveIntensity: 0.5,
      });
      this.reeferMarker = new THREE.Mesh(reeferGeo, reeferMat);
      this.reeferMarker.position.set(0, dims.height / 2 - 0.3, dims.depth / 2 - 0.2);
      this.add(this.reeferMarker);
    }

    if (container.imoClass) {
      const dgGeo = new THREE.CircleGeometry(0.4, 16);
      const dgMat = new THREE.MeshBasicMaterial({
        color: DANGEROUS_MARKER_COLOR,
        side: THREE.DoubleSide,
      });
      this.dangerousMarker = new THREE.Mesh(dgGeo, dgMat);
      this.dangerousMarker.position.set(0, dims.height / 2 - 0.8, dims.depth / 2 + 0.01);
      this.add(this.dangerousMarker);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(container.containerNo, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(dims.width * 0.8, dims.height * 0.2);
    const labelMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    this.topLabel = new THREE.Mesh(labelGeo, labelMat);
    this.topLabel.position.set(0, dims.height / 2 + 0.1, 0);
    this.topLabel.rotation.x = -Math.PI / 2;
    this.add(this.topLabel);

    this.userData = {
      type: 'container',
      containerNo: container.containerNo,
      container,
    };
  }

  setSelected(selected: boolean) {
    this.isSelected = selected;
    const mat = this.boxMesh.material as THREE.MeshStandardMaterial;
    if (selected) {
      mat.emissive.setHex(SELECTED_EMISSIVE);
      mat.emissiveIntensity = 0.4;
    } else if (this.isViolation) {
      mat.emissive.setHex(VIOLATION_EMISSIVE);
      mat.emissiveIntensity = 0.25;
    } else {
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }
  }

  setViolation(isViolation: boolean) {
    this.isViolation = isViolation;
    if (!this.isSelected) {
      const mat = this.boxMesh.material as THREE.MeshStandardMaterial;
      if (isViolation) {
        mat.emissive.setHex(VIOLATION_EMISSIVE);
        mat.emissiveIntensity = 0.25;
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    }
  }

  setDimmed(dimmed: boolean) {
    this.isDimmed = dimmed;
    const mat = this.boxMesh.material as THREE.MeshStandardMaterial;
    mat.opacity = dimmed ? 0.15 : 0.95;
    (this.topLabel.material as THREE.MeshBasicMaterial).opacity = dimmed ? 0.15 : 1;
  }
}

export class ContainersGroup extends THREE.Group {
  private containerMap: Map<string, ContainerMesh> = new Map();

  constructor() {
    super();
    this.name = 'containersGroup';
  }

  update(
    containers: Container[],
    shipConfig: ShipConfig,
    issues: ValidationIssue[]
  ) {
    const violationSet = new Set<string>();

    for (const issue of issues) {
      if (issue.severity === 'error') {
        violationSet.add(issue.containerNo);
        issue.relatedContainers?.forEach((c) => violationSet.add(c));
      }
    }

    const stowedContainers = containers.filter(
      (c) => c.bay !== null && c.row !== null && c.tier !== null
    );
    const newNos = new Set(stowedContainers.map((c) => c.containerNo));

    for (const no of this.containerMap.keys()) {
      if (!newNos.has(no)) {
        const mesh = this.containerMap.get(no)!;
        this.remove(mesh);
        this.containerMap.delete(no);
      }
    }

    for (const container of stowedContainers) {
      let mesh = this.containerMap.get(container.containerNo);
      if (!mesh) {
        mesh = new ContainerMesh(container, shipConfig);
        this.add(mesh);
        this.containerMap.set(container.containerNo, mesh);
      }
      mesh.setViolation(violationSet.has(container.containerNo));
    }
  }

  setSelected(containerNo: string | null) {
    for (const [no, mesh] of this.containerMap) {
      mesh.setSelected(no === containerNo);
    }
  }

  setHighlightPort(portName: string | null, containers: Container[]) {
    if (!portName) {
      for (const mesh of this.containerMap.values()) {
        mesh.setDimmed(false);
      }
      return;
    }

    const portNos = new Set(
      containers
        .filter((c) => c.dischargePort === portName)
        .map((c) => c.containerNo)
    );

    for (const [no, mesh] of this.containerMap) {
      mesh.setDimmed(!portNos.has(no));
    }
  }

  applyViewFilters(
    showBelowDeck: boolean,
    showAboveDeck: boolean,
    baySlice: number | null,
    showViolationsOnly: boolean,
    violationSet: Set<string>,
    tiersBelowDeck: number
  ) {
    for (const [containerNo, mesh] of this.containerMap.entries()) {
      let visible = true;

      if (mesh.isBelowDeck && !showBelowDeck) visible = false;
      if (!mesh.isBelowDeck && !showAboveDeck) visible = false;
      if (baySlice !== null && mesh.bay !== baySlice) visible = false;
      if (showViolationsOnly && !violationSet.has(containerNo)) visible = false;

      mesh.visible = visible;
    }
  }

  getContainer(containerNo: string): ContainerMesh | undefined {
    return this.containerMap.get(containerNo);
  }

  getAllContainers(): ContainerMesh[] {
    return Array.from(this.containerMap.values());
  }
}
