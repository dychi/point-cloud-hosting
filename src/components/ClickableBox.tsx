import { NextPage } from 'next'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Mesh } from 'three'

const ClickableBox: NextPage<ThreeElements['mesh']> = (
  props: ThreeElements['mesh']
) => {
  const mesh = useRef<Mesh>(null!)
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  useFrame((state, delta) => (mesh.current.rotation.x += delta))

  return (
    <>
      <ambientLight />
      <mesh
        {...props}
        ref={mesh}
        scale={active ? 1.5 : 1}
        // onClick={(event) => setActive(!active)}
        onPointerOver={(event) => setHover(true)}
        onPointerOut={(event) => setHover(false)}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
      </mesh>
    </>
  )
}

export default ClickableBox
