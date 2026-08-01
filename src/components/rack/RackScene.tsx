import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  IN_RACK_PARTS,
  REAR_PARTS,
  type RackPart,
} from "@/data/rack";

const U_HEIGHT = 0.05;
const RACK_W = 0.78;
const RACK_D = 1.05;
const RACK_INNER_H = 48 * U_HEIGHT;

export type ViewMode = "front" | "rear";

type RackSceneProps = {
  selectedId: string | null;
  highlightKind: string | null;
  explode: boolean;
  autoRotate: boolean;
  viewMode: ViewMode;
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
    cartridge: 0.1,
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
    cartridge: 0,
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
              : ""}
            {part.matesTo && part.kind === "compute" ? ` · ${part.matesTo}` : ""}
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

/** Four rear NVLink cable cartridges — nodes blind-mate into these. */
function RearCableCartridges({
  selectedId,
  highlightKind,
  explode,
  onSelect,
}: {
  selectedId: string | null;
  highlightKind: string | null;
  explode: boolean;
  onSelect: (id: string) => void;
}) {
  const cartridges = useMemo(() => REAR_PARTS.filter((p) => p.kind === "cartridge"), []);
  const zBase = explode ? -RACK_D / 2 - 0.55 : -RACK_D / 2 - 0.12;
  // Height covers CT+NVS region roughly mid rack
  const cartH = RACK_INNER_H * 0.62;
  const cartW = RACK_W * 0.2;
  const cartD = 0.14;

  return (
    <group position={[0, 0.05, zBase]}>
      {/* Rear cage rail */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[RACK_W * 0.95, cartH + 0.12, 0.04]} />
        <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.45} />
      </mesh>

      {cartridges.map((part, i) => {
        const selected = selectedId === part.id;
        const dimmed =
          (highlightKind !== null && part.kind !== highlightKind) ||
          (selectedId !== null && !selected && highlightKind === null);
        const x = -RACK_W * 0.36 + i * (RACK_W * 0.24);
        return (
          <CartridgeMesh
            key={part.id}
            part={part}
            position={[x, 0, explode ? -0.08 * i : 0]}
            size={[cartW, cartH, cartD]}
            selected={selected}
            dimmed={dimmed}
            onSelect={onSelect}
          />
        );
      })}
    </group>
  );
}

function CartridgeMesh({
  part,
  position,
  size,
  selected,
  dimmed,
  onSelect,
}: {
  part: RackPart;
  position: [number, number, number];
  size: [number, number, number];
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const [w, h, d] = size;

  useFrame(() => {
    if (!matRef.current) return;
    const target = selected || hovered ? 0.95 : dimmed ? 0.05 : 0.4;
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      matRef.current.emissiveIntensity,
      target,
      0.15,
    );
  });

  return (
    <group position={position}>
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
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          ref={matRef}
          color="#9f1239"
          metalness={0.35}
          roughness={0.4}
          emissive="#e11d48"
          emissiveIntensity={0.4}
          transparent={dimmed}
          opacity={dimmed ? 0.14 : 1}
        />
      </mesh>

      {/* Pin field face (toward nodes / +Z into rack) */}
      {!dimmed && (
        <group position={[0, 0, d / 2 + 0.008]}>
          <mesh>
            <boxGeometry args={[w * 0.85, h * 0.92, 0.012]} />
            <meshStandardMaterial color="#0c0a09" metalness={0.4} roughness={0.55} />
          </mesh>
          {/* Pin grid suggestion */}
          {Array.from({ length: 8 }).map((_, row) =>
            Array.from({ length: 3 }).map((_, col) => (
              <mesh
                key={`${row}-${col}`}
                position={[
                  -w * 0.28 + col * w * 0.28,
                  -h * 0.38 + row * (h * 0.11),
                  0.01,
                ]}
              >
                <boxGeometry args={[0.018, 0.018, 0.01]} />
                <meshStandardMaterial
                  color={selected || hovered ? "#fda4af" : "#78716c"}
                  emissive={selected || hovered ? "#e11d48" : "#44403c"}
                  emissiveIntensity={selected ? 0.8 : 0.2}
                />
              </mesh>
            )),
          )}
        </group>
      )}

      {/* Latch handle */}
      {!dimmed && (
        <mesh position={[0, h / 2 - 0.04, -d / 2 - 0.02]}>
          <boxGeometry args={[w * 0.5, 0.03, 0.04]} />
          <meshStandardMaterial color="#e7e5e4" metalness={0.6} roughness={0.3} />
        </mesh>
      )}

      {(selected || hovered) && (
        <Html
          position={[0, h / 2 + 0.1, 0]}
          center
          style={{ pointerEvents: "none" }}
          distanceFactor={5}
        >
          <div className="max-w-[160px] rounded-md border border-border bg-surface/95 px-2 py-1 font-mono text-[10px] text-fg shadow-lg">
            <div className="font-semibold">{part.shortLabel}</div>
            <div className="text-muted">{part.matesTo}</div>
            <div className="text-danger/90">Bent pins · BER risk</div>
          </div>
        </Html>
      )}
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
      />
    </mesh>
  );
}

function CameraRig({ viewMode }: { viewMode: ViewMode }) {
  const { camera } = useThree();
  useEffect(() => {
    if (viewMode === "rear") {
      camera.position.set(0.4, 0.35, -3.4);
    } else {
      camera.position.set(3.1, 0.55, 3.6);
    }
    camera.lookAt(0, 0, viewMode === "rear" ? -0.4 : 0);
  }, [viewMode, camera]);
  return null;
}

function SceneContent({
  selectedId,
  highlightKind,
  explode,
  autoRotate,
  viewMode,
  onSelect,
}: RackSceneProps) {
  const parts = useMemo(() => IN_RACK_PARTS, []);
  const target = viewMode === "rear" ? ([0, 0, -0.4] as const) : ([0, 0, 0] as const);

  return (
    <>
      <color attach="background" args={["#0b0f14"]} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#dbeafe", "#0b0f14", 0.45]} />
      <directionalLight position={[4, 6, 5]} intensity={1.9} />
      <directionalLight position={[-3, 3, -4]} intensity={1.1} color="#fecdd3" />
      <pointLight position={[2, 1, 3]} intensity={1.0} color="#60a5fa" />
      <pointLight position={[-1.4, 0, 1]} intensity={0.55} color="#2dd4bf" />
      <pointLight position={[0, 0.5, -2.2]} intensity={0.9} color="#fb7185" />

      <CameraRig viewMode={viewMode} />

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
        <RearCableCartridges
          selectedId={selectedId}
          highlightKind={highlightKind}
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
        autoRotate={autoRotate && viewMode === "front"}
        autoRotateSpeed={0.5}
        minDistance={1.8}
        maxDistance={14}
        target={[...target]}
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
        {props.viewMode === "rear"
          ? "Rear view · CC0–CC3 cable cartridges · bent pins / BER"
          : "Front view · orbit · click trays · Rear for CC0–3"}
      </div>
    </div>
  );
}
