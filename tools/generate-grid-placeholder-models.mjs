import fs from 'node:fs';
import path from 'node:path';
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class FileReader {
  constructor() {
    this.result = null;
    this.onloadend = null;
  }

  async #finish(promise, formatter) {
    try {
      const value = await promise;
      this.result = formatter(value);
      if (typeof this.onloadend === 'function') {
        this.onloadend();
      }
    } catch (error) {
      throw error;
    }
  }

  readAsArrayBuffer(blob) {
    void this.#finish(blob.arrayBuffer(), (buffer) => buffer);
  }

  readAsDataURL(blob) {
    void this.#finish(blob.arrayBuffer(), (buffer) => {
      const base64 = Buffer.from(buffer).toString('base64');
      const mime = blob.type || 'application/octet-stream';
      return `data:${mime};base64,${base64}`;
    });
  }
};

const ROOT = process.cwd();
const MODELS_DIR = path.join(ROOT, 'public', 'grid-assets', 'models');
const ARCHIVE_DIR = path.join(MODELS_DIR, 'high-poly-archive');

const COLORS = {
  emerald: 0x00d084,
  blue: 0x2aa9ff,
  amber: 0xf5b942,
  purple: 0x9c6bff,
  slate: 0x23332d,
  metal: 0x8fa8a0
};

const createMaterial = (color, emissive = color) =>
  new MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.2
  });

const addMesh = (
  parent,
  geometry,
  material,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  name = ''
) => {
  const mesh = new Mesh(geometry, material);
  if (name) {
    mesh.name = name;
  }
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
};

const addFootprint = (parent, width, depth, color = COLORS.slate) =>
  addMesh(
    parent,
    new BoxGeometry(width, 0.08, depth),
    createMaterial(color),
    [0, 0.04, 0],
    [0, 0, 0],
    'base-footprint'
  );

const createControlCenter = () => {
  const group = new Group();
  addFootprint(group, 1.5, 1.15);
  addMesh(group, new BoxGeometry(1.36, 0.34, 1), createMaterial(COLORS.slate), [0, 0.21, 0], [0, 0, 0], 'body-hull');
  addMesh(group, new BoxGeometry(0.84, 0.42, 0.68), createMaterial(COLORS.emerald), [0, 0.59, 0], [0, 0, 0], 'pulse-command-core');
  addMesh(group, new BoxGeometry(0.28, 0.2, 0.68), createMaterial(COLORS.blue), [-0.56, 0.35, 0], [0, 0, 0], 'pulse-console-bank');
  addMesh(group, new CylinderGeometry(0.04, 0.04, 0.58, 6), createMaterial(COLORS.metal), [0.43, 1, -0.18], [0, 0, 0], 'mast-radar');
  addMesh(group, new TorusGeometry(0.16, 0.03, 6, 12), createMaterial(COLORS.blue), [0.43, 1.26, -0.18], [0, 0.9, 0.55], 'spin-y-radar-ring');
  addMesh(group, new SphereGeometry(0.08, 7, 7), createMaterial(COLORS.emerald), [0.43, 1.12, -0.18], [0, 0, 0], 'pulse-radar-core');
  return group;
};

const createSmartTransformer = () => {
  const group = new Group();
  addFootprint(group, 1.02, 0.82);
  addMesh(group, new BoxGeometry(0.94, 0.22, 0.74), createMaterial(COLORS.slate), [0, 0.15, 0], [0, 0, 0], 'body-transformer');
  addMesh(group, new CylinderGeometry(0.13, 0.13, 0.72, 10), createMaterial(COLORS.blue), [-0.24, 0.62, -0.12], [0, 0, 0], 'pulse-coil-left');
  addMesh(group, new CylinderGeometry(0.13, 0.13, 0.72, 10), createMaterial(COLORS.blue), [0.24, 0.62, -0.12], [0, 0, 0], 'pulse-coil-right');
  addMesh(group, new CylinderGeometry(0.09, 0.09, 0.62, 8), createMaterial(COLORS.amber), [-0.24, 0.62, 0.22], [0, 0, 0], 'pulse-cap-left');
  addMesh(group, new CylinderGeometry(0.09, 0.09, 0.62, 8), createMaterial(COLORS.amber), [0.24, 0.62, 0.22], [0, 0, 0], 'pulse-cap-right');
  addMesh(group, new BoxGeometry(0.68, 0.08, 0.12), createMaterial(COLORS.metal), [0, 1, -0.12], [0, 0, 0], 'beam-top-link');
  addMesh(group, new BoxGeometry(0.72, 0.06, 0.08), createMaterial(COLORS.blue), [0, 0.41, 0.33], [0, 0, 0], 'pulse-power-bus');
  return group;
};

