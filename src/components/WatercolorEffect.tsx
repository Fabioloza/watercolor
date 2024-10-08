import React, { useRef, useCallback, useMemo } from 'react';
import { extend, useFrame, useThree } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { TrailTexture } from './TrailTexture';

const ColorBleedMaterial = shaderMaterial(
  {
    bgColor: new THREE.Color('#f0e6d2'),
    time: 0,
    trailTexture: null,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 bgColor;
    uniform float time;
    uniform sampler2D trailTexture;
    
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      vec4 trailColor = texture2D(trailTexture, uv);
      
      // Create a colorful palette
      vec3 color1 = vec3(0.5, 0.8, 0.9);  // Light blue
      vec3 color2 = vec3(0.9, 0.4, 0.3);  // Coral
      vec3 color3 = vec3(0.2, 0.7, 0.5);  // Teal
      vec3 color4 = vec3(0.8, 0.7, 0.3);  // Gold
      
      // Cycle through colors based on time and position
      float colorCycle = sin(time * 0.5 + uv.x * 2.0 + uv.y * 2.0) * 0.5 + 0.5;
      vec3 cycledColor = mix(color1, color2, colorCycle);
      cycledColor = mix(cycledColor, color3, sin(time * 0.7 + uv.y * 3.0) * 0.5 + 0.5);
      cycledColor = mix(cycledColor, color4, sin(time * 0.9 + uv.x * 4.0) * 0.5 + 0.5);
      
      // Mix background color with the cycled color based on trail intensity
      vec3 finalColor = mix(bgColor, cycledColor, trailColor.r);
      
      // Add a subtle noise effect
      float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
      finalColor += noise * 0.02;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ ColorBleedMaterial });

function WatercolorEffect() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const { viewport, size } = useThree();
  
  const trailTexture = useMemo(() => {
    return new TrailTexture({
      width: size.width,
      height: size.height,
      radius: 0.1,
      maxAge: 3000,
      intensity: 0.6,
      smoothing: 0.3,
    });
  }, [size]);

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (e.uv) {
      trailTexture.addTouch({ x: e.uv.x, y: e.uv.y });
    }
  }, [trailTexture]);

  useFrame((state, delta) => {
    trailTexture.update(delta);
    if (materialRef.current) {
      materialRef.current.time += delta;
      materialRef.current.trailTexture = trailTexture.texture;
    }
  });

  return (
    <mesh ref={meshRef} onPointerMove={handlePointerMove}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <colorBleedMaterial
        ref={materialRef}
        bgColor={new THREE.Color('#f0e6d2')}
      />
    </mesh>
  );
}

export default WatercolorEffect;