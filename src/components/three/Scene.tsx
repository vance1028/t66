import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useStore } from '@/store/useStore';
import { ShipRack } from './ShipRack';
import { ContainersGroup } from './Containers';
import { CenterOfGravity } from './CenterOfGravity';

export function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const shipRackRef = useRef<ShipRack | null>(null);
  const containersRef = useRef<ContainersGroup | null>(null);
  const cogRef = useRef<CenterOfGravity | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const animationFrameRef = useRef<number>(0);

  const shipConfig = useStore((state) => state.shipConfig);
  const containers = useStore((state) => state.containers);
  const validationIssues = useStore((state) => state.validationIssues);
  const stabilityData = useStore((state) => state.stabilityData);
  const viewState = useStore((state) => state.viewState);
  const setSelectedContainer = useStore((state) => state.setSelectedContainer);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);
    scene.fog = new THREE.Fog(0x0a1628, 120, 300);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      500
    );
    camera.position.set(90, 55, 90);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 12, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x6080a0, 0.55);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
    directionalLight.position.set(60, 90, 60);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 300;
    directionalLight.shadow.camera.left = -80;
    directionalLight.shadow.camera.right = 80;
    directionalLight.shadow.camera.top = 80;
    directionalLight.shadow.camera.bottom = -80;
    directionalLight.shadow.bias = -0.0005;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.25);
    fillLight.position.set(-40, 30, -50);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff8844, 0.15);
    rimLight.position.set(-30, 20, 60);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(200, 40, 0x1a365d, 0x0f2744);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    const waterGeometry = new THREE.PlaneGeometry(500, 500);
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c2a4a,
      transparent: true,
      opacity: 0.85,
      roughness: 0.9,
      metalness: 0.05,
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.02;
    water.receiveShadow = true;
    scene.add(water);

    const shipGroup = new THREE.Group();
    shipGroup.name = 'shipGroup';
    scene.add(shipGroup);

    const shipRack = new ShipRack(shipConfig);
    shipGroup.add(shipRack);
    shipRackRef.current = shipRack;

    const containersGroup = new ContainersGroup();
    containersGroup.update(containers, shipConfig, validationIssues);
    shipGroup.add(containersGroup);
    containersRef.current = containersGroup;

    const cog = new CenterOfGravity();
    cog.update(stabilityData, shipConfig);
    shipGroup.add(cog);
    cogRef.current = cog;

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || !camera || !containersGroup) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(
        containersGroup.children,
        true
      );

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.userData.type !== 'container') {
          obj = obj.parent;
        }
        if (obj && obj.userData.containerNo) {
          const no = obj.userData.containerNo;
          setSelectedContainer(viewState.selectedContainer === no ? null : no);
        }
      } else {
        setSelectedContainer(null);
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (containersRef.current) {
      containersRef.current.update(containers, shipConfig, validationIssues);
    }
  }, [containers, shipConfig, validationIssues]);

  useEffect(() => {
    if (containersRef.current) {
      containersRef.current.setSelected(viewState.selectedContainer);
    }
  }, [viewState.selectedContainer]);

  useEffect(() => {
    if (containersRef.current) {
      containersRef.current.setHighlightPort(viewState.highlightPort, containers);
    }
  }, [viewState.highlightPort, containers]);

  useEffect(() => {
    if (shipRackRef.current && containersRef.current) {
      shipRackRef.current.updateVisibility(
        viewState.showRack,
        viewState.showBelowDeck,
        viewState.showAboveDeck,
        viewState.baySlice
      );
      const violationSet = new Set<string>();
      validationIssues.forEach((issue) => {
        if (issue.severity === 'error') {
          violationSet.add(issue.containerNo);
          issue.relatedContainers?.forEach((c) => violationSet.add(c));
        }
      });
      containersRef.current.applyViewFilters(
        viewState.showBelowDeck,
        viewState.showAboveDeck,
        viewState.baySlice,
        viewState.showViolationsOnly,
        violationSet,
        shipConfig.tiersBelowDeck
      );
    }
  }, [
    viewState.showRack,
    viewState.showBelowDeck,
    viewState.showAboveDeck,
    viewState.baySlice,
    viewState.showViolationsOnly,
    shipConfig.tiersBelowDeck,
    validationIssues,
  ]);

  useEffect(() => {
    if (cogRef.current) {
      cogRef.current.update(stabilityData, shipConfig);
    }
  }, [stabilityData, shipConfig]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: 'grab' }}
    />
  );
}
