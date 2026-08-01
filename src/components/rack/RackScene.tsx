import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { IN_RACK_PARTS, EXTERNAL_PARTS, type RackPart } from "@/data/rack";

const U_HEIGHT = 0.05;
const RACK_W = 0.78;
const RACK_D = 1.05;
const RACK_INNER_H = 48 * U_HEIGHT;

type RackSceneProps = {
  selectedId: string | null;
  highlightKind: string | null;
  explode: boolean;
  autoRotate: boolean;
  onSelect: (id: string | null) => void;
};

function partY(part: RackPart, explode: boolean) {
  const base = (part.uStart - 1) * U_HEIGHT + (part.uHeight * U_HEIGHT) / 2;
  const centered = base - RACK_INNER_H / 2;
  if (!explode) return centered;
  const kindBias: Record<string, number> = {
    power: part.zone === "power-top" ? 0.35 : -0.22,
    manifold: 0.06,
    compute: 0.12,
    switch: 0.28,
    management: 0.42,
    cdu: 0,
    frame: 0,
  };
  return centered + (kindBias[part.kind] ?? 0);
}

function partX(part: RackPart, explode: boolean) {
  if (!explode) return 0;
  const kindBias: Record<string, number> = {
    power: part.zone === "power-top" ? 0.48 : -0.48,
    manifold: 0.15,
    compute: 0.55,
    switch: -0.55,
    management: 0.35,
    cdu: -1.2,
    frame: 0,
  };
  return kindBias[part.kind] ?? 0;
}

function TrayMesh({
  part,
  selected,
  dimmed,
  explode,
  onSelect,
}: {
  part: RackPart;
  selected: boolean;
  dimmed: boolean;
  explode: boolean;
  onSelect: (id: string) => void;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const h = Math.max(part.uHeight * U_HEIGHT * 0.9, 0.035);
  const y = partY(part, explode);
  const x = partX(part, explode);

  useFrame(() => {
    if (!matRef.current) return;
    const target = selected || hovered ? 0.9 : dimmed ? 0.04 : 0.32;
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      matRef.current.emissiveIntensity,
      target,
      0.15,
    );
  });

  const depth =
    part.kind === "switch"
      ? RACK_D * 0.86
      : part.kind === "power"
        ? RACK_D * 0.8
        : RACK_D * 0.9;

  return (
    <group position={[x, y, 0]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(part.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[RACK_W * 0.86, h, depth]} />
        <meshStandardMaterial
          ref={matRef}
          color={part.color}
          metalness={0.28}
          roughness={0.42}
          emissive={part.color}
          emissiveIntensity={0.32}
          transparent={dimmed}
          opacity={dimmed ? 0.14 : 1}
        />
      </mesh>

      <mesh position={[0, 0, depth / 2 + 0.004]}>
        <boxGeometry args={[RACK_W * 0.8, h * 0.5, 0.008]} />
        <meshStandardMaterial
          color={selected || hovered ? "#f8fafc" : "#0b0d10"}
          metalness={0.2}
          roughness={0.6}
          transparent={dimmed}
          opacity={dimmed ? 0.1 : 1}
        />
      </mesh>

      {part.kind === "compute" && !dimmed && (
        <group position={[0, 0, depth / 2 + 0.014]}>
          {[-0.2, -0.07, 0.07, 0.2].map((ox, i) => (
            <mesh key={i} position={[ox, 0, 0]}>
              <boxGeometry args={[0.08, h * 0.38, 0.014]} />
              <meshStandardMaterial
                color="#0076ce"
                emissive="#0076ce"
                emissiveIntensity={selected ? 1.55 : 0.95}
              />
            </mesh>
          ))}
        </group>
      )}

      {part.kind === "switch" && !dimmed && (
        <group position={[0, 0, depth / 2 + 0.014]}>
          {[-0.09, 0.09].map((ox, i) => (
            <mesh key={i} position={[ox, 0, 0]}>
              <boxGeometry args={[0.12, h * 0.42, 0.014]} />
              <meshStandardMaterial
                color="#c7d2fe"
                emissive="#7c9cff"
                emissiveIntensity={selected ? 1.35 : 0.8}
              />
            </mesh>
          ))}
        </group>
      )}

      {part.kind === "power" && !dimmed && (
        <group position={[0, 0, depth / 2 + 0.014]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[-0.22 + i * 0.09, 0, 0]}>
              <boxGeometry args={[0.05, h * 0.48, 0.012]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#fbbf24" : "#92400e"}
                emissive="#f0a202"
                emissiveIntensity={0.6}
              />
            </mesh>
          ))}
        </group>
      )}

      {(selected || hovered) && (
        <Html
          position={[RACK_W * 0.62, 0, 0]}
          center
          style={{ pointerEvents: "none" }}
          distanceFactor={5}
        >
          <div className="whitespace-nowrap rounded-md border border-border bg-surface/95 px-2 py-1 font-mono text-[10px] text-fg shadow-lg backdrop-blur-sm">
            {part.shortLabel}
            {part.uStart > 0
              ? ` · U${part.uStart}${part.uHeight > 1 ? `–${part.uStart + part.uHeight - 1}` : ""}`
              : " · external"}
          </div>
        </Html>
      )}
    </group>
  );
}

