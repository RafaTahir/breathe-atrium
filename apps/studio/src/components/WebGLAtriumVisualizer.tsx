import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ContactShadows, Html, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AtriumAirflowVisualizer, type AtriumAirflowMode } from "./AtriumAirflowVisualizer";

export type AtriumEnvironmentMode = "day" | "night";

type WebGLAtriumVisualizerProps = {
  environment?: AtriumEnvironmentMode;
  explainMode?: boolean;
  mode: AtriumAirflowMode;
  presentationLock?: boolean;
};

type SceneErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type SceneErrorBoundaryState = {
  hasError: boolean;
};

const cyan = "#20f0d0";
const cyanSoft = "#b8fbff";
const amber = "#f2b84b";
const amberSoft = "#ffd79a";
const glassColor = "#aeeeff";
const zeroVector = new THREE.Vector3(0, 0, 0);

class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export function WebGLAtriumVisualizer({
  environment = "day",
  explainMode = false,
  mode,
  presentationLock = false,
}: WebGLAtriumVisualizerProps) {
  const [webglSupported, setWebglSupported] = useState(() => hasWebGLSupport());

  useEffect(() => {
    setWebglSupported(hasWebGLSupport());
  }, []);

  const fallback = <AtriumAirflowVisualizer chrome="scene" mode={mode} surface="bare" variant="pitch" />;

  if (!webglSupported) {
    return fallback;
  }

  return (
    <SceneErrorBoundary fallback={fallback}>
      <div
        className={`three-atrium-visualizer three-atrium-${environment} ${
          explainMode ? "three-atrium-explain" : ""
        } ${presentationLock ? "three-atrium-locked" : ""}`}
        data-atrium-webgl-shell="true"
      >
        <Canvas
          camera={{ fov: 42, near: 0.1, far: 100, position: [7.5, 5.1, 8.4] }}
          dpr={[1, 1.65]}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true,
            stencil: false,
          }}
          onCreated={({ camera }) => {
            camera.lookAt(0.35, 2.05, 0);
          }}
          shadows
          data-atrium-webgl-scene="true"
        >
          <color attach="background" args={["#02040a"]} />
          <fog attach="fog" args={["#02040a", 12, 24]} />
          <AtriumScene
            environment={environment}
            explainMode={explainMode}
            mode={mode}
            presentationLock={presentationLock}
          />
        </Canvas>
        <div className="three-atrium-badge">{environment === "day" ? "Day solar drive" : "Night passive drift"}</div>
        <div className="three-atrium-hint">{presentationLock ? "Fullscreen orbit enabled" : "Drag to orbit"}</div>
      </div>
    </SceneErrorBoundary>
  );
}

function AtriumScene({
  environment = "day",
  explainMode = false,
  mode,
  presentationLock = false,
}: Required<WebGLAtriumVisualizerProps>) {
  const active = mode === "breathe";
  const isDay = environment === "day";
  const showLabels = explainMode || presentationLock;

  return (
    <>
      <ambientLight intensity={isDay ? 0.78 : 0.42} />
      <hemisphereLight args={[isDay ? "#d9fbff" : "#7ea9ff", "#070b18", isDay ? 0.82 : 0.52]} />
      <directionalLight
        castShadow
        color={isDay ? amberSoft : "#9db7ff"}
        intensity={isDay ? 2.75 : 0.72}
        position={isDay ? [3.5, 7.2, 4.5] : [-3.2, 5.2, 5.6]}
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        angle={0.35}
        color={active ? (isDay ? amberSoft : cyanSoft) : amberSoft}
        decay={1.5}
        distance={18}
        intensity={active ? (isDay ? 112 : 42) : isDay ? 78 : 26}
        penumbra={0.72}
        position={[1.8, 7.4, 5.2]}
      />
      <pointLight color={active ? cyan : amber} intensity={active ? (isDay ? 18 : 9) : isDay ? 12 : 5} position={[2.6, 3.4, 0.8]} />
      <AtmosphericEnvironment active={active} environment={environment} />

      <group rotation={[0, -0.25, 0]} position={[0, -0.35, 0]}>
        <GroundPlane active={active} environment={environment} />
        <AtriumBuilding active={active} environment={environment} explainMode={explainMode} />
        <ThermalField active={active} environment={environment} />
        <ExplodedGroup enabled={explainMode} offset={[0, -0.03, 0.22]}>
          <OccupantScaleReferences active={active} environment={environment} />
        </ExplodedGroup>
        <AirflowSystem active={active} environment={environment} explainMode={explainMode} />
        <ArchitecturalZoneLabels explainMode={explainMode} visible={showLabels} />
      </group>

      <ContactShadows blur={2.6} far={12} opacity={0.36} position={[0, -0.38, 0]} scale={12} />
      <OrbitControls
        autoRotate
        autoRotateSpeed={presentationLock ? 0.16 : 0.28}
        enableDamping
        enableRotate
        enableZoom
        enablePan={false}
        maxDistance={13}
        maxPolarAngle={Math.PI / 2.12}
        minDistance={7.2}
        minPolarAngle={Math.PI / 5.3}
        target={[0.35, 2.05, 0]}
      />
    </>
  );
}