const createSolarForecastingArray = () => {
  const group = new Group();
  addFootprint(group, 1.62, 1.02);
  addMesh(group, new BoxGeometry(0.72, 0.07, 0.46), createMaterial(COLORS.blue), [-0.36, 0.66, 0], [-0.62, 0.22, 0], 'sway-z-panel-left');
  addMesh(group, new BoxGeometry(0.72, 0.07, 0.46), createMaterial(COLORS.blue), [0.36, 0.66, 0], [-0.62, -0.22, 0], 'sway-z-panel-right');
  addMesh(group, new BoxGeometry(0.62, 0.04, 0.36), createMaterial(COLORS.emerald), [-0.36, 0.69, 0.01], [-0.62, 0.22, 0], 'pulse-panel-left');
  addMesh(group, new BoxGeometry(0.62, 0.04, 0.36), createMaterial(COLORS.emerald), [0.36, 0.69, 0.01], [-0.62, -0.22, 0], 'pulse-panel-right');
  addMesh(group, new CylinderGeometry(0.06, 0.06, 0.86, 6), createMaterial(COLORS.slate), [0, 0.38, -0.18], [0, 0, 0], 'mast-sensor');
  addMesh(group, new SphereGeometry(0.12, 8, 8), createMaterial(COLORS.amber), [0, 1.02, -0.12], [0, 0, 0], 'pulse-sun-sensor');
  addMesh(group, new CylinderGeometry(0.04, 0.04, 0.34, 6), createMaterial(COLORS.metal), [0, 0.86, -0.12], [0.46, 0, 0], 'spin-y-sensor-arm');
  return group;
};

const createBatteryStorage = () => {
  const group = new Group();
  addFootprint(group, 1.16, 0.86);
  addMesh(group, new BoxGeometry(1.02, 1.1, 0.72), createMaterial(COLORS.slate), [0, 0.59, 0], [0, 0, 0], 'body-battery');
  addMesh(group, new BoxGeometry(0.8, 0.16, 0.08), createMaterial(COLORS.amber), [0, 0.82, 0.41], [0, 0, 0], 'pulse-charge-top');
  addMesh(group, new BoxGeometry(0.8, 0.16, 0.08), createMaterial(COLORS.amber), [0, 0.52, 0.41], [0, 0, 0], 'pulse-charge-mid');
  addMesh(group, new BoxGeometry(0.8, 0.16, 0.08), createMaterial(COLORS.amber), [0, 0.22, 0.41], [0, 0, 0], 'pulse-charge-low');
  addMesh(group, new CylinderGeometry(0.05, 0.05, 0.52, 6), createMaterial(COLORS.metal), [-0.38, 0.98, 0], [0, 0, 0], 'terminal-left');
  addMesh(group, new CylinderGeometry(0.05, 0.05, 0.52, 6), createMaterial(COLORS.metal), [0.38, 0.98, 0], [0, 0, 0], 'terminal-right');
  addMesh(group, new BoxGeometry(0.24, 0.08, 0.08), createMaterial(COLORS.blue), [0, 1.18, 0], [0, 0, 0], 'pulse-battery-link');
  return group;
};

