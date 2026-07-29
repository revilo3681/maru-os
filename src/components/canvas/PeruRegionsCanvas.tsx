import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Cloud, Environment, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ── Region Components ──

// 1. Costa (Coast): Waves, sand, mist
const Costa = () => {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.position.y = Math.sin(clock.elapsedTime) * 0.1 - 2;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, -5]} intensity={1.5} color="#FFD700" />
      {/* Sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#E3DCCB" roughness={0.9} />
      </mesh>
      {/* Water/Ocean */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 5]}>
        <planeGeometry args={[100, 50, 32, 32]} />
        <meshStandardMaterial color="#4A9B9D" transparent opacity={0.8} roughness={0.1} metalness={0.5} />
      </mesh>
      <Cloud opacity={0.3} speed={0.4} segments={20} color="#F5F1E8" position={[0, 5, -10]} />
      <Sparkles count={100} scale={20} size={4} speed={0.2} color="#FFFFFF" opacity={0.2} />
    </group>
  );
};

// 2. Sierra (Highlands): Mountains, wind, stars
const Sierra = () => {
  const mountainsRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (mountainsRef.current) {
      // Gentle floating effect for abstract mountains
      mountainsRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.2} color="#1E3A5F" />
      <directionalLight position={[-10, 10, 5]} intensity={2} color="#F5F5F5" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <group ref={mountainsRef}>
        {/* Abstract Mountains */}
        <mesh position={[-5, 0, -10]}>
          <coneGeometry args={[6, 12, 4]} />
          <meshStandardMaterial color="#2C3E50" roughness={0.8} />
        </mesh>
        <mesh position={[4, -1, -8]}>
          <coneGeometry args={[5, 10, 4]} />
          <meshStandardMaterial color="#1E3A5F" roughness={0.9} />
        </mesh>
        <mesh position={[0, -3, -5]}>
          <coneGeometry args={[7, 8, 4]} />
          <meshStandardMaterial color="#4A1512" roughness={0.8} />
        </mesh>
      </group>
      <Sparkles count={300} scale={30} size={2} speed={0.5} color="#B8924A" opacity={0.5} />
    </group>
  );
};

// 3. Selva (Jungle): Lush green, dense, rain/particles
const Selva = () => {
  return (
    <group>
      <ambientLight intensity={0.4} color="#1A3326" />
      <pointLight position={[0, 5, 0]} intensity={1.5} color="#5A8F6B" />
      
      {/* Canopy / Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1A3326" roughness={1} />
      </mesh>
      
      {/* Abstract Trees */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[(Math.random() - 0.5) * 30, Math.random() * 2, (Math.random() - 0.5) * 30 - 5]}
        >
          <sphereGeometry args={[1.5 + Math.random(), 8, 8]} />
          <meshStandardMaterial color="#5A8F6B" roughness={0.8} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Fireflies / Rain */}
      <Sparkles count={500} scale={40} size={3} speed={1.5} color="#A3E4D7" opacity={0.8} noise={1} />
      <Cloud opacity={0.4} speed={0.2} segments={40} color="#1A3326" position={[0, 8, 0]} />
    </group>
  );
};

// ── Main Canvas Component ──
interface PeruRegionsCanvasProps {
  region: 'costa' | 'sierra' | 'selva';
}

export const PeruRegionsCanvas: React.FC<PeruRegionsCanvasProps> = ({ region }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 2, 10], fov: 60 }}>
        {/* Render Region Content */}
        {region === 'costa' && <Costa />}
        {region === 'sierra' && <Sierra />}
        {region === 'selva' && <Selva />}

        {/* Global effects */}
        <Environment preset="dawn" />
        {/* Very subtle orbit controls so the camera slightly follows the mouse if enabled, but disabled for purely background effect */}
      </Canvas>
    </div>
  );
};
