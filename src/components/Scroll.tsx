import { NextPage } from 'next'
import { useRef } from 'react'

const Scroll: NextPage = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  var scrollPercent = 0
  // -- 関数定義 --
  // 線型補間
  const lerp = (x: number, y: number, a: number) => {
    return (1 - a) * x + a * y
  }
  const scalePercent = (start: number, end: number) => {
    return (scrollPercent - start) / (end - start)
  }
  const calcScrollPercent = (
    top: number,
    height: number,
    clientHeight: number
  ) => {
    scrollPercent = (top / (height - clientHeight)) * 100
  }

  return <div ref={mountRef} />
}

export default Scroll
