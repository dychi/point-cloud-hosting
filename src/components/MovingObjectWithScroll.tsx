import { NextPage } from 'next'
import { useRef, useEffect } from 'react'
import {
  AxesHelper,
  CatmullRomCurve3,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const MovingObjectWithScroll: NextPage = () => {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const w = 200
    const h = 800
    const renderer = new WebGLRenderer({ alpha: true })
    renderer.setClearColor(0x000000, 0.6)
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    const elm = canvasRef.current
    const dom = renderer.domElement
    elm?.appendChild(renderer.domElement)
    // camera
    const fov = 60
    const camera = new PerspectiveCamera(fov, w / h, 0.1, 2000)
    camera.position.y = 10

    // scene
    const scene = new Scene()

    //　カメラコントローラーの初期設定
    const controls = new OrbitControls(camera, dom)
    controls.enableDamping = true

    // 座標軸を表示
    const axes = new AxesHelper(25)
    scene.add(axes)
    // 地面を作成
    const plane = new GridHelper(100)
    scene.add(plane)

    // object
    const sphere = new SphereGeometry(0.5, 32)
    const material = new MeshBasicMaterial({
      color: 0xffffff,
    })
    const mesh = new Mesh(sphere, material)
    scene.add(mesh)

    // route
    const routePath = new CatmullRomCurve3(
      [new Vector3(0, 0, -5), new Vector3(0, 0, 5)],
      false,
      'catmullrom'
    )
    const routeGeometry = new TubeGeometry(routePath, 20, 0.1, 3, false)
    const routeMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.3,
      transparent: true,
    })
    const routeMesh = new Mesh(routeGeometry, routeMaterial)
    scene.add(routeMesh)

    // スクロール関数
    const position = new Vector3()
    var scrollDistance = 1
    const maxDistance = 20000
    // render関数
    const render = () => {
      // スクロール関連
      const t = (Math.abs(scrollDistance) % maxDistance) / maxDistance
      routeGeometry.parameters.path.getPointAt(t, position)
      mesh.position.setZ(-position.z)

      // rendering
      renderer.render(scene, camera)
      requestAnimationFrame(() => {
        render()
      })
    }
    render()
    // スクロールの移動量に合わせてカメラの座標を動かす
    document.addEventListener('wheel', (event) => {
      scrollDistance += event.deltaY * 0.2
    })
    return () => {
      elm?.removeChild(renderer.domElement)
    }
  })
  return (
    <div className="bg-neutral-300 items-center h-screen">
      <div ref={canvasRef} className="fixed top-1/2 right-2 -mt-[400px]" />
    </div>
  )
}

export default MovingObjectWithScroll
