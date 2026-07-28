import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AgentId } from '../../types';

interface AgentSphere3DProps {
  agentId: AgentId;
  size?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const AgentSphere3D: React.FC<AgentSphere3DProps> = ({
  agentId,
  size = 120,
  isSelected = false,
  onClick
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Agent Specific Colors & Geometry Settings
    let mainColor = 0x4a9b9d;
    let emissiveColor = 0x1e3a5f;
    let detailType: 'heart' | 'ring' | 'matrix' | 'lotus' | 'leaves' | 'seismic' | 'water' = 'water';

    switch (agentId) {
      case 'aya':
        mainColor = 0x2a75d3;
        emissiveColor = 0x1e3a5f;
        detailType = 'heart';
        break;
      case 'inti':
        mainColor = 0xb8924a;
        emissiveColor = 0x2c3e50;
        detailType = 'ring';
        break;
      case 'kipu':
        mainColor = 0x2ecc71;
        emissiveColor = 0x1a3326;
        detailType = 'matrix';
        break;
      case 'sumaq':
        mainColor = 0x9b59b6;
        emissiveColor = 0x3a2e39;
        detailType = 'lotus';
        break;
      case 'pacha':
        mainColor = 0x27ae60;
        emissiveColor = 0x1e392a;
        detailType = 'leaves';
        break;
      case 'tupac':
        mainColor = 0xc0392b;
        emissiveColor = 0x4a1512;
        detailType = 'seismic';
        break;
      case 'yaku':
        mainColor = 0x4a9b9d;
        emissiveColor = 0x1e3a5f;
        detailType = 'water';
        break;
    }

    // Base Sphere Mesh
    const geometry = new THREE.SphereGeometry(0.85, 32, 32);
    const material = new THREE.MeshPhysicalMaterial({
      color: mainColor,
      emissive: emissiveColor,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.6,
      clearcoat: 0.8,
      wireframe: detailType === 'matrix'
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Orbiting Rings or Detail Mesh
    let ringMesh: THREE.Mesh | null = null;
    if (detailType === 'ring' || detailType === 'seismic' || detailType === 'water') {
      const ringGeo = new THREE.TorusGeometry(1.1, 0.04, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: mainColor, wireframe: true });
      ringMesh = new THREE.Mesh(ringGeo, ringMat);
      scene.add(ringMesh);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(mainColor, 3, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    let frameId: number;

    const animate = () => {
      sphere.rotation.y += 0.015;
      sphere.rotation.x += 0.005;

      if (ringMesh) {
        ringMesh.rotation.z += 0.02;
        ringMesh.rotation.x += 0.01;
      }

      // Heartbeat pulse for Aya
      if (detailType === 'heart') {
        const beat = 1.0 + Math.abs(Math.sin(Date.now() * 0.004)) * 0.08;
        sphere.scale.set(beat, beat, beat);
      } else if (detailType === 'seismic') {
        const quake = 1.0 + Math.sin(Date.now() * 0.01) * 0.1;
        sphere.scale.set(quake, quake, quake);
      } else if (isSelected) {
        const pulse = 1.05 + Math.sin(Date.now() * 0.003) * 0.05;
        sphere.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [agentId, size, isSelected]);

  return (
    <div
      ref={mountRef}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center cursor-pointer transition-all duration-300 rounded-full ${
        isSelected ? 'ring-2 ring-[#4A9B9D] scale-110 shadow-lg shadow-[#4A9B9D]/20' : 'hover:scale-105 opacity-90 hover:opacity-100'
      }`}
    />
  );
};