function AtmosphericEnvironment({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";
  const sunOpacity = active ? (isDay ? 0.2 : 0.035) : isDay ? 0.14 : 0.02;

  return (
    <group>
      <mesh position={[-0.85, 5.02, 1.72]} rotation={[-0.92, 0.32, -0.72]} renderOrder={4}>
        <planeGeometry args={[4.7, 3.2]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color={isDay ? amberSoft : "#8ca7ff"}
          depthWrite={false}
          opacity={sunOpacity}
          side={THREE.DoubleSide}
          transparent
        />
      </mesh>
      <mesh position={[2.08, 3.72, 0.58]} scale={active ? [0.62, isDay ? 1.85 : 0.92, 0.62] : [0.38, 0.55, 0.38]} renderOrder={5}>
        <sphereGeometry args={[1, 32, 18]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color={isDay ? amberSoft : cyanSoft}
          depthWrite={false}
          opacity={active ? (isDay ? 0.16 : 0.07) : 0.045}
          transparent
        />
      </mesh>
      {!isDay && (
        <mesh position={[-2.8, 4.85, -2.2]} renderOrder={4}>
          <sphereGeometry args={[0.18, 28, 16]} />
          <meshBasicMaterial color="#dbe7ff" opacity={0.82} transparent />
        </mesh>
      )}
    </group>
  );
}

function GroundPlane({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";

  return (
    <group>
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[5.8, 5.8, 0.06, 96]} />
        <meshStandardMaterial color={isDay ? "#050914" : "#040716"} metalness={0.18} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.1, 5.2, 96]} />
        <meshBasicMaterial color={active ? cyan : amber} opacity={active ? (isDay ? 0.12 : 0.08) : 0.08} side={THREE.DoubleSide} transparent />
      </mesh>
      <gridHelper args={[10, 18, active ? cyan : amber, isDay ? "#1b2633" : "#142139"]} position={[0, 0.015, 0]} />
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.25, 96]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color={active ? cyan : amber}
          depthWrite={false}
          opacity={active ? (isDay ? 0.055 : 0.035) : 0.04}
          transparent
        />
      </mesh>
    </group>
  );
}

function AtriumBuilding({
  active,
  environment,
  explainMode,
}: {
  active: boolean;
  environment: AtriumEnvironmentMode;
  explainMode: boolean;
}) {
  const floors = [0.62, 1.45, 2.28, 3.11];
  const isDay = environment === "day";
  const chimneyIntensity = active ? (isDay ? 0.44 : 0.17) : isDay ? 0.08 : 0.04;

  return (
    <group>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[5.4, 0.16, 4.55]} />
        <meshStandardMaterial color="#0a101b" metalness={0.28} roughness={0.46} />
      </mesh>
      <PodiumEnvelope active={active} environment={environment} />

      {floors.map((height) => (
        <group key={height}>
          <FloorPlate position={[-2.45, height, 0]} />
          <FloorPlate position={[2.45, height, 0]} />
          <mesh position={[0, height + 0.025, -2.18]}>
            <boxGeometry args={[5.3, 0.055, 0.16]} />
            <meshStandardMaterial color="#182431" metalness={0.22} roughness={0.52} />
          </mesh>
        </group>
      ))}

      {[-2.95, 2.95].map((x) =>
        [-2.08, 2.08].map((z) => (
          <mesh castShadow key={`${x}-${z}`} position={[x, 2.16, z]}>
            <cylinderGeometry args={[0.045, 0.045, 4.15, 16]} />
            <meshStandardMaterial color="#8fb7c4" emissive="#20343a" emissiveIntensity={0.22} metalness={0.45} roughness={0.28} />
          </mesh>
        ))
      )}

      <InteriorAtriumDetails active={active} environment={environment} />

      <ExplodedGroup enabled={explainMode} offset={[0, 0.08, -0.18]}>
        <DoubleSkinEnvelope active={active} environment={environment} />
      </ExplodedGroup>

      <ExplodedGroup enabled={explainMode} offset={[0.0, 0.34, -0.16]}>
        <SolarGlassRoof active={active} environment={environment} />
      </ExplodedGroup>

      <ExplodedGroup enabled={explainMode} offset={[0.52, 0.16, 0.1]}>
        <SolarChimneyAssembly active={active} chimneyIntensity={chimneyIntensity} environment={environment} />
      </ExplodedGroup>

      <ExplodedGroup enabled={explainMode} offset={[0.86, 0.28, 0.14]}>
        <HighLevelExhaust active={active} environment={environment} />
      </ExplodedGroup>

      <ExplodedGroup enabled={explainMode} offset={[-0.58, 0.02, -0.08]}>
        <IntakeOpening position={[-3.12, 0.58, -1.2]} active={active} environment={environment} />
        <IntakeOpening position={[-3.12, 0.58, 1.2]} active={active} environment={environment} />
        <IntakeOpening position={[-3.12, 1.02, 0]} active={active} environment={environment} wide />
      </ExplodedGroup>

      <ExplodedGroup enabled={explainMode} offset={[-0.16, 0, 0.22]}>
        <mesh position={[-1.6, 1.23, -1.38]}>
          <boxGeometry args={[0.12, 1.65, 1.28]} />
          <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={active ? (isDay ? 0.64 : 0.32) : 0.16} opacity={active ? 0.28 : 0.1} transparent />
        </mesh>
        <mesh position={[-1.53, 2.1, -1.38]}>
          <boxGeometry args={[0.18, 0.12, 1.42]} />
          <meshStandardMaterial color="#17313a" emissive={active ? cyan : "#14222a"} emissiveIntensity={active ? 0.18 : 0.06} metalness={0.24} roughness={0.42} />
        </mesh>
        <mesh position={[-1.53, 0.38, -1.38]}>
          <boxGeometry args={[0.22, 0.16, 1.55]} />
          <meshStandardMaterial color="#0b1820" emissive={active ? cyan : "#111820"} emissiveIntensity={active ? 0.16 : 0.05} metalness={0.18} roughness={0.56} />
        </mesh>
        {[-0.46, -0.18, 0.1, 0.38].map((z) => (
          <mesh key={z} position={[-1.47, 1.22, -1.38 + z]}>
            <boxGeometry args={[0.035, 1.55, 0.025]} />
            <meshBasicMaterial blending={THREE.AdditiveBlending} color={cyanSoft} opacity={active ? 0.28 : 0.08} transparent />
          </mesh>
        ))}

        <mesh position={[-0.45, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.45, 64]} />
          <meshBasicMaterial color={active ? cyan : amber} opacity={active ? 0.16 : 0.08} side={THREE.DoubleSide} transparent />
        </mesh>
      </ExplodedGroup>
    </group>
  );
}

