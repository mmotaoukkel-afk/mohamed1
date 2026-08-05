import React, { Suspense, useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import type {} from '@react-three/fiber';
import OrbFallback, { AvatarStatus } from './OrbFallback';

// ─── Component Props ──────────────────────────────────────────────────────────
export interface Assistant3DProps {
  size?: number;
  status: AvatarStatus;
}

// ─── Color Map based on Status ────────────────────────────────────────────────
const STATUS_COLORS: Record<AvatarStatus, string> = {
  idle: '#D4AF76',       // Gold
  listening: '#3b82f6',  // Blue
  processing: '#8b5cf6', // Purple
  thinking: '#8b5cf6',   // Purple
  executing: '#FF8C00',  // Orange/Amber
  speaking: '#10b981',   // Emerald Green
  error: '#ef4444',      // Red
  success: '#22c55e',    // Emerald Green/Success
};

// Let's resolve the dependencies dynamically to avoid crash on platforms without ExpoGL native support
let Canvas: any = null;
let useFrame: any = null;
let useGLTF: any = null;
export let hasThreeFiber = false;

try {
  const fiberNative = require('@react-three/fiber/native');
  Canvas = fiberNative.Canvas;
  useFrame = fiberNative.useFrame;

  const dreiNative = require('@react-three/drei/native');
  useGLTF = dreiNative.useGLTF;

  hasThreeFiber = true;
} catch (e) {
  console.warn('[Assistant3D] Three.js or ExpoGL native modules not available. Using 2D fallback.', e);
}

// ─── 3D Model Inner Renderer ──────────────────────────────────────────────────
let AssistantModel: React.FC<{ status: AvatarStatus }> = () => null;

if (hasThreeFiber) {
  AssistantModel = ({ status }) => {
    // Load the model using Drei's useGLTF
    // In React Native/Expo, require() is the standard way to load local assets
    const { scene } = useGLTF(require('../../../assets/Meshy_AI_Cosmic_Smile_0620202837_texture.glb')) as any;
    const modelRef = useRef<any>(null);

    // Keep track of the current status in a ref for the useFrame loop (avoids stale closures)
    const statusRef = useRef<AvatarStatus>(status);
    useEffect(() => {
      statusRef.current = status;
    }, [status]);

    // Target scale and animation parameters
    const targetScale = useRef<number>(1.0);
    const currentScale = useRef<number>(1.0);

    // useFrame executes on every frame (60 FPS rendering loop)
    useFrame((state: any) => {
      if (!modelRef.current) return;

      const time = state.clock.getElapsedTime();
      const activeStatus = statusRef.current;

      let roll = 0;   // Z rotation (tilt left/right)
      let pitch = 0;  // X rotation (tilt forward/backward)
      let yaw = 0;    // Y rotation (turn left/right)
      let translateY = 0; // Y translation (floating)
      let baseScale = 1.0;
      let pulseSpeed = 1.5;
      let pulseAmount = 0.02;

      switch (activeStatus) {
        case 'listening':
          // Attentive forward tilt, active rolling, faster bobbing
          pitch = 0.15;
          roll = Math.sin(time * 3.0) * 0.05;
          translateY = Math.sin(time * 3.0) * 0.06;
          baseScale = 1.15;
          pulseSpeed = 6.0;
          pulseAmount = 0.03;
          break;

        case 'processing':
        case 'thinking':
          // Pondering rotating yaw, gentle float bobbing
          yaw = Math.sin(time * 4.0) * 0.1;
          translateY = Math.sin(time * 5.0) * 0.04;
          baseScale = 1.0;
          pulseSpeed = 4.0;
          pulseAmount = 0.02;
          break;

        case 'executing':
          // Active spin/yaw rotation, rapid bobbing
          yaw = Math.sin(time * 5.0) * 0.15;
          translateY = Math.sin(time * 6.0) * 0.05;
          baseScale = 1.05;
          pulseSpeed = 8.0;
          pulseAmount = 0.04;
          break;

        case 'speaking':
          // Speaking: energetic left-right tilt (welcoming roll), rapid vertical bobbing
          roll = Math.sin(time * 8.0) * 0.12;
          pitch = Math.sin(time * 4.0) * 0.04;
          translateY = Math.sin(time * 6.0) * 0.08;
          baseScale = 1.1;
          pulseSpeed = 3.5;
          pulseAmount = 0.04;
          break;

        case 'success':
          // Happy jump bounce
          translateY = Math.max(0, Math.sin(time * 8.0)) * 0.15;
          roll = Math.sin(time * 6.0) * 0.05;
          baseScale = 1.12;
          pulseSpeed = 2.0;
          pulseAmount = 0.01;
          break;

        case 'error':
          // Confused head shake (left-to-right yaw)
          yaw = Math.sin(time * 12.0) * 0.25;
          translateY = Math.sin(time * 1.5) * 0.02;
          baseScale = 0.9;
          pulseSpeed = 1.0;
          pulseAmount = 0.01;
          break;

        case 'idle':
        default:
          // Gentle hover float, breathing scale pulse
          translateY = Math.sin(time * 1.5) * 0.03;
          roll = Math.sin(time * 0.8) * 0.02;
          baseScale = 1.0;
          pulseSpeed = 1.5;
          pulseAmount = 0.02;
          break;
      }

      // Apply translation and rotations to the group container
      modelRef.current.position.y = translateY;
      modelRef.current.rotation.x = pitch;
      modelRef.current.rotation.y = yaw;
      modelRef.current.rotation.z = roll;

      // Smoothly interpolate scale for organic feel
      targetScale.current = baseScale;
      currentScale.current += (targetScale.current - currentScale.current) * 0.1;

      // Apply breathing/pulsing scale offset
      const scalePulse = currentScale.current + Math.sin(time * pulseSpeed) * pulseAmount;
      modelRef.current.scale.set(scalePulse, scalePulse, scalePulse);
    });

    return (
      // @ts-ignore
      <group ref={modelRef} dispose={null}>
        {/* Primitive wraps the preloaded Three scene */}
        {/* @ts-ignore */}
        <primitive object={scene} />
      </group>
    );
  };
}

// ─── Dynamic Lights ───────────────────────────────────────────────────────────
let AssistantLights: React.FC<{ status: AvatarStatus }> = () => null;

if (hasThreeFiber) {
  AssistantLights = ({ status }) => {
    const lightRef = useRef<any>(null);
    const color = STATUS_COLORS[status] || STATUS_COLORS.idle;

    // useFrame to smoothly pulse light intensity
    useFrame((state: any) => {
      if (!lightRef.current) return;
      const time = state.clock.getElapsedTime();
      let baseIntensity = 1.5;

      if (status === 'listening') {
        baseIntensity = 2.5 + Math.sin(time * 10.0) * 0.5;
      } else if (status === 'speaking') {
        baseIntensity = 2.0 + Math.sin(time * 8.0) * 0.4;
      } else if (status === 'executing' || status === 'thinking') {
        baseIntensity = 1.8 + Math.sin(time * 5.0) * 0.3;
      }

      lightRef.current.intensity = baseIntensity;
    });

    return (
      <>
        {/* @ts-ignore */}
        <ambientLight intensity={1.0} />
        {/* @ts-ignore */}
        <directionalLight position={[5, 10, 7]} intensity={1.5} />
        {/* @ts-ignore */}
        <directionalLight position={[-5, 2, -5]} intensity={0.5} />
        {/* @ts-ignore */}
        <pointLight ref={lightRef} position={[0, -2, 2]} color={color} distance={10} />
      </>
    );
  };
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class CanvasErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('[Assistant3D Canvas Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const Assistant3D: React.FC<Assistant3DProps> = ({
  size = 180,
  status = 'idle',
}) => {
  const [modelLoadingError, setModelLoadingError] = useState(false);

  if (!hasThreeFiber || modelLoadingError) {
    // Graceful fallback to 2D voice orb
    return <OrbFallback size={size * 0.5} status={status} />;
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <CanvasErrorBoundary fallback={<OrbFallback size={size * 0.5} status={status} />}>
        {/* @ts-ignore */}
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          style={styles.canvas}
          onCreated={(state: any) => {
            // Configure renderer for optimal mobile performance
            const gl = state.gl;
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Suspense fallback={null}>
            <AssistantLights status={status} />
            <AssistantModel status={status} />
          </Suspense>
        </Canvas>

        {/* Loading Spinner Overlaid while canvas/model is loading */}
        <Suspense
          fallback={
            <View style={StyleSheet.absoluteFillObject}>
              <ActivityIndicator color={STATUS_COLORS[status]} size="large" />
            </View>
          }
        >
          {null}
        </Suspense>
      </CanvasErrorBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

export default Assistant3D;