function RackFrame() {
  const h = RACK_INNER_H + 0.1;
  const posts = [
    [-RACK_W / 2, 0, -RACK_D / 2],
    [RACK_W / 2, 0, -RACK_D / 2],
    [-RACK_W / 2, 0, RACK_D / 2],
    [RACK_W / 2, 0, RACK_D / 2],
  ] as const;

  return (
    <group>
      {posts.map((p, i) => (
        <mesh key={i} position={[p[0], 0, p[2]]}>
          <boxGeometry args={[0.04, h, 0.04]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.55} roughness={0.32} />
        </mesh>
      ))}
      {[h / 2 - 0.02, -h / 2 + 0.02].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[RACK_W + 0.06, 0.045, RACK_D + 0.06]} />
          <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.38} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(RACK_W / 2 + 0.01) * side, 0, 0]}>
          <boxGeometry args={[0.012, h * 0.96, RACK_D * 0.88]} />
          <meshStandardMaterial
            color="#374151"
            metalness={0.4}
            roughness={0.5}
            transparent
            opacity={0.35}
          />
        </mesh>
      ))}
      <mesh position={[0, h / 2 - 0.07, RACK_D / 2 + 0.03]}>
        <boxGeometry args={[0.38, 0.06, 0.02]} />
        <meshStandardMaterial color="#0076ce" emissive="#0076ce" emissiveIntensity={1.15} />
      </mesh>
    </group>
  );
}