function PodiumEnvelope({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";
  const accent = active ? cyan : amber;

  return (
    <group>
      <mesh position={[0, 0.56, -2.42]}>
        <boxGeometry args={[5.85, 0.72, 0.18]} />
        <meshStandardMaterial color="#0c131c" emissive={accent} emissiveIntensity={active ? 0.04 : 0.025} metalness={0.22} roughness={0.5} />
      </mesh>
      <mesh position={[2.94, 0.56, 0]}>
        <boxGeometry args={[0.18, 0.72, 4.72]} />
        <meshStandardMaterial color="#0d151e" emissive={active ? amber : "#231509"} emissiveIntensity={active ? (isDay ? 0.06 : 0.035) : 0.025} metalness={0.22} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.52, 2.74]}>
        <boxGeometry args={[2.1, 0.42, 0.18]} />
        <meshStandardMaterial color="#111d27" emissive={accent} emissiveIntensity={active ? 0.12 : 0.04} metalness={0.24} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.82, 2.98]} rotation={[0.04, 0, 0]}>
        <boxGeometry args={[2.6, 0.055, 0.88]} />
        <meshPhysicalMaterial clearcoat={0.7} color="#d4f8ff" metalness={0.08} opacity={isDay ? 0.18 : 0.12} roughness={0.08} transparent />
      </mesh>
      {[-2.1, -1.05, 1.05, 2.1].map((x) => (
        <mesh key={x} position={[x, 0.52, 2.76]}>
          <boxGeometry args={[0.5, 0.26, 0.08]} />
          <meshStandardMaterial color="#070c12" emissive={accent} emissiveIntensity={active ? 0.2 : 0.06} metalness={0.16} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function InteriorAtriumDetails({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";
  const accent = active ? cyan : amber;

  return (
    <group>
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <boxGeometry args={[2.85, 0.06, 2.35]} />
        <meshStandardMaterial color="#121d27" emissive={active ? "#062421" : "#201306"} emissiveIntensity={0.18} metalness={0.26} roughness={0.48} />
      </mesh>

      {[1.05, 1.88, 2.71].map((height, index) => (
        <group key={height}>
          <mesh position={[0, height, -0.03]}>
            <boxGeometry args={[1.84 - index * 0.16, 0.045, 1.34]} />
            <meshStandardMaterial color="#162330" metalness={0.34} roughness={0.38} />
          </mesh>
          <mesh position={[0, height + 0.08, 0.68]}>
            <boxGeometry args={[1.72 - index * 0.12, 0.04, 0.045]} />
            <meshStandardMaterial color="#9dbdcc" emissive="#172d35" emissiveIntensity={0.18} metalness={0.5} roughness={0.24} />
          </mesh>
        </group>
      ))}

      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 0.38, -0.86]}>
          <boxGeometry args={[0.56, 0.18, 0.24]} />
          <meshStandardMaterial color="#1d2a31" emissive={accent} emissiveIntensity={active ? 0.035 : 0.025} metalness={0.16} roughness={0.7} />
        </mesh>
      ))}

      {[-1.45, -0.55, 0.55, 1.45].map((x) => (
        <group key={x} position={[x, 0.38, 1.36]}>
          <mesh>
            <boxGeometry args={[0.38, 0.2, 0.32]} />
            <meshStandardMaterial color="#172820" emissive={active ? cyan : "#1d140a"} emissiveIntensity={active ? 0.12 : 0.04} roughness={0.62} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.18, 16, 10]} />
            <meshStandardMaterial color={isDay ? "#4c7259" : "#244e45"} emissive={active ? "#0a332d" : "#1a1409"} emissiveIntensity={0.16} roughness={0.8} />
          </mesh>
        </group>
      ))}

      <mesh position={[-1.58, 0.72, -0.18]} rotation={[0, 0, -0.38]}>
        <boxGeometry args={[0.08, 1.18, 0.26]} />
        <meshStandardMaterial color="#233240" metalness={0.32} roughness={0.4} />
      </mesh>
    </group>
  );
}

