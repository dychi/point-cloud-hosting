import { Canvas, ThreeElements, ThreeEvent } from '@react-three/fiber'
import ClickableBox from '../../components/ClickableBox'
import { useState } from 'react'
export default function ClickBox() {
  const [clicked, setClicked] = useState(false)
  // モーダル
  var modal
  if (clicked) {
    modal = (
      <div>
        <h2>Modal: title</h2>
      </div>
    )
  }
  const onClickFunc = (event: ThreeEvent<MouseEvent>) => {
    console.log('clicked')
    setClicked(!clicked)
  }
  return (
    <>
      <Canvas>
        <pointLight position={[10, 10, 10]} />
        <ClickableBox position={[-1.2, 0, 0]} onClick={onClickFunc} />
      </Canvas>
      {modal}
    </>
  )
}