/** External CDU sidecar + flexible hoses into the rack. */
function ExternalCdu({
  selected,
  dimmed,
  explode,
  onSelect,
}: {
  selected: boolean;
  dimmed: boolean;
  explode: boolean;
  onSelect: (id: string) => void;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const cdu = EXTERNAL_PARTS.find((p) => p.kind === "cdu");

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const pulse = 0.35 + Math.sin(clock.elapsedTime * 1.8) * 0.12;
    const target = selected || hovered ? 0.85 : dimmed ? 0.05 : pulse;
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      matRef.current.emissiveIntensity,
      target,
      0.12,
    );
  });

  if (!cdu) return null;

  const x = explode ? -1.55 : -1.15;
  const w = 0.55;
  const h = 1.15;
  const d = 0.7;

  return (
    <group position={[x, -0.15, 0.1]}>
      {/* CDU chassis */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(cdu.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0f766e"
          metalness={0.35}
          roughness={0.4}
          emissive="#14b8a6"
          emissiveIntensity={0.4}
          transparent={dimmed}
          opacity={dimmed ? 0.15 : 1}
        />
      </mesh>

      {/* Pump modules */}
      {!dimmed &&
        [-0.18, 0.18].map((oy, i) => (
          <mesh key={i} position={[0, oy, d / 2 + 0.02]}>
            <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
            <meshStandardMaterial
              color="#5eead4"
              emissive="#2dd4bf"
              emissiveIntensity={0.7}
              metalness={0.3}
              roughness={0.35}
            />
          </mesh>
        ))}

      {/* Supply / return hoses into rack */}
      {!dimmed &&
        [0.12, -0.12].map((oz, i) => (
          <mesh
            key={i}
            position={[(RACK_W / 2 + 0.12 + (explode ? 0.2 : 0)) / 2 + w / 2, 0.25 - i * 0.2, oz]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry
              args={[0.028, 0.028, RACK_W / 2 + 0.35 + (explode ? 0.35 : 0), 12]}
            />
            <meshStandardMaterial
              color={i === 0 ? "#67e8f9" : "#f97316"}
              emissive={i === 0 ? "#22d3ee" : "#ea580c"}
              emissiveIntensity={0.55}
            />
          </mesh>
        ))}

      {(selected || hovered) && (
        <Html position={[0, h / 2 + 0.12, 0]} center style={{ pointerEvents: "none" }} distanceFactor={6}>
          <div className="whitespace-nowrap rounded-md border border-border bg-surface/95 px-2 py-1 font-mono text-[10px] text-fg shadow-lg">
            External CDU · not in rack
          </div>
        </Html>
      )}

      {/* Floor plate label */}
      <mesh position={[0, -h / 2 - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshStandardMaterial color="#0d9488" metalness={0.2} roughness={0.8} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function InRackManifoldGlow({ explode }: { explode: boolean }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    matRef.current.emissiveIntensity = 0.45 + Math.sin(clock.elapsedTime * 2) * 0.15;
  });
  return (
    <mesh
      position={[explode ? 0.2 : -RACK_W / 2 - 0.08, 0, 0.12]}
      rotation={[0, 0, Math.PI / 2]}
    >
      <cylinderGeometry args={[0.018, 0.018, RACK_INNER_H * 0.75, 16]} />
      <meshStandardMaterial
        ref={matRef}
        color="#5eead4"
        emissive="#2ec4b6"
        emissiveIntensity={0.5}
        metalness={0.15}
        roughness={0.3}
      />
    </mesh>
  );
}

function SceneContent({
  selectedId,
  highlightKind,
  explode,
  autoRotate,
  onSelect,
}: RackSceneProps) {
  const parts = useMemo(() => IN_RACK_PARTS, []);

  return (
    <>
      <color attach="background" args={["#0b0f14"]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#dbeafe", "#0b0f14", 0.45]} />
      <directionalLight position={[4, 6, 5]} intensity={1.9} />
      <directionalLight position={[-4, 2, -2]} intensity={0.75} color="#93c5fd" />
      <pointLight position={[2, 1, 3]} intensity={1.0} color="#60a5fa" />
      <pointLight position={[-1.4, 0, 1]} intensity={0.55} color="#2dd4bf" />

      <group>
        <RackFrame />
        <InRackManifoldGlow explode={explode} />
        {parts.map((part) => {
          const selected = selectedId === part.id;
          const dimmed =
            (highlightKind !== null && part.kind !== highlightKind) ||
            (selectedId !== null && !selected && highlightKind === null);
          return (
            <TrayMesh
              key={part.id}
              part={part}
              selected={selected}
              dimmed={dimmed}
              explode={explode}
              onSelect={onSelect}
            />
          );
        })}
        <ExternalCdu
          selected={selectedId === "cdu-external"}
          dimmed={
            (highlightKind !== null && highlightKind !== "cdu") ||
            (selectedId !== null && selectedId !== "cdu-external" && highlightKind === null)
          }
          explode={explode}
          onSelect={onSelect}
        />
      </group>

      <mesh position={[0, -RACK_INNER_H / 2 - 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.8, 64]} />
        <meshStandardMaterial color="#121820" metalness={0.12} roughness={0.94} />
      </mesh>

      <OrbitControls
        makeDefault
        enablePan
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        minDistance={1.8}
        maxDistance={14}
        target={[-0.35, 0, 0]}
        maxPolarAngle={Math.PI * 0.88}
      />
    </>
  );
}

export function RackScene(props: RackSceneProps) {
  return (
    <div className="relative h-full min-h-[320px] w-full bg-bg">
      <Canvas
        camera={{ position: [3.1, 0.55, 3.6], fov: 40, near: 0.05, far: 100 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#0b0f14", 1);
        }}
        onPointerMissed={() => props.onSelect(null)}
      >
        <SceneContent {...props} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-surface/80 px-2.5 py-1.5 font-mono text-[10px] text-muted backdrop-blur-sm">
        Drag to orbit · Click CT / NVS / PS33 / external CDU
      </div>
    </div>
  );
}