function DoubleSkinEnvelope({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";
  const innerOpacity = isDay ? 0.13 : 0.1;
  const outerOpacity = isDay ? 0.22 : 0.16;
  const cavityGlow = active ? (isDay ? 0.34 : 0.18) : 0.08;

  return (
    <group>
      <GlassPanel position={[0, 2.36, 2.22]} scale={[6.0, 4.42, 0.04]} opacity={innerOpacity} />
      <GlassPanel position={[0, 2.36, 2.58]} scale={[6.28, 4.58, 0.04]} opacity={outerOpacity} />
      <GlassPanel position={[0, 2.36, -2.22]} scale={[6.0, 4.42, 0.04]} opacity={innerOpacity * 0.72} />
      <GlassPanel position={[0, 2.36, -2.58]} scale={[6.28, 4.58, 0.04]} opacity={outerOpacity * 0.62} />
      <GlassPanel position={[-3.02, 2.36, 0]} rotation={[0, Math.PI / 2, 0]} scale={[4.52, 4.42, 0.04]} opacity={innerOpacity} />
      <GlassPanel position={[-3.38, 2.36, 0]} rotation={[0, Math.PI / 2, 0]} scale={[4.82, 4.58, 0.04]} opacity={outerOpacity} />
      <GlassPanel position={[3.02, 2.36, 0]} rotation={[0, Math.PI / 2, 0]} scale={[4.52, 4.42, 0.04]} opacity={innerOpacity} />
      <GlassPanel position={[3.38, 2.36, 0]} rotation={[0, Math.PI / 2, 0]} scale={[4.82, 4.58, 0.04]} opacity={outerOpacity} />

      {[-2.45, -1.22, 0, 1.22, 2.45].map((x) => (
        <ArchitecturalBar key={`front-v-${x}`} position={[x, 2.38, 2.62]} scale={[0.045, 4.48, 0.055]} />
      ))}
      {[0.86, 1.68, 2.5, 3.32, 4.12].map((y) => (
        <ArchitecturalBar key={`front-h-${y}`} position={[0, y, 2.64]} scale={[6.1, 0.035, 0.045]} color="#7899a8" />
      ))}
      {[1.18, 1.96, 2.74, 3.52].map((y) => (
        <group key={`front-fin-${y}`}>
          <ArchitecturalBar
            color="#101923"
            emissive={active ? cyan : "#24170b"}
            emissiveIntensity={active ? 0.1 : 0.04}
            position={[-1.7, y, 2.92]}
            rotation={[0, 0, -0.045]}
            scale={[2.62, 0.055, 0.08]}
          />
          <ArchitecturalBar
            color="#101923"
            emissive={active ? cyan : "#24170b"}
            emissiveIntensity={active ? 0.1 : 0.04}
            position={[1.7, y + 0.08, 2.92]}
            rotation={[0, 0, 0.045]}
            scale={[2.62, 0.055, 0.08]}
          />
        </group>
      ))}
      {[-1.65, 0, 1.65].map((z) => (
        <ArchitecturalBar key={`side-left-${z}`} position={[-3.42, 2.4, z]} rotation={[0, Math.PI / 2, 0]} scale={[0.045, 4.42, 0.055]} />
      ))}
      {[-1.65, 0, 1.65].map((z) => (
        <ArchitecturalBar key={`side-right-${z}`} position={[3.42, 2.4, z]} rotation={[0, Math.PI / 2, 0]} scale={[0.045, 4.42, 0.055]} />
      ))}

      <mesh position={[-3.2, 2.28, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={8}>
        <boxGeometry args={[4.52, 3.72, 0.025]} />
        <meshBasicMaterial blending={THREE.AdditiveBlending} color={active ? cyan : amber} depthWrite={false} opacity={cavityGlow * 0.18} transparent />
      </mesh>
      <mesh position={[3.2, 2.28, 0]} rotation={[0, Math.PI / 2, 0]} renderOrder={8}>
        <boxGeometry args={[4.52, 3.72, 0.025]} />
        <meshBasicMaterial blending={THREE.AdditiveBlending} color={active ? amberSoft : amber} depthWrite={false} opacity={cavityGlow * 0.16} transparent />
      </mesh>
    </group>
  );
}

function SolarGlassRoof({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";
  const roofGlow = active ? (isDay ? 0.22 : 0.09) : isDay ? 0.12 : 0.05;

  return (
    <group>
      <RoofPane position={[-1.52, 4.58, 0]} rotation={[0, 0, -0.24]} opacity={isDay ? 0.2 : 0.15} />
      <RoofPane position={[1.52, 4.58, 0]} rotation={[0, 0, 0.24]} opacity={isDay ? 0.2 : 0.15} />
      <RoofPane position={[-1.58, 4.82, 0]} rotation={[0, 0, -0.24]} opacity={isDay ? 0.14 : 0.11} tint="#d5fbff" />
      <RoofPane position={[1.58, 4.82, 0]} rotation={[0, 0, 0.24]} opacity={isDay ? 0.14 : 0.11} tint="#d5fbff" />

      <ArchitecturalBar position={[0, 4.76, 0]} scale={[0.16, 0.18, 4.96]} color="#d3e5e9" emissive={active ? amber : "#1e3440"} emissiveIntensity={roofGlow} />
      {[-1.65, -0.82, 0, 0.82, 1.65].map((x) => (
        <group key={`roof-rib-${x}`}>
          <ArchitecturalBar position={[x - 0.62, 4.78, 0]} rotation={[0, 0, -0.24]} scale={[0.045, 0.08, 4.82]} color="#b8ccd4" emissive="#22353f" emissiveIntensity={0.16} />
          <ArchitecturalBar position={[x + 0.62, 4.78, 0]} rotation={[0, 0, 0.24]} scale={[0.045, 0.08, 4.82]} color="#b8ccd4" emissive="#22353f" emissiveIntensity={0.16} />
        </group>
      ))}
      {[-1.95, -0.98, 0, 0.98, 1.95].map((z) => (
        <mesh key={`solar-strip-${z}`} position={[0, 4.91, z]} rotation={[0, 0, 0]}>
          <boxGeometry args={[4.72, 0.026, 0.07]} />
          <meshStandardMaterial color="#131f27" emissive={active ? amber : "#1a2432"} emissiveIntensity={roofGlow} metalness={0.3} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function RoofPane({
  opacity,
  position,
  rotation,
  tint = glassColor,
}: {
  opacity: number;
  position: [number, number, number];
  rotation: [number, number, number];
  tint?: string;
}) {
  return (
    <mesh castShadow position={position} rotation={rotation}>
      <boxGeometry args={[3.42, 0.055, 4.92]} />
      <meshPhysicalMaterial
        clearcoat={1}
        color={tint}
        metalness={0.04}
        opacity={opacity}
        roughness={0.05}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}

function SolarChimneyAssembly({
  active,
  chimneyIntensity,
  environment,
}: {
  active: boolean;
  chimneyIntensity: number;
  environment: AtriumEnvironmentMode;
}) {
  const isDay = environment === "day";

  return (
    <group>
      <mesh position={[2.08, 2.42, 0.58]}>
        <boxGeometry args={[0.94, 4.48, 1.02]} />
        <meshPhysicalMaterial
          clearcoat={0.82}
          color={active ? (isDay ? amberSoft : cyan) : "#587884"}
          emissive={active ? (isDay ? amber : cyan) : "#13212a"}
          emissiveIntensity={chimneyIntensity}
          metalness={0.08}
          opacity={active ? (isDay ? 0.24 : 0.17) : 0.12}
          roughness={0.13}
          transparent
        />
      </mesh>
      <mesh position={[1.66, 2.34, 0.06]}>
        <boxGeometry args={[0.08, 4.08, 0.84]} />
        <meshStandardMaterial color="#080b10" emissive={active ? amber : "#1a0f08"} emissiveIntensity={active ? (isDay ? 0.56 : 0.18) : 0.08} metalness={0.1} roughness={0.72} />
      </mesh>
      <mesh position={[2.08, 2.42, 0.58]} renderOrder={18}>
        <boxGeometry args={[0.42, 4.12, 0.54]} />
        <meshBasicMaterial
          blending={THREE.AdditiveBlending}
          color={active ? (isDay ? amberSoft : cyanSoft) : amber}
          depthWrite={false}
          opacity={active ? (isDay ? 0.18 : 0.08) : 0.055}
          transparent
        />
      </mesh>
      {[-0.48, 0.48].map((z) => (
        <ArchitecturalBar key={`chimney-z-${z}`} position={[2.56, 2.42, 0.58 + z]} scale={[0.055, 4.4, 0.05]} color="#b1cad2" emissive="#243740" emissiveIntensity={0.18} />
      ))}
      {[-0.42, 0.42].map((x) => (
        <ArchitecturalBar key={`chimney-x-${x}`} position={[2.08 + x, 2.42, 1.1]} scale={[0.055, 4.4, 0.05]} color="#b1cad2" emissive="#243740" emissiveIntensity={0.18} />
      ))}
    </group>
  );
}

function HighLevelExhaust({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";

  return (
    <group position={[3.08, 4.48, 0.58]} rotation={[0, 0, -0.08]}>
      <mesh>
        <boxGeometry args={[1.95, 0.38, 0.76]} />
        <meshStandardMaterial
          color={active ? "#162f32" : "#2c2217"}
          emissive={active ? (isDay ? amber : cyan) : amber}
          emissiveIntensity={active ? (isDay ? 0.32 : 0.14) : 0.08}
          metalness={0.28}
          roughness={0.32}
        />
      </mesh>
      <mesh position={[0.72, 0.04, 0]}>
        <boxGeometry args={[0.62, 0.26, 0.66]} />
        <meshStandardMaterial color="#050810" emissive={active ? amber : "#271509"} emissiveIntensity={active ? 0.26 : 0.08} metalness={0.22} roughness={0.44} />
      </mesh>
      {[-0.22, 0, 0.22].map((z) => (
        <mesh key={z} position={[0.74, 0.06, z]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.68, 0.035, 0.035]} />
          <meshStandardMaterial color={active ? amberSoft : "#9b7850"} emissive={active ? amber : "#201409"} emissiveIntensity={active ? (isDay ? 0.36 : 0.16) : 0.08} />
        </mesh>
      ))}
    </group>
  );
}

function ArchitecturalBar({
  color = "#8fb7c4",
  emissive = "#20343a",
  emissiveIntensity = 0.2,
  position,
  rotation = [0, 0, 0],
  scale,
}: {
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
}) {
  return (
    <mesh castShadow position={position} rotation={rotation}>
      <boxGeometry args={scale} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} metalness={0.44} roughness={0.3} />
    </mesh>
  );
}

function FloorPlate({ position }: { position: [number, number, number] }) {
  return (
    <mesh castShadow receiveShadow position={position}>
      <boxGeometry args={[2.1, 0.07, 4.34]} />
      <meshStandardMaterial color="#101924" metalness={0.32} roughness={0.4} />
    </mesh>
  );
}

function GlassPanel({
  opacity = 0.16,
  position,
  rotation = [0, 0, 0],
  scale,
}: {
  opacity?: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={scale} />
      <meshPhysicalMaterial
        clearcoat={1}
        color={glassColor}
        metalness={0.05}
        opacity={opacity}
        roughness={0.06}
        side={THREE.DoubleSide}
        transparent
      />
    </mesh>
  );
}

function IntakeOpening({
  active,
  environment,
  position,
  wide = false,
}: {
  active: boolean;
  environment: AtriumEnvironmentMode;
  position: [number, number, number];
  wide?: boolean;
}) {
  const isDay = environment === "day";
  const width = wide ? 1.32 : 0.72;

  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <boxGeometry args={[width, 0.38, 0.1]} />
        <meshStandardMaterial color="#050914" metalness={0.2} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[width - 0.14, 0.24, 0.03]} />
        <meshBasicMaterial color={cyan} opacity={active ? (isDay ? 0.62 : 0.42) : 0.16} transparent />
      </mesh>
      {[-0.12, 0, 0.12].map((y) => (
        <mesh key={y} position={[0, y, 0.088]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[width - 0.18, 0.026, 0.035]} />
          <meshStandardMaterial color="#b8d7dd" emissive={active ? cyan : "#1a2c31"} emissiveIntensity={active ? 0.24 : 0.08} metalness={0.38} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

function ThermalField({ active, environment }: { active: boolean; environment: AtriumEnvironmentMode }) {
  const isDay = environment === "day";
  const upperHeatScale: [number, number, number] = active
    ? [1.05, isDay ? 0.42 : 0.28, 0.78]
    : [2.42, isDay ? 0.92 : 0.58, 1.78];
  const upperHeatOpacity = active ? (isDay ? 0.14 : 0.08) : isDay ? 0.36 : 0.22;
  const comfortOpacity = active ? (isDay ? 0.22 : 0.18) : 0.055;

  return (
    <group>
      <ThermalVolume color={amber} opacity={upperHeatOpacity} position={[0.2, active ? 3.42 : 3.58, 0]} scale={upperHeatScale} />
      <ThermalVolume color={cyan} opacity={comfortOpacity} position={[-0.55, 0.92, 0.15]} scale={active ? [1.82, 0.24, 1.25] : [0.92, 0.12, 0.72]} />
      <ThermalVolume
        color={active ? (isDay ? amberSoft : cyanSoft) : amber}
        opacity={active ? (isDay ? 0.28 : 0.13) : 0.1}
        position={[2.08, 3.18, 0.58]}
        scale={active ? [0.38, isDay ? 1.45 : 0.82, 0.42] : [0.28, 0.68, 0.32]}
      />
      {!active && (
        <ThermalVolume color="#ff6a3d" opacity={isDay ? 0.14 : 0.08} position={[-0.45, 2.22, 0]} scale={[1.65, 1.2, 1.2]} />
      )}
    </group>
  );
}

function ThermalVolume({
  color,
  opacity,
  position,
  scale,
}: {
  color: string;
  opacity: number;
  position: [number, number, number];
  scale: [number, number, number];
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const targetPosition = useMemo(() => new THREE.Vector3(...position), [position]);
  const targetScale = useMemo(() => new THREE.Vector3(...scale), [scale]);

  useFrame(() => {
    if (mesh.current) {
      mesh.current.position.lerp(targetPosition, 0.05);
      mesh.current.scale.lerp(targetScale, 0.05);
    }
    if (material.current) {
      material.current.opacity = THREE.MathUtils.lerp(material.current.opacity, opacity, 0.055);
      material.current.color.lerp(new THREE.Color(color), 0.055);
    }
  });

  return (
    <mesh ref={mesh} position={position} scale={scale} renderOrder={12}>
      <sphereGeometry args={[1, 48, 24]} />
      <meshBasicMaterial
        ref={material}
        blending={THREE.AdditiveBlending}
        color={color}
        depthWrite={false}
        opacity={opacity}
        transparent
      />
    </mesh>
  );
}

function ExplodedGroup({
  children,
  enabled,
  offset,
}: {
  children: ReactNode;
  enabled: boolean;
  offset: [number, number, number];
}) {
  const group = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(...offset), [offset]);

  useFrame(() => {
    if (!group.current) return;
    group.current.position.lerp(enabled ? target : zeroVector, 0.055);
  });

  return <group ref={group}>{children}</group>;
}

function OccupantScaleReferences({
  active,
  environment,
}: {
  active: boolean;
  environment: AtriumEnvironmentMode;
}) {
  const isDay = environment === "day";
  const people: Array<[number, number, number, number]> = [
    [-0.78, 0.26, 0.48, 0.1],
    [-0.28, 0.26, -0.28, -0.16],
    [0.38, 0.26, 0.34, 0.24],
    [-1.05, 0.26, -0.72, -0.08],
    [0.86, 0.26, -0.42, 0.18],
  ];

  return (
    <group>
      <mesh position={[-0.32, 0.21, 0.76]} rotation={[0, 0.18, 0]}>
        <boxGeometry args={[1.12, 0.13, 0.18]} />
        <meshStandardMaterial color="#202b33" emissive={active ? cyan : "#1a1713"} emissiveIntensity={active ? 0.09 : 0.035} metalness={0.18} roughness={0.62} />
      </mesh>
      <mesh position={[0.74, 0.21, -0.82]} rotation={[0, -0.34, 0]}>
        <boxGeometry args={[0.9, 0.12, 0.18]} />
        <meshStandardMaterial color="#1b242c" emissive={active ? cyan : amber} emissiveIntensity={active ? 0.07 : 0.035} metalness={0.18} roughness={0.62} />
      </mesh>
      {people.map(([x, y, z, rotation], index) => (
        <HumanSilhouette
          active={active}
          environment={environment}
          key={`${x}-${z}`}
          phase={index * 0.58}
          position={[x, y, z]}
          rotation={rotation}
        />
      ))}
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2;
        return (
          <mesh key={index} position={[-0.45 + Math.cos(angle) * 1.34, 0.075, Math.sin(angle) * 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.028, 14]} />
            <meshBasicMaterial color={active ? cyan : amber} opacity={active ? (isDay ? 0.26 : 0.18) : 0.08} transparent />
          </mesh>
        );
      })}
    </group>
  );
}

function HumanSilhouette({
  active,
  environment,
  phase,
  position,
  rotation,
}: {
  active: boolean;
  environment: AtriumEnvironmentMode;
  phase: number;
  position: [number, number, number];
  rotation: number;
}) {
  const group = useRef<THREE.Group>(null);
  const isDay = environment === "day";

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.9 + phase) * 0.008;
  });

  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]} scale={0.88}>
      <mesh position={[0, 0.19, 0]} castShadow>
        <capsuleGeometry args={[0.045, 0.25, 8, 14]} />
        <meshStandardMaterial
          color="#0b1118"
          emissive={active ? cyan : amber}
          emissiveIntensity={active ? (isDay ? 0.08 : 0.05) : 0.035}
          metalness={0.08}
          opacity={0.88}
          roughness={0.68}
          transparent
        />
      </mesh>
      <mesh position={[0, 0.39, 0]} castShadow>
        <sphereGeometry args={[0.052, 16, 10]} />
        <meshStandardMaterial color="#101821" emissive={active ? cyan : amber} emissiveIntensity={0.045} opacity={0.86} roughness={0.68} transparent />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial color="#000000" opacity={0.24} transparent />
      </mesh>
    </group>
  );
}

function ArchitecturalZoneLabels({ explainMode, visible }: { explainMode: boolean; visible: boolean }) {
  if (!visible) {
    return null;
  }

  const coreLabels: Array<{ label: string; position: [number, number, number] }> = [
    { label: "Low-level intake", position: [-3.78, 0.78, 1.58] },
    { label: "Double wall cavity", position: [-3.82, 2.35, 1.32] },
    { label: "Double solar roof", position: [1.18, 5.1, 1.42] },
    { label: "High exhaust", position: [3.9, 4.74, 1.24] },
  ];
  const explainLabels: Array<{ label: string; position: [number, number, number] }> = [
    ...coreLabels,
    { label: "Comfort layer", position: [-0.7, 1.04, 1.42] },
    { label: "Solar chimney", position: [2.6, 2.92, 1.22] },
  ];
  const labels = explainMode ? explainLabels : coreLabels;

  return (
    <group>
      {labels.map((item) => (
        <Html center className="three-zone-label" distanceFactor={9} key={item.label} position={item.position}>
          <span>{item.label}</span>
        </Html>
      ))}
    </group>
  );
}

function AirflowSystem({
  active,
  environment,
  explainMode,
}: {
  active: boolean;
  environment: AtriumEnvironmentMode;
  explainMode: boolean;
}) {
  const isDay = environment === "day";
  const solarDrive = isDay ? 1 : 0.52;
  const exhaustOpacity = isDay ? 0.72 : 0.42;
  const stackSpeed = isDay ? 0.13 : 0.075;

  const breathePaths = useMemo(
    () => ({
      intake: makeCurve([
        [-4.35, 0.42, 1.28],
        [-3.05, 0.55, 1.35],
        [-1.5, 0.72, 1.2],
        [0.2, 0.88, 1.0],
        [1.34, 1.16, 0.82],
      ]),
      stack: makeCurve([
        [1.34, 1.16, 0.82],
        [1.82, 1.86, 0.76],
        [2.02, 2.82, 0.68],
        [2.08, 4.12, 0.62],
      ]),
      exhaust: makeCurve([
        [2.08, 4.12, 0.62],
        [2.72, 4.42, 0.72],
        [3.58, 4.52, 0.8],
        [4.6, 4.58, 0.86],
      ]),
    }),
    []
  );

  const trapPaths = useMemo(
    () => ({
      weak: makeCurve([
        [-4.2, 0.38, -1.25],
        [-3.32, 0.42, -1.12],
        [-2.5, 0.4, -1.06],
      ]),
      heatOne: makeCurve([
        [-0.8, 3.54, -0.2],
        [-0.66, 3.0, -0.1],
        [-0.72, 2.3, 0.0],
        [-1.02, 1.72, 0.1],
      ]),
      heatTwo: makeCurve([
        [0.84, 3.62, 0.2],
        [0.98, 3.08, 0.28],
        [1.08, 2.42, 0.35],
        [0.88, 1.78, 0.4],
      ]),
    }),
    []
  );

  if (!active) {
    return (
      <group>
        <ExplodedGroup enabled={explainMode} offset={[-0.42, 0, -0.08]}>
          <FlowTube color={cyan} curve={trapPaths.weak} opacity={isDay ? 0.22 : 0.16} radius={0.055} />
          <MovingMarkers color={cyan} count={3} curve={trapPaths.weak} scale={0.72} speed={isDay ? 0.04 : 0.025} />
        </ExplodedGroup>
        <FlowTube color={amber} curve={trapPaths.heatOne} opacity={isDay ? 0.52 : 0.34} radius={0.07} />
        <FlowTube color={amber} curve={trapPaths.heatTwo} opacity={isDay ? 0.48 : 0.3} radius={0.07} />
        <MovingMarkers color={amber} count={4} curve={trapPaths.heatOne} scale={1.08} speed={isDay ? 0.08 : 0.045} />
        <MovingMarkers color="#ff8a3d" count={4} curve={trapPaths.heatTwo} scale={1.08} speed={isDay ? 0.07 : 0.04} />
        <ArrowOnCurve color={amberSoft} curve={trapPaths.heatOne} scale={1.32} t={0.72} />
        <ArrowOnCurve color="#ff8a3d" curve={trapPaths.heatTwo} scale={1.32} t={0.72} />
        <CurveLine color={amberSoft} curve={trapPaths.heatOne} opacity={isDay ? 0.42 : 0.28} />
        <CurveLine color={amberSoft} curve={trapPaths.heatTwo} opacity={isDay ? 0.36 : 0.22} />
      </group>
    );
  }

  return (
    <group>
      <ExplodedGroup enabled={explainMode} offset={[-0.38, 0, -0.06]}>
        <FlowTube color={cyan} curve={breathePaths.intake} opacity={isDay ? 0.72 : 0.52} radius={0.105} />
        <CurveLine color={cyanSoft} curve={breathePaths.intake} opacity={isDay ? 0.78 : 0.56} />
        <MovingMarkers color={cyanSoft} count={8} curve={breathePaths.intake} scale={1.18} speed={0.12 + solarDrive * 0.03} />
        <ArrowOnCurve color={cyanSoft} curve={breathePaths.intake} scale={1.35} t={0.28} />
        <ArrowOnCurve color={cyanSoft} curve={breathePaths.intake} scale={1.35} t={0.66} />
      </ExplodedGroup>
      <ExplodedGroup enabled={explainMode} offset={[0.42, 0.18, 0.04]}>
        <FlowTube color={isDay ? amber : cyan} curve={breathePaths.stack} opacity={isDay ? 0.68 : 0.42} radius={0.096} />
        <CurveLine color={isDay ? amberSoft : cyanSoft} curve={breathePaths.stack} opacity={isDay ? 0.76 : 0.5} />
        <MovingMarkers color={isDay ? amberSoft : cyanSoft} count={6} curve={breathePaths.stack} scale={1.12} speed={stackSpeed} />
        <ArrowOnCurve color={isDay ? amberSoft : cyanSoft} curve={breathePaths.stack} scale={1.42} t={0.58} />
      </ExplodedGroup>
      <ExplodedGroup enabled={explainMode} offset={[0.72, 0.28, 0.12]}>
        <FlowTube color={isDay ? amber : cyan} curve={breathePaths.exhaust} opacity={exhaustOpacity} radius={0.096} />
        <CurveLine color={isDay ? amberSoft : cyanSoft} curve={breathePaths.exhaust} opacity={isDay ? 0.8 : 0.52} />
        <MovingMarkers color={isDay ? amberSoft : cyanSoft} count={5} curve={breathePaths.exhaust} scale={1.12} speed={isDay ? 0.16 : 0.08} />
        <ArrowOnCurve color={isDay ? amberSoft : cyanSoft} curve={breathePaths.exhaust} scale={1.42} t={0.68} />
      </ExplodedGroup>
    </group>
  );
}

function FlowTube({ color, curve, opacity, radius }: { color: string; curve: THREE.CatmullRomCurve3; opacity: number; radius: number }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 96, radius, 14, false), [curve, radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} renderOrder={20}>
      <meshStandardMaterial
        color={color}
        depthTest={false}
        depthWrite={false}
        emissive={color}
        emissiveIntensity={1.55}
        opacity={opacity}
        roughness={0.2}
        toneMapped={false}
        transparent
      />
    </mesh>
  );
}

function CurveLine({ color, curve, opacity }: { color: string; curve: THREE.CatmullRomCurve3; opacity: number }) {
  const points = useMemo(() => curve.getPoints(72), [curve]);
  return <Line color={color} lineWidth={1.4} opacity={opacity} points={points} transparent />;
}

function MovingMarkers({
  color,
  count,
  curve,
  scale = 1,
  speed,
}: {
  color: string;
  count: number;
  curve: THREE.CatmullRomCurve3;
  scale?: number;
  speed: number;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <MovingMarker color={color} curve={curve} key={index} offset={index / count} scale={scale} speed={speed} />
      ))}
    </group>
  );
}

