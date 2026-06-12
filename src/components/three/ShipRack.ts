import * as THREE from 'three';
import type { ShipConfig } from '@/types';
import { slotToPosition } from '@/data/shipConfig';

export class ShipRack extends THREE.Group {
  private shipConfig: ShipConfig;
  private deck?: THREE.Mesh;
  private hull?: THREE.Mesh;
  private waterline?: THREE.LineSegments;

  constructor(shipConfig: ShipConfig) {
    super();
    this.name = 'shipRack';
    this.shipConfig = shipConfig;
    this.build();
  }

  private build() {
    const {
      bayCount,
      rowsPerSide,
      tiersBelowDeck,
      tiersAboveDeck,
      containerLength20ft,
      containerWidth,
      containerHeight,
      keelHeight,
      hasPowerSlots,
      size40ftBays,
    } = this.shipConfig;

    const totalTiers = tiersBelowDeck + tiersAboveDeck;
    const totalRows = rowsPerSide * 2;

    const rackMaterial = new THREE.LineBasicMaterial({
      color: 0x2a5a8a,
      transparent: true,
      opacity: 0.4,
    });

    const powerSlotMaterial = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.6,
    });

    const powerSet = new Set(
      hasPowerSlots.map((s) => `${s.bay}-${s.row}-${s.tier}`)
    );

    for (let bay = 0; bay < bayCount; bay++) {
      const is40ft = size40ftBays.includes(bay);
      const bayLength = is40ft ? containerLength20ft * 2 : containerLength20ft;

      for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
        const row = (rowIdx - rowsPerSide + 0.5) * 2;

        for (let tier = 1; tier <= totalTiers; tier++) {
          const { x, y, z } = slotToPosition(bay, Math.round(row), tier, this.shipConfig);
          const hasPower = powerSet.has(`${bay}-${Math.round(row)}-${tier}`);
          const material = hasPower ? powerSlotMaterial : rackMaterial;

          const geometry = new THREE.BoxGeometry(
            bayLength - 0.1,
            containerHeight - 0.05,
            containerWidth * 2 - 0.1
          );
          const edges = new THREE.EdgesGeometry(geometry);
          const line = new THREE.LineSegments(edges, material);
          line.position.set(x, z + containerHeight / 2, y);
          line.userData = {
            type: 'rackSlot',
            bay,
            row: Math.round(row),
            tier,
            hasPower,
            isBelow: tier <= tiersBelowDeck,
          };
          this.add(line);
        }
      }
    }

    const deckY = keelHeight + tiersBelowDeck * containerHeight;
    const shipLength = bayCount * containerLength20ft * 2;
    const shipWidth = totalRows * containerWidth;

    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a365d,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const deckGeometry = new THREE.PlaneGeometry(shipLength, shipWidth);
    this.deck = new THREE.Mesh(deckGeometry, deckMaterial);
    this.deck.rotation.x = -Math.PI / 2;
    this.deck.position.y = deckY;
    this.deck.receiveShadow = true;
    this.add(this.deck);

    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d2137,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const hullHeight = keelHeight + tiersBelowDeck * containerHeight;
    const hullGeometry = new THREE.BoxGeometry(shipLength * 0.95, hullHeight, shipWidth * 0.9);
    this.hull = new THREE.Mesh(hullGeometry, hullMaterial);
    this.hull.position.y = hullHeight / 2;
    this.hull.position.x = -containerLength20ft;
    this.hull.receiveShadow = true;
    this.hull.castShadow = true;
    this.add(this.hull);

    const waterlineGeometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(shipLength * 0.98, 0.02, shipWidth * 0.95)
    );
    const waterlineMaterial = new THREE.LineBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.8,
    });
    this.waterline = new THREE.LineSegments(waterlineGeometry, waterlineMaterial);
    this.waterline.position.y = 1.5;
    this.waterline.position.x = -containerLength20ft;
    this.add(this.waterline);
  }

  updateVisibility(
    showRack: boolean,
    showBelowDeck: boolean,
    showAboveDeck: boolean,
    baySlice: number | null
  ) {
    const tiersBelowDeck = this.shipConfig.tiersBelowDeck;

    this.traverse((child) => {
      if (child instanceof THREE.LineSegments && child.userData.type === 'rackSlot') {
        const { tier, bay, isBelow } = child.userData;

        let visible = showRack;
        if (!showBelowDeck && isBelow) visible = false;
        if (!showAboveDeck && !isBelow) visible = false;
        if (baySlice !== null && bay !== baySlice) visible = false;

        child.visible = visible;
      }
    });

    if (this.deck) {
      this.deck.visible = showRack;
    }
  }
}
