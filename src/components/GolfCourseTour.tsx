import { NextPage } from 'next'
import { useRef, useEffect, useState } from 'react'
import {
  AxesHelper,
  CameraHelper,
  CatmullRomCurve3,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import GUI from 'lil-gui'

const GolfCourseTourComponent: NextPage = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isMovingCamera, setIsMovingCamera] = useState(false)
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
  // コースのカメラ視点移動パス定義
  const cameraRoutePath = new CatmullRomCurve3(
    [
      new Vector3(0, 0, 10), // 最初の位置: レギュラーティー位置
      new Vector3(0, 0, 5), // 最初の位置: レディースティー位置
      new Vector3(0, 5, -2), // フェアウェイバンカー位置
      new Vector3(0, 4, -10), // グリーン位置
    ],
    false,
    'catmullrom'
  )
  const direction = new Vector3()
  const binormal = new Vector3()
  const normal = new Vector3()
  const position = new Vector3()
  const lookAt = new Vector3()

  // -- 変数定義 --
  var scene: Scene
  var controls: OrbitControls
  var dom: HTMLCanvasElement
  var camera: PerspectiveCamera
  var movingCamera: PerspectiveCamera
  var cameraHelper: CameraHelper
  var renderer: WebGLRenderer
  var elm: HTMLDivElement | null
  var cameraRouteGeometry: TubeGeometry

  // -- 定数定義 --
  const scale = 1

  // -- 初期設定 --
  const init = () => {
    // ウィンドウサイズ
    const w = window.innerWidth
    const h = window.innerHeight

    // レンダラーを作成
    renderer = new WebGLRenderer()
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    elm = mountRef.current
    dom = renderer.domElement
    // canvasにレンダラーのcanvasを追加
    elm?.appendChild(renderer.domElement)

    // カメラを作成
    // ウィンドウとWebGLの座標を一致させるため、描画がウィンドウぴったりになるようにカメラを調整
    const fov = 60
    const fovRad = (fov / 2) * (Math.PI / 180)
    const dist = h / 2 / Math.tan(fovRad)
    camera = new PerspectiveCamera(fov, w / h, 0.1, 2000)
    camera.position.z = 10

    // シーンを作成
    scene = new Scene()
  }

  const options = () => {
    //　カメラコントローラーの初期設定
    controls = new OrbitControls(camera, dom)
    controls.enableDamping = true

    // 座標軸を表示
    const axes = new AxesHelper(25)
    scene.add(axes)

    // guiを追加
    const gui = new GUI()
    gui.add(document, 'title')
    const obj = {
      look_with_tour: () => {
        if (isMovingCamera) {
          setIsMovingCamera(false)
        } else {
          setIsMovingCamera(true)
        }
      },
    }
    gui.add(obj, 'look_with_tour')
  }

  // -- オブジェクト定義 --
  // カメラの移動するルートのチューブオブジェクト
  const createCameraRouteObject = () => {
    const cameraRouteObject = new Object3D()
    cameraRouteGeometry = new TubeGeometry(cameraRoutePath, 20, 0.1, 3, false)
    const cameraRouteMaterial = new MeshBasicMaterial({
      color: 0xff00ff,
    })
    const wireframeMaterial = new MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.3,
      wireframe: true,
      transparent: false,
    })
    const cameraRouteMesh = new Mesh(cameraRouteGeometry, cameraRouteMaterial)
    const wireframe = new Mesh(cameraRouteGeometry, wireframeMaterial)
    cameraRouteMesh.add(wireframe)
    cameraRouteObject.add(cameraRouteMesh)
    // 移動する視点のカメラ
    movingCamera = new PerspectiveCamera(
      84,
      window.innerHeight / window.innerWidth,
      0.01,
      1000
    )
    cameraRouteObject.add(movingCamera)
    cameraHelper = new CameraHelper(movingCamera)
    scene.add(cameraHelper)
    scene.add(cameraRouteObject)
  }
  // ゴルフ場3Dモデルの読み込み
  const loadGolfCourseModel = () => {
    // plyファイルの読み込み
    const plyLoader = new PLYLoader()
    const material = new PointsMaterial({
      vertexColors: true, // 頂点の色付けを有効にする
      size: 0.01,
    })
    plyLoader.load(
      'park.ply',
      (geometry) => {
        console.log(material.toJSON())
        const particles = new Points(geometry, material)
        particles.rotateX(-Math.PI / 2)
        scene.add(particles)
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      },
      (error) => {
        console.log(error)
      }
    )
  }
  // アニメーション用のrender関数を定義
  const render = () => {
    // animate camera along spline
    const time = Date.now()
    const looptime = 20 * 1000
    const t = (time % looptime) / looptime
    cameraRouteGeometry.parameters.path.getPointAt(t, position)
    position.multiplyScalar(scale)
    // interpolation
    const segments = cameraRouteGeometry.tangents.length
    const pickt = t * segments
    const pick = Math.floor(pickt)
    const pickNext = (pick + 1) % segments

    binormal.subVectors(
      cameraRouteGeometry.binormals[pickNext],
      cameraRouteGeometry.binormals[pick]
    )
    binormal
      .multiplyScalar(pickt - pick)
      .add(cameraRouteGeometry.binormals[pick])

    cameraRouteGeometry.parameters.path.getTangentAt(t, direction)
    const offset = 0.1
    // we move on a offset on its binormal
    position.add(normal.clone().multiplyScalar(offset))

    movingCamera.position.copy(position)

    // using arclength for stablization in look ahead
    cameraRouteGeometry.parameters.path.getPointAt(
      (t + 30 / cameraRouteGeometry.parameters.path.getLength()) % 1,
      lookAt
    )

    lookAt.multiplyScalar(scale)
    // 移動する視点の座標を更新
    movingCamera.matrix.lookAt(movingCamera.position, lookAt, normal)
    movingCamera.quaternion.setFromRotationMatrix(movingCamera.matrix)

    // options
    cameraHelper.update()
    controls.update()
    // 画面に表示
    renderer.render(scene, isMovingCamera ? movingCamera : camera)
    // 次のフレームを要求
    requestAnimationFrame(() => {
      render()
    })
  }
  useEffect(() => {
    init()
    options()
    createCameraRouteObject()
    loadGolfCourseModel()
    render()
    return () => {
      elm?.removeChild(renderer.domElement)
    }
  })

  return <div ref={mountRef} />
}

export default GolfCourseTourComponent
