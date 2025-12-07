import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { View } from 'react-native';

function RotatingShape() {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;
        }
    });

    return (
        <mesh ref={meshRef} scale={1.8}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#667eea" wireframe emissive="#667eea" emissiveIntensity={0.5} />
        </mesh>
    );
}

export default function Hero3D() {
    return (
        <View style={{ height: 350, width: '100%' }}>
            <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <RotatingShape />
            </Canvas>
        </View>
    );
}
