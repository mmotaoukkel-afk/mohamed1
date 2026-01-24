/**
 * 3D Product Viewer Component - Kataraa
 * Using Three.js + expo-gl for stunning 3D product display
 */

import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ActivityIndicator } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, TextureLoader } from 'expo-three';
import * as THREE from 'three';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ProductViewer3D({
    imageUrl,
    onClose,
    productName = "المنتج"
}) {
    const [loading, setLoading] = useState(true);
    const [rotation, setRotation] = useState(0);
    const [autoRotate, setAutoRotate] = useState(true);
    const animationRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const meshRef = useRef(null);
    const glRef = useRef(null);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const onContextCreate = async (gl) => {
        glRef.current = gl;

        // Create renderer
        const renderer = new Renderer({ gl });
        renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;

        // Create scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Create camera
        const camera = new THREE.PerspectiveCamera(
            75,
            gl.drawingBufferWidth / gl.drawingBufferHeight,
            0.1,
            1000
        );
        camera.position.z = 3;
        cameraRef.current = camera;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xFF7EB3, 0.5);
        pointLight.position.set(-5, -5, 5);
        scene.add(pointLight);

        // Create product geometry (cylinder for product bottle/jar)
        const geometry = new THREE.CylinderGeometry(1, 1, 2.5, 32);

        // Load texture from product image
        let material;
        try {
            const textureLoader = new TextureLoader();
            const texture = await textureLoader.loadAsync(imageUrl);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);

            material = new THREE.MeshStandardMaterial({
                map: texture,
                metalness: 0.3,
                roughness: 0.5,
            });
        } catch (error) {
            // Fallback to gradient material
            material = new THREE.MeshStandardMaterial({
                color: 0xFF7EB3,
                metalness: 0.4,
                roughness: 0.3,
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        meshRef.current = mesh;

        // Add base/cap
        const capGeometry = new THREE.CylinderGeometry(0.8, 1, 0.3, 32);
        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0xC4B5FD,
            metalness: 0.5,
            roughness: 0.2,
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 1.4;
        mesh.add(cap);

        setLoading(false);

        // Animation loop
        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);

            if (meshRef.current && autoRotate) {
                meshRef.current.rotation.y += 0.01;
            }

            renderer.render(scene, camera);
            gl.endFrameEXP();
        };

        animate();
    };

    const handleRotateLeft = () => {
        if (meshRef.current) {
            meshRef.current.rotation.y -= 0.5;
        }
    };

    const handleRotateRight = () => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.5;
        }
    };

    const handleZoomIn = () => {
        if (cameraRef.current) {
            cameraRef.current.position.z = Math.max(1.5, cameraRef.current.position.z - 0.5);
        }
    };

    const handleZoomOut = () => {
        if (cameraRef.current) {
            cameraRef.current.position.z = Math.min(5, cameraRef.current.position.z + 0.5);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'transparent']}
                style={styles.header}
            >
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>عرض 3D</Text>
                <View style={{ width: 44 }} />
            </LinearGradient>

            {/* 3D View */}
            <GLView
                style={styles.glView}
                onContextCreate={onContextCreate}
            />

            {/* Loading */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FF7EB3" />
                    <Text style={styles.loadingText}>جاري تحميل العرض 3D...</Text>
                </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
                <View style={styles.controlRow}>
                    <TouchableOpacity style={styles.controlBtn} onPress={handleRotateLeft}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlBtn, styles.autoRotateBtn, autoRotate && styles.autoRotateActive]}
                        onPress={() => setAutoRotate(!autoRotate)}
                    >
                        <Ionicons name={autoRotate ? "pause" : "play"} size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlBtn} onPress={handleRotateRight}>
                        <Ionicons name="arrow-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.controlRow}>
                    <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut}>
                        <Ionicons name="remove" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.zoomText}>تكبير/تصغير</Text>

                    <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Product Name */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.footer}
            >
                <Text style={styles.productName}>{productName}</Text>
                <Text style={styles.hint}>استخدم الأزرار للتحكم بالعرض</Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    glView: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(26,26,46,0.9)',
    },
    loadingText: {
        marginTop: 15,
        color: '#fff',
        fontSize: 16,
    },
    controls: {
        position: 'absolute',
        right: 20,
        top: '50%',
        transform: [{ translateY: -80 }],
        gap: 15,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 25,
        padding: 5,
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    autoRotateBtn: {
        backgroundColor: 'rgba(255,126,179,0.3)',
    },
    autoRotateActive: {
        backgroundColor: '#FF7EB3',
    },
    zoomText: {
        color: '#fff',
        fontSize: 12,
        paddingHorizontal: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 40,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    productName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    hint: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
});
