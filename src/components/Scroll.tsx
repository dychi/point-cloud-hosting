import { NextPage } from 'next'
import { useRef, useState, useEffect } from 'react'

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

  // useState
  const [direction, setDirection] = useState('')
  const [progress, setProgress] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [lastProgress, setLastProgress] = useState(0)
  const [contentsHeight, setContentsHeight] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const colors = [
    '#E0F2F1',
    '#B2DFDB',
    '#80CBC4',
    '#4DB6AC',
    '#26A69A',
    '#009688',
    '#00897B',
    '#00796B',
    '#00695C',
    '#004D40',
    '#E0F2F1',
  ]

  // -- useEffect
  useEffect(() => {
    if (!direction) {
      init()
      return
    }
    warp()
  }, [direction])
  useEffect(() => {
    const diff = lastProgress - progress
    if (diff < 0) {
      if (Math.abs(diff) > 0.99) {
        setDirection('up')
      } else {
        setDirection('down')
      }
    } else {
      if (Math.abs(diff) > 0.99) {
        setDirection('down')
      } else {
        setDirection('up')
      }
    }
    // 無限スクロール
    // warp()
    setLastProgress(progress)
  }, [progress])
  useEffect(() => {
    window.scrollTo(
      window.scrollX,
      (contentsHeight - windowHeight) * scrollProgress
    )
  }, [scrollProgress])
  useEffect(() => {
    if (contentsHeight - windowHeight) {
      setProgress(scrollY / (contentsHeight - windowHeight))
    }
  }, [scrollY])

  // -- functions
  const init = () => {
    window.addEventListener('resize', handleResize, {
      passive: true,
    })
    document.addEventListener('scroll', handleScroll, {
      passive: true,
    })
    handleResize()
    setScrollProgress(normalize(0))
  }
  const warp = () => {
    if (1 <= progress && direction === 'down') {
      setScrollProgress(normalize(0))
    } else if (progress <= 0 && direction === 'up') {
      setScrollProgress(normalize(1))
    }
  }
  const handleResize = () => {
    setContentsHeight(document.getElementById('app')?.clientHeight as number)
    setWindowHeight(window.innerHeight)
  }
  const handleScroll = () => {
    setScrollY(window.scrollY)
  }
  const normalize = (val: number) => {
    return Math.max(0.0002, Math.min(val, 0.9999))
  }

  const handleClickBtn = (targetProgress: number) => {
    const startProgress = progress
    const isReverse = Math.abs(targetProgress - startProgress) > 0.5
    const diff = targetProgress - startProgress
    if (isReverse) {
      setScrollProgress(normalize(targetProgress))
    } else {
      setScrollProgress(normalize(targetProgress))
    }
  }

  return (
    <div className="relative  ease-in-out duration-[2000ms] transition-opacity">
      <div ref={mountRef} />
      {/* 色付きの領域 */}
      <ol
        className={`relative`}
        style={{
          height: `${100 * colors.length}vh`,
        }}
      >
        {colors.map((_, i) => {
          return (
            <li
              key={i}
              className="flex items-center justify-center text-[64px] font-bold"
              style={{
                height: `${100 / colors.length}%`,
                background: `${colors[i]}`,
              }}
            >
              {i}
            </li>
          )
        })}
      </ol>
      {/* progress表示 */}
      <div className="fixed top-0 right-0 flex items-center justify-center w-20 h-20 text-xs bg-slate-400">
        <div>
          <p>{(progress * 100).toFixed(2)}</p>
          <p>{direction}</p>
        </div>
      </div>
      {/* ボタン一覧 */}
      <ol className="fixed top-0 left-0 text-sm space-y-0.5">
        {colors.map((_, i, arr) => {
          if (i === arr.length - 1) {
            return
          }
          const progress = i / (arr.length - 1)
          return (
            <li
              key={i}
              onClick={() => handleClickBtn(progress)}
              className="flex items-center justify-center w-11 h-11 cursor-pointer text-[10px] bg-gray-300"
            >
              {(progress * 100).toFixed(2)}
            </li>
          )
        })}
        <li
          onClick={() => handleClickBtn(1)}
          className="flex items-center justify-center w-11 h-11 cursor-pointer text-[10px] bg-gray-300"
        >
          100
        </li>
      </ol>
    </div>
  )
}

export default Scroll