function MovingMarker({
  color,
  curve,
  offset,
  scale,
  speed,
}: {
  color: string;
  curve: THREE.CatmullRomCurve3;
  offset: number;
  scale: number;
  speed: number;
}) {
  const group = useRef<THREE.Group>(null);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame(({ clock }) => {
    if (!group.current) return;

    const t = (clock.elapsedTime * speed + offset) % 1;
    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    group.current.position.copy(position);
    group.current.quaternion.setFromUnitVectors(up, tangent);
  });

  return (
    <group ref={group} renderOrder={30}>
      <mesh position={[0, 0.12 * scale, 0]}>
        <coneGeometry args={[0.09 * scale, 0.28 * scale, 20]} />
        <meshStandardMaterial color={color} depthTest={false} depthWrite={false} emissive={color} emissiveIntensity={1.9} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.08 * scale, 0]}>
        <sphereGeometry args={[0.055 * scale, 18, 12]} />
        <meshStandardMaterial color={color} depthTest={false} depthWrite={false} emissive={color} emissiveIntensity={1.45} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ArrowOnCurve({
  color,
  curve,
  scale,
  t,
}: {
  color: string;
  curve: THREE.CatmullRomCurve3;
  scale: number;
  t: number;
}) {
  const position = useMemo(() => curve.getPointAt(t), [curve, t]);
  const quaternion = useMemo(() => {
    const tangent = curve.getTangentAt(t).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
  }, [curve, t]);

  return (
    <group position={position} quaternion={quaternion} renderOrder={32}>
      <mesh position={[0, 0.14 * scale, 0]}>
        <coneGeometry args={[0.13 * scale, 0.42 * scale, 24]} />
        <meshStandardMaterial color={color} depthTest={false} depthWrite={false} emissive={color} emissiveIntensity={2.1} toneMapped={false} />
      </mesh>
    </group>
  );
}

function makeCurve(points: Array<[number, number, number]>) {
  return new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
}

function hasWebGLSupport() {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}