const createFrequencyController = () => {
  const group = new Group();
  addFootprint(group, 0.96, 0.96);
  addMesh(group, new CylinderGeometry(0.34, 0.44, 0.34, 12), createMaterial(COLORS.slate), [0, 0.21, 0], [0, 0, 0], 'body-controller');
  addMesh(group, new TorusGeometry(0.42, 0.08, 8, 18), createMaterial(COLORS.blue), [0, 0.52, 0], [Math.PI / 2, 0, 0], 'spin-z-ring-outer');
  addMesh(group, new TorusGeometry(0.3, 0.05, 8, 16), createMaterial(COLORS.amber), [0, 0.78, 0], [Math.PI / 2, 0, 0], 'spin-z-ring-inner');
  addMesh(group, new CylinderGeometry(0.05, 0.05, 0.9, 8), createMaterial(COLORS.metal), [0, 0.54, 0], [0, 0, 0], 'mast-frequency');
  addMesh(group, new BoxGeometry(0.72, 0.05, 0.05), createMaterial(COLORS.blue), [0, 0.9, 0], [0, 0, 0], 'pulse-stabilizer-bar');
  return group;
};

const createDemandResponseSystem = () => {
  const group = new Group();
  addFootprint(group, 1.18, 0.86);
  addMesh(group, new BoxGeometry(1.08, 0.24, 0.72), createMaterial(COLORS.slate), [0, 0.17, 0], [0, 0, 0], 'body-demand');
  addMesh(group, new BoxGeometry(0.24, 0.7, 0.24), createMaterial(COLORS.purple), [-0.32, 0.47, 0], [0, 0, 0], 'pulse-tower-left');
  addMesh(group, new BoxGeometry(0.24, 0.52, 0.24), createMaterial(COLORS.purple), [0, 0.38, 0], [0, 0, 0], 'pulse-tower-mid');
  addMesh(group, new BoxGeometry(0.24, 0.9, 0.24), createMaterial(COLORS.purple), [0.32, 0.57, 0], [0, 0, 0], 'pulse-tower-right');
  addMesh(group, new BoxGeometry(0.84, 0.06, 0.08), createMaterial(COLORS.amber), [0, 0.94, 0], [0, 0, 0], 'pulse-demand-bus');
  addMesh(group, new CylinderGeometry(0.06, 0.06, 0.34, 6), createMaterial(COLORS.metal), [0.32, 1.08, 0], [0, 0, 0], 'antenna-demand');
  return group;
};

const createGridFlywheel = () => {
  const group = new Group();
  addFootprint(group, 1.12, 0.96);
  addMesh(group, new BoxGeometry(0.9, 0.14, 0.72), createMaterial(COLORS.slate), [0, 0.11, 0], [0, 0, 0], 'body-flywheel');
  addMesh(group, new TorusGeometry(0.42, 0.11, 8, 18), createMaterial(COLORS.blue), [0, 0.54, 0], [Math.PI / 2, 0, 0], 'spin-z-rotor-ring');
  addMesh(group, new CylinderGeometry(0.1, 0.1, 0.92, 8), createMaterial(COLORS.metal), [0, 0.54, 0], [0, 0, 0], 'pulse-rotor-core');
  addMesh(group, new BoxGeometry(0.12, 0.7, 0.12), createMaterial(COLORS.metal), [-0.42, 0.39, 0], [0, 0, 0], 'brace-left');
  addMesh(group, new BoxGeometry(0.12, 0.7, 0.12), createMaterial(COLORS.metal), [0.42, 0.39, 0], [0, 0, 0], 'brace-right');
  return group;
};

