// global.d.ts
//
// `declare module "three";` used to live here. A shorthand ambient declaration
// makes the module `any` in *value* positions but leaves it an empty namespace
// in *type* positions, so every `THREE.Vector3` / `THREE.Mesh` annotation in
// the panorama engine failed with "Namespace 'three' has no exported member" —
// 42 of the 150 errors `npm run typecheck` reported. three@0.183 ships no
// typings of its own, so @types/three is a real devDependency now and this
// file no longer needs to say anything about it.
export {};