// test/three-stub.js
// A tiny stand-in for three.js, used ONLY by test/client-stub.js. It lets the real client code run
// in Node (no GPU, no download) so JavaScript mistakes in main.js / world.js / zombie.js / ui.js
// show up in `npm test`. It does NOT draw anything: how the game looks is verified in a real browser.
//
// Position / rotation / scale / camera objects are real (the game logic reads them); everything
// else (geometries, materials, textures, renderer ...) is a "ghost": a permissive object that
// accepts any call or property, and turns into 0 when used as a number.

export function ghost(label = 'ghost') {
  const store = new Map();
  const self = new Proxy(function () {}, {
    get(_, prop) {
      if (prop === Symbol.toPrimitive) return () => 0;
      if (typeof prop === 'symbol' || prop === 'then') return undefined;
      if (!store.has(prop)) store.set(prop, ghost(`${label}.${prop}`));
      return store.get(prop);
    },
    set(_, prop, v) { store.set(prop, v); return true; },
    apply() { return self; },
    construct() { return ghost(`new ${label}`); },
  });
  return self;
}

export const ghostClass = (name) => ghost(name);

// ---- the few classes whose values the game really reads --------------------------------------
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  setScalar(s) { this.x = this.y = this.z = s; return this; }
  copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  clone() { return new Vector3(this.x, this.y, this.z); }
  lerp(v, a) { this.x += (v.x - this.x) * a; this.y += (v.y - this.y) * a; this.z += (v.z - this.z) * a; return this; }
  addScaledVector(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  setFromSphericalCoords(r, phi, theta) {
    const s = Math.sin(phi) * r;
    this.x = s * Math.sin(theta); this.y = Math.cos(phi) * r; this.z = s * Math.cos(theta);
    return this;
  }
  length() { return Math.hypot(this.x, this.y, this.z); }
  applyMatrix4() { return this; }
}

export class Euler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') { this.x = x; this.y = y; this.z = z; this.order = order; }
  set(x, y, z, order) { this.x = x; this.y = y; this.z = z; if (order) this.order = order; return this; }
}

export class Object3D {
  constructor() {
    this.position = new Vector3();
    this.rotation = new Euler();
    this.scale = new Vector3(1, 1, 1);
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.matrix = ghost('matrix');
    this.castShadow = false;
    this.receiveShadow = false;
  }
  add(...list) { for (const c of list) { c.parent = this; this.children.push(c); } return this; }
  remove(...list) { for (const c of list) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); } return this; }
  traverse(fn) { fn(this); for (const c of this.children) if (c instanceof Object3D) c.traverse(fn); }
  updateMatrix() {}
  updateMatrixWorld() {}
  lookAt() {}
}
export class Group extends Object3D {}
export class Scene extends Object3D {}
export class Mesh extends Object3D {
  constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
}
export class Sprite extends Object3D {
  constructor(material) { super(); this.material = material; }
}
export class Points extends Object3D {
  constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
}
export class InstancedMesh extends Mesh {
  constructor(geometry, material, count) {
    super(geometry, material);
    this.count = count; this.instanceMatrix = { needsUpdate: false }; this.instanceColor = null;
  }
  setMatrixAt() {}
  setColorAt() { this.instanceColor = { needsUpdate: false }; }
}
export class PerspectiveCamera extends Object3D {
  constructor(fov, aspect, near, far) { super(); this.fov = fov; this.aspect = aspect; this.near = near; this.far = far; }
  updateProjectionMatrix() {}
}
export class HemisphereLight extends Object3D {
  constructor(a, b, intensity) { super(); this.intensity = intensity; }
}
export class DirectionalLight extends Object3D {
  constructor(color, intensity) { super(); this.intensity = intensity; this.target = new Object3D(); this.shadow = ghost('shadow'); }
}
export class PointLight extends Object3D {
  constructor(color, intensity) { super(); this.intensity = intensity; }
}

export const MathUtils = {
  degToRad: (d) => (d * Math.PI) / 180,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  smoothstep(x, min, max) {
    if (x <= min) return 0;
    if (x >= max) return 1;
    const t = (x - min) / (max - min);
    return t * t * (3 - 2 * t);
  },
};

export const REAL = {
  Vector3, Euler, Object3D, Group, Scene, Mesh, Sprite, Points, InstancedMesh,
  PerspectiveCamera, HemisphereLight, DirectionalLight, PointLight, MathUtils,
};
