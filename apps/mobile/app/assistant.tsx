/* eslint-disable react/no-unknown-property */
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import Feather from '@expo/vector-icons/Feather';
import Svg, { Path } from 'react-native-svg';

// Theme colors
const COLORS = {
  bg: '#0D1411',
  card: '#1C1C1E',
  accent: '#B8F25B',
  accentLight: '#D4FF88',
  accentGlow: '#8BC34A',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
};

// Flowing energy ribbon around the sphere
function EnergyRibbon({
  offset = 0,
  speed = 1,
  radius = 1,
  opacity = 0.6,
  width = 0.02,
}: {
  offset?: number;
  speed?: number;
  radius?: number;
  opacity?: number;
  width?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 100;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 + offset;

      // Create flowing S-curve path
      const x = Math.sin(angle) * radius * (1 + Math.sin(t * Math.PI * 3) * 0.2);
      const y = Math.cos(angle * 1.5) * radius * 0.6;
      const z = Math.cos(angle) * radius * (1 + Math.cos(t * Math.PI * 2) * 0.15);

      points.push(new THREE.Vector3(x, y, z));
    }

    return new THREE.CatmullRomCurve3(points, true);
  }, [offset, radius]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15 * speed;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[curve, 100, width, 8, true]} />
      <meshStandardMaterial
        color={COLORS.accent}
        emissive={COLORS.accent}
        emissiveIntensity={0.8}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// Inner swirling wisps
function InnerWisps() {
  const groupRef = useRef<THREE.Group>(null);

  const wisps = useMemo(() => {
    const result: THREE.CatmullRomCurve3[] = [];

    for (let w = 0; w < 4; w++) {
      const points: THREE.Vector3[] = [];
      const baseAngle = (w / 4) * Math.PI * 2;

      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const angle = baseAngle + t * Math.PI * 1.5;
        const r = 0.5 + t * 0.3;

        const x = Math.sin(angle) * r * (1 - t * 0.3);
        const y = (t - 0.5) * 1.2 + Math.sin(t * Math.PI * 2) * 0.2;
        const z = Math.cos(angle) * r * (1 - t * 0.3);

        points.push(new THREE.Vector3(x, y, z));
      }

      result.push(new THREE.CatmullRomCurve3(points));
    }

    return result;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {wisps.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 50, 0.008, 6, false]} />
          <meshStandardMaterial
            color={COLORS.accentLight}
            emissive={COLORS.accentLight}
            emissiveIntensity={0.6}
            transparent
            opacity={0.4 - i * 0.05}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main dark sphere with subtle glow
function DarkSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Dark core with metallic sheen */}
      <mesh>
        <sphereGeometry args={[0.85, 64, 64]} />
        <meshStandardMaterial
          color="#0a1a12"
          roughness={0.4}
          metalness={0.6}
          envMapIntensity={1}
        />
      </mesh>

      {/* Inner glow layer */}
      <mesh scale={0.88}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.accentGlow}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Outer glow halo */}
      <mesh scale={0.92}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.accent}
          transparent
          opacity={0.08}
        />
      </mesh>
    </group>
  );
}

// Outer glow effect
function OuterGlow() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1.1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color={COLORS.accent}
        transparent
        opacity={0.12}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// Main AI Orb component
function AIOrb() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;
    }
  });

  return (
    <group ref={groupRef} scale={1.2}>
      <OuterGlow />
      <DarkSphere />
      <InnerWisps />

      {/* Main flowing ribbons - increased opacity for better visibility */}
      <EnergyRibbon offset={0} speed={1} radius={0.95} opacity={0.85} width={0.025} />
      <EnergyRibbon offset={Math.PI * 0.5} speed={-0.8} radius={1} opacity={0.7} width={0.018} />
      <EnergyRibbon offset={Math.PI} speed={0.6} radius={1.05} opacity={0.55} width={0.012} />
      <EnergyRibbon offset={Math.PI * 1.5} speed={-0.5} radius={0.9} opacity={0.4} width={0.008} />
    </group>
  );
}

// Scene lighting
function Lighting() {
  return (
    <>
      {/* Base ambient for visibility */}
      <ambientLight intensity={0.4} />

      {/* Main accent lights */}
      <pointLight position={[2, 2, 2]} intensity={1.5} color={COLORS.accent} />
      <pointLight position={[-2, 1, 2]} intensity={1.2} color={COLORS.accentLight} />
      <pointLight position={[0, -2, 2]} intensity={0.8} color={COLORS.accentGlow} />

      {/* Back rim light for depth */}
      <pointLight position={[0, 0, -3]} intensity={0.6} color="#ffffff" />

      {/* Top spotlight effect */}
      <spotLight
        position={[0, 4, 2]}
        angle={0.5}
        penumbra={0.8}
        intensity={1.0}
        color={COLORS.accent}
      />
    </>
  );
}

// Voice icon component
function VoiceIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12V10M8 12V8M12 12V4M16 12V8M20 12V10"
        stroke={COLORS.accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 12V14M8 12V16M12 12V20M16 12V16M20 12V14"
        stroke={COLORS.accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export default function AssistantScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="x" size={24} color={COLORS.text} />
        </Pressable>

        {/* 3D Canvas */}
        <View style={styles.canvasContainer}>
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              camera={{ position: [0, 0, 4], fov: 45 }}
              style={styles.canvas}
            >
              <color attach="background" args={[COLORS.bg]} />
              <Lighting />
              <AIOrb />
            </Canvas>
          </Suspense>
        </View>

        {/* Text overlay */}
        <View style={styles.textOverlay}>
          <Text style={styles.greeting}>Hello Robin</Text>
          <Text style={styles.title}>How can I help</Text>
          <Text style={styles.title}>you today?</Text>
        </View>

        {/* Input bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Ask anything..."
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
            />
            <Pressable style={styles.voiceButton}>
              <VoiceIcon />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  canvasContainer: {
    height: 350,
    marginTop: 80,
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  textOverlay: {
    alignItems: 'center',
    marginTop: 20,
  },
  greeting: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '400',
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 44,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184, 242, 91, 0.08)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 91, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: COLORS.text,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
