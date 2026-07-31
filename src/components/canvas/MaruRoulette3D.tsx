import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { AGENTS_CATALOG } from '../../data/agentsData';
import { AgentId } from '../../types';

interface MaruRoulette3DProps {
  size?: number;
  selectedAgentId?: AgentId | null;
  onSelectAgent?: (id: AgentId) => void;
  autoSpin?: boolean;
  showLabels?: boolean;
  className?: string;
}

function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function EnsoCore({ spinning }: { spinning: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const logoTexture = useTexture('/logo.jpg');
  logoTexture.colorSpace = THREE.SRGBColorSpace;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (spinning) {
      groupRef.current.rotation.z -= delta * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Inner dark sphere */}
      <mesh>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshStandardMaterial
          color="#0B0D17"
          metalness={0.85}
          roughness={0.25}
          emissive="#1A1408"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Logo disc — the Andean enso landscape */}
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[0.92, 64]} />
        <meshStandardMaterial
          map={logoTexture}
          metalness={0.15}
          roughness={0.55}
          emissive="#D4AF37"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Soft front vignette ring */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0.04]}>
        <ringGeometry args={[0.78, 0.93, 64]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function GoldHalos({ velocity }: { velocity: React.MutableRefObject<number> }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const midRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const spin = velocity.current;
    if (outerRef.current) outerRef.current.rotation.z += delta * (0.2 + spin * 0.4);
    if (midRef.current) midRef.current.rotation.z -= delta * (0.35 + spin * 0.5);
  });

  return (
    <group>
      <mesh ref={outerRef} rotation={[Math.PI / 2.4, 0.2, 0]}>
        <torusGeometry args={[1.45, 0.035, 16, 100]} />
        <meshStandardMaterial
          color="#D4AF37"
          emissive="#D4AF37"
          emissiveIntensity={1.4}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={midRef} rotation={[Math.PI / 2.1, -0.15, 0.4]}>
        <torusGeometry args={[1.28, 0.018, 12, 80]} />
        <meshStandardMaterial
          color="#E8B84A"
          emissive="#E8B84A"
          emissiveIntensity={0.9}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      {/* Glow shell */}
      <mesh>
        <sphereGeometry args={[1.55, 32, 32]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

interface OrbitNodeProps {
  agentId: AgentId;
  name: string;
  color: string;
  angle: number;
  radius: number;
  selected: boolean;
  showLabel: boolean;
  onSelect?: (id: AgentId) => void;
}

function OrbitNode({
  agentId,
  name,
  color,
  angle,
  radius,
  selected,
  showLabel,
  onSelect
}: OrbitNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const colorInt = hexToInt(color);

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = selected || hovered ? 1.15 + Math.sin(state.clock.elapsedTime * 4) * 0.08 : 1;
    meshRef.current.scale.setScalar(pulse);
  });

  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <group position={[x, y, 0.2]}>
      {/* Connector line toward center */}
      <mesh rotation={[0, 0, angle + Math.PI / 2]} position={[-x * 0.45, -y * 0.45, -0.05]}>
        <cylinderGeometry args={[0.008, 0.008, radius * 0.85, 8]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={selected ? 0.7 : 0.28} />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect?.(agentId);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'grab';
        }}
      >
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial
          color={colorInt}
          emissive={colorInt}
          emissiveIntensity={selected || hovered ? 1.2 : 0.55}
          metalness={0.55}
          roughness={0.3}
        />
      </mesh>

      {showLabel && (
        <Billboard position={[0, 0.32, 0]}>
          <Text
            fontSize={0.12}
            color={selected || hovered ? '#F2EFE6' : '#D4AF37'}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#0B0D17"
          >
            {name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function RouletteScene({
  selectedAgentId,
  onSelectAgent,
  autoSpin,
  showLabels,
  velocity
}: {
  selectedAgentId?: AgentId | null;
  onSelectAgent?: (id: AgentId) => void;
  autoSpin: boolean;
  showLabels: boolean;
  velocity: React.MutableRefObject<number>;
}) {
  const wheelRef = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const lastX = useRef(0);

  useFrame((_, delta) => {
    if (!wheelRef.current) return;

    if (!dragging.current) {
      // Friction + gentle auto-spin (roulette feel)
      if (Math.abs(velocity.current) > 0.002) {
        velocity.current *= 0.985;
      } else if (autoSpin) {
        velocity.current = THREE.MathUtils.lerp(velocity.current, 0.55, 0.02);
      } else {
        velocity.current *= 0.9;
      }
    }

    wheelRef.current.rotation.z += velocity.current * delta;
  });

  const agents = AGENTS_CATALOG;
  const radius = 1.85;

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[3, 2, 4]} intensity={2.2} color="#D4AF37" />
      <pointLight position={[-3, -1, 2]} intensity={1.1} color="#4A9B9D" />
      <directionalLight position={[0, 4, 2]} intensity={0.8} color="#FFE6A8" />

      <group
        onPointerDown={(e) => {
          e.stopPropagation();
          dragging.current = true;
          lastX.current = e.clientX;
          document.body.style.cursor = 'grabbing';
        }}
        onPointerUp={() => {
          dragging.current = false;
          document.body.style.cursor = 'grab';
        }}
        onPointerLeave={() => {
          dragging.current = false;
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const dx = e.clientX - lastX.current;
          lastX.current = e.clientX;
          velocity.current = THREE.MathUtils.clamp(velocity.current + dx * 0.08, -8, 8);
        }}
      >
        <EnsoCore spinning={false} />
        <GoldHalos velocity={velocity} />

        <group ref={wheelRef}>
          {agents.map((agent, i) => {
            const angle = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
            return (
              <OrbitNode
                key={agent.id}
                agentId={agent.id}
                name={agent.name}
                color={agent.colorAccent}
                angle={angle}
                radius={radius}
                selected={selectedAgentId === agent.id}
                showLabel={showLabels}
                onSelect={onSelectAgent}
              />
            );
          })}
        </group>
      </group>

      {/* Center brand label as HUD-like plane (non-spinning for readability) */}
      <Billboard position={[0, 0, 1.2]}>
        <Text
          fontSize={0.22}
          color="#F2EFE6"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
          outlineWidth={0.012}
          outlineColor="#0B0D17"
        >
          MARU OS
        </Text>
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.07}
          color="#D4AF37"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
          outlineWidth={0.006}
          outlineColor="#0B0D17"
        >
          Sistema Operativo Cognitivo
        </Text>
      </Billboard>
    </>
  );
}

export const MaruRoulette3D: React.FC<MaruRoulette3DProps> = ({
  size = 420,
  selectedAgentId = null,
  onSelectAgent,
  autoSpin = true,
  showLabels = true,
  className = ''
}) => {
  const velocity = useRef(0.55);

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size, maxWidth: '100%', aspectRatio: '1' }}
      title="Arrastra para girar · clic en un agente para enfocarlo"
    >
      {/* Atmospheric CSS halo behind canvas */}
      <div
        className="absolute inset-[8%] rounded-full animate-maru-halo pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.08) 45%, transparent 70%)',
          filter: 'blur(8px)'
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', cursor: 'grab', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <RouletteScene
            selectedAgentId={selectedAgentId}
            onSelectAgent={onSelectAgent}
            autoSpin={autoSpin}
            showLabels={showLabels}
            velocity={velocity}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