const createHvdcInterconnector = () => {
  const group = new Group();
  addFootprint(group, 1.42, 0.84);
  addMesh(group, new BoxGeometry(0.16, 1.24, 0.16), createMaterial(COLORS.slate), [-0.48, 0.66, 0], [0, 0, 0], 'tower-left');
  addMesh(group, new BoxGeometry(0.16, 1.24, 0.16), createMaterial(COLORS.slate), [0.48, 0.66, 0], [0, 0, 0], 'tower-right');
  addMesh(group, new BoxGeometry(1.26, 0.12, 0.16), createMaterial(COLORS.metal), [0, 1.16, 0], [0, 0, 0], 'beam-cross');
  addMesh(group, new CylinderGeometry(0.03, 0.03, 0.96, 6), createMaterial(COLORS.blue), [0, 0.92, 0], [0, 0, Math.PI / 2], 'pulse-power-line');
  addMesh(group, new BoxGeometry(0.26, 0.1, 0.26), createMaterial(COLORS.blue), [0, 0.22, 0], [0, 0, 0], 'pulse-hvdc-core');
  return group;
};

const createAiGridOptimizer = () => {
  const group = new Group();
  addFootprint(group, 1.08, 1.08);
  addMesh(group, new BoxGeometry(0.92, 0.22, 0.92), createMaterial(COLORS.slate), [0, 0.15, 0], [0, 0, 0], 'body-ai');
  addMesh(group, new BoxGeometry(0.58, 0.52, 0.58), createMaterial(COLORS.blue), [0, 0.52, 0], [0, 0, 0], 'pulse-ai-core');
  addMesh(group, new SphereGeometry(0.16, 8, 8), createMaterial(COLORS.emerald), [0, 0.95, 0], [0, 0, 0], 'pulse-ai-crown');
  addMesh(group, new CylinderGeometry(0.03, 0.03, 0.3, 6), createMaterial(COLORS.amber), [-0.42, 0.24, 0], [0, 0, 0], 'spin-y-ai-satellite-left');
  addMesh(group, new CylinderGeometry(0.03, 0.03, 0.3, 6), createMaterial(COLORS.amber), [0.42, 0.24, 0], [0, 0, 0], 'spin-y-ai-satellite-right');
  addMesh(group, new CylinderGeometry(0.03, 0.03, 0.3, 6), createMaterial(COLORS.amber), [0, 0.24, -0.42], [Math.PI / 2, 0, 0], 'spin-x-ai-satellite-back');
  addMesh(group, new CylinderGeometry(0.03, 0.03, 0.3, 6), createMaterial(COLORS.amber), [0, 0.24, 0.42], [Math.PI / 2, 0, 0], 'spin-x-ai-satellite-front');
  return group;
};

const MODEL_BUILDERS = {
  'control-center.glb': createControlCenter,
  'smart-transformer.glb': createSmartTransformer,
  'solar-forecasting-array.glb': createSolarForecastingArray,
  'battery-storage.glb': createBatteryStorage,
  'frequency-controller.glb': createFrequencyController,
  'demand-response-system.glb': createDemandResponseSystem,
  'grid-flywheel.glb': createGridFlywheel,
  'hvdc-interconnector.glb': createHvdcInterconnector,
  'ai-grid-optimizer.glb': createAiGridOptimizer
};

const exporter = new GLTFExporter();

const exportGroupToGlb = (group) =>
  new Promise((resolve, reject) => {
    const scene = new Scene();
    scene.add(group);
    exporter.parse(
      scene,
      (result) => {
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error('Expected binary GLB output.'));
          return;
        }
        resolve(Buffer.from(result));
      },
      (error) => reject(error),
      { binary: true, onlyVisible: true }
    );
  });

fs.mkdirSync(MODELS_DIR, { recursive: true });
fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

for (const archived of ['control-center.glb', 'solar-forecasting-array.glb', 'battery-storage.glb']) {
  const sourcePath = path.join(MODELS_DIR, archived);
  const archivePath = path.join(ARCHIVE_DIR, archived);
  if (fs.existsSync(sourcePath) && !fs.existsSync(archivePath)) {
    fs.copyFileSync(sourcePath, archivePath);
  }
}

for (const [fileName, buildModel] of Object.entries(MODEL_BUILDERS)) {
  const buffer = await exportGroupToGlb(buildModel());
  fs.writeFileSync(path.join(MODELS_DIR, fileName), buffer);
  console.log(`wrote ${fileName} (${(buffer.length / 1024).toFixed(1)} kB)`);
}
