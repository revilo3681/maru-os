import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Enso3DCanvasProps {
  size?: number;
  isThinking?: boolean;
  isListening?: boolean;
  audioPulseLevel?: number;
  interactive?: boolean;
  onClick?: () => void;
  accentColor?: string;
}

export const Enso3DCanvas: React.FC<Enso3DCanvasProps> = ({
  size = 220,
  isThinking = false,
  isListening = false,
  audioPulseLevel = 0,
  interactive = true,
  onClick,
  accentColor = '#4A9B9D'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup Three Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Enso Torus Geometry (Zen Circle)
    const geometry = new THREE.TorusGeometry(1.2, 0.12, 32, 100, Math.PI * 1.85);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      roughness: 0.3,
      metalness: 0.8,
      emissive: new THREE.Color(accentColor),
      emissiveIntensity: 0.3,
      wireframe: false
    });

    const ensoMesh = new THREE.Mesh(geometry, material);
    scene.add(ensoMesh);

    // Inner glowing sphere core (water/mountain core)
    const coreGeo = new THREE.IcosahedronGeometry(0.7, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentColor),
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(3, 3, 4);
    scene.add(pointLight);

    let animationFrameId: number;

    const animate = () => {
      // Rotation
      ensoMesh.rotation.z += isThinking ? 0.04 : 0.008;
      ensoMesh.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
      coreMesh.rotation.y -= 0.01;

      // Pulse calculations
      let scale = 1.0;
      if (isListening) {
        scale = 1.0 + audioPulseLevel * 0.4 + Math.sin(Date.now() * 0.01) * 0.05;
      } else if (isThinking) {
        scale = 1.0 + Math.sin(Date.now() * 0.008) * 0.12;
      } else {
        scale = 1.0 + Math.sin(Date.now() * 0.002) * 0.04;
      }

      ensoMesh.scale.set(scale, scale, scale);
      coreMesh.scale.set(scale * 0.9, scale * 0.9, scale * 0.9);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      coreGeo.dispose();
      coreMat.dispose();
    };
  }, [size, isThinking, isListening, audioPulseLevel, accentColor]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center transition-transform duration-300 ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      }`}
      title="MARU OS — Enso Cognitivo"
    />
  );
};
