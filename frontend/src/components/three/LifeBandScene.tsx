import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function LifeBandRing() {
  const ringRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2.3 + Math.sin(t * 0.3) * 0.08
      ringRef.current.rotation.z = t * 0.15
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.12
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.5, 0.14, 32, 200]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#0891b2"
          emissiveIntensity={0.9}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.3, 0, 0.5]}>
        <torusGeometry args={[1.5, 0.03, 16, 200]} />
        <meshStandardMaterial color="#2f7dfa" emissive="#2f7dfa" emissiveIntensity={1.4} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

function OrbitingNodes({ count = 26 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const nodes = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const radius = 2.4 + Math.random() * 1.6
      const angle = (i / count) * Math.PI * 2
      const tilt = (Math.random() - 0.5) * 1.2
      const speed = 0.05 + Math.random() * 0.08
      const phase = Math.random() * Math.PI * 2
      const scale = 0.03 + Math.random() * 0.045
      const color = i % 5 === 0 ? '#fb4b4b' : i % 3 === 0 ? '#34d399' : '#22d3ee'
      return { radius, angle, tilt, speed, phase, scale, color }
    })
  }, [count])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const n = nodes[i]
      const a = n.angle + t * n.speed
      child.position.set(Math.cos(a) * n.radius, Math.sin(a) * n.radius * n.tilt, Math.sin(a * 1.3 + n.phase) * 0.6)
      const pulse = 1 + Math.sin(t * 2.4 + n.phase) * 0.35
      child.scale.setScalar(n.scale * pulse)
    })
  })

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={1.8} />
        </mesh>
      ))}
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 4, 4]} intensity={60} color="#22d3ee" />
      <pointLight position={[-4, -3, -3]} intensity={30} color="#2f7dfa" />
      <LifeBandRing />
      <OrbitingNodes />
    </>
  )
}

export function LifeBandScene() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 320 }}>
      <Canvas camera={{ position: [0, 0.6, 5.4], fov: 45 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
