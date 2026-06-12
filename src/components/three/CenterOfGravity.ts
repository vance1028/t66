import * as THREE from 'three';
import type { StabilityData, ShipConfig } from '@/types';
import { getStabilityRatingColor } from '@/stability/calculator';

export class CenterOfGravity extends THREE.Group {
  private cogSphere: THREE.Mesh;
  private cogLine: THREE.Line;
  private cogLabel?: THREE.Sprite;

  constructor() {
    super();
    this.name = 'centerOfGravity';

    const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.9,
    });
    this.cogSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.add(this.cogSphere);

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 30, 0),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xff6b35,
      dashSize: 0.5,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.7,
    });
    this.cogLine = new THREE.Line(lineGeo, lineMat);
    this.cogLine.computeLineDistances();
    this.add(this.cogLine);

    this.visible = true;
  }

  update(stability: StabilityData, shipConfig: ShipConfig) {
    const { cogX, cogY, cogZ, gm, rating } = stability;

    this.cogSphere.position.set(cogX, cogZ, cogY);

    const color = new THREE.Color(getStabilityRatingColor(rating));
    (this.cogSphere.material as THREE.MeshBasicMaterial).color = color;
    (this.cogLine.material as THREE.LineDashedMaterial).color = color;

    const points = [
      new THREE.Vector3(cogX, 0, cogY),
      new THREE.Vector3(cogX, cogZ + gm + 5, cogY),
    ];
    this.cogLine.geometry.setFromPoints(points);
    this.cogLine.computeLineDistances();

    const buoyancyCenterZ = stability.buoyancyCenterZ;
    const metacenterZ = buoyancyCenterZ + stability.metacentricRadius;
    
    const metPoints = [
      new THREE.Vector3(cogX - 2, metacenterZ, cogY),
      new THREE.Vector3(cogX + 2, metacenterZ, cogY),
    ];
    const metGeo = new THREE.BufferGeometry().setFromPoints(metPoints);
    const metMat = new THREE.LineBasicMaterial({
      color: 0x2ed573,
      transparent: true,
      opacity: 0.5,
    });
    const metLine = new THREE.Line(metGeo, metMat);
    this.cogLine.parent?.add(metLine);
  }

  toggle(visible: boolean) {
    this.visible = visible;
  }
}
