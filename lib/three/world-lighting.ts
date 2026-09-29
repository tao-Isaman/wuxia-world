import * as THREE from "three";

// Positions follow the painted lanterns, in the same 960x640 ground coordinates.
const LANTERNS: Record<string, readonly [number, number][]> = {
  home_player: [[270, 151], [313, 143], [390, 122], [420, 112], [448, 106]],
  city_capital: [[713, 196], [739, 206], [772, 210], [802, 202], [236, 171]],
};

/** A flat lighting pass preserves pixel textures and keeps labels above the atmosphere. */
export function createWorldLighting(scene: THREE.Scene, location: string) {
  const lamps = LANTERNS[location] ?? [];
  const material = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: {
      uOpacity: { value: 0 }, uNight: { value: 0 }, uFlicker: { value: 1 },
      uLampCount: { value: lamps.length },
      uLamps: { value: Array.from({ length: 5 }, (_, i) => new THREE.Vector2(...(lamps[i] ?? [-1000, -1000]))) },
    },
    vertexShader: `varying vec2 vUv;
      void main() { vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv;
      uniform float uOpacity, uNight, uFlicker;
      uniform int uLampCount;
      uniform vec2 uLamps[5];
      void main() {
        if(uNight<0.001) { gl_FragColor=vec4(0.69,0.40,0.16,uOpacity); return; }
        vec2 point=vec2(vUv.x*960.0,(1.0-vUv.y)*640.0);
        float light=0.0;
        for(int i=0;i<5;i++) {
          if(i>=uLampCount) break;
          vec2 lamp=uLamps[i];
          float glow=1.0-smoothstep(2.0,31.0,distance(point,lamp));
          vec2 ground=(point-lamp-vec2(0.0,42.0))/vec2(1.0,0.52);
          float pool=1.0-smoothstep(2.0,47.0,length(ground));
          light=max(light, max(glow*0.94,pool*0.55));
        }
        light=floor(light*12.0)/12.0*uNight*uFlicker;
        vec3 ambient=mix(vec3(0.69,0.40,0.16),vec3(0.035,0.075,0.18),uNight);
        gl_FragColor=vec4(mix(ambient,vec3(1.0,0.64,0.22),light),uOpacity);
      }`,
  });
  const geometry = new THREE.PlaneGeometry(960, 640);
  const veil = new THREE.Mesh(geometry, material);
  veil.position.set(480, -320, 0);
  veil.renderOrder = 9_000;
  scene.add(veil);
  return {
    update(time: number, elapsed: number, reducedMotion: boolean) {
      const hour = ((time % 12) + 12) % 12;
      const night = hour >= 8 ? Math.min(1, (hour - 7) / 2) : 0;
      material.uniforms.uNight.value = night;
      material.uniforms.uOpacity.value = night ? 0.13 + night * 0.34 : hour < 4 ? 0.025 : 0.012;
      material.uniforms.uFlicker.value = reducedMotion ? 1 : 0.97 + Math.sin(elapsed * 2.1) * 0.02 + Math.sin(elapsed * 3.7) * 0.01;
    },
    destroy() { scene.remove(veil); geometry.dispose(); material.dispose(); },
  };
}
