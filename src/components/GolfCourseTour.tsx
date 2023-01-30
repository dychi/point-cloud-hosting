import { NextPage } from 'next'
import { useRef, useEffect, useState, RefObject } from 'react'
import {
  AxesHelper,
  CameraHelper,
  CatmullRomCurve3,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import GUI from 'lil-gui'
import styles from '../styles/Home.module.css'

const GolfCourseTourComponent: NextPage = () => {
  const canvasMountRef = useRef<HTMLDivElement>(null)
  const boxMountRef = useRef<HTMLDivElement>(null)
  const modalMountRef = useRef<HTMLDivElement>(null)

  const [isMovingCamera, setIsMovingCamera] = useState(false)
  const [showBoxText, setShowBoxText] = useState(false)

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
      new Vector3(21, 0.5, 29), // 最初の位置: レギュラーティー位置
      new Vector3(10, 1, 15), // 最初の位置: レディースティー位置
      new Vector3(2, 5, 6), // フェアウェイバンカー位置
      new Vector3(-4, 6, -1), // グリーン位置
      new Vector3(-17, 6.5, -10), // グリーン位置
      new Vector3(-20, 5, -15), // グリーン位置
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
  var ballMesh: Mesh

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
    elm = canvasMountRef.current
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
    // 地面を作成
    const plane = new GridHelper(100)
    scene.add(plane)

    // guiを追加
    const gui = new GUI()
    gui.add(document, 'title')
    const folderCamera = gui.addFolder('Camera')
    const obj = {
      look_with_tour: isMovingCamera,
      show_camera_position: showBoxText,
    }
    folderCamera.add(obj, 'look_with_tour').onChange(() => {
      if (isMovingCamera) {
        setIsMovingCamera(false)
      } else {
        setIsMovingCamera(true)
      }
    })
    folderCamera.add(obj, 'show_camera_position').onChange(() => {
      if (showBoxText) {
        setShowBoxText(false)
      } else {
        setShowBoxText(true)
      }
    })
  }

  // -- オブジェクト定義 --
  // カメラの移動するルートのチューブオブジェクト
  const createCameraRouteObject = () => {
    const cameraRouteObject = new Object3D()
    cameraRouteGeometry = new TubeGeometry(cameraRoutePath, 20, 0.1, 3, false)
    const cameraRouteMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.3,
      transparent: true,
    })
    const cameraRouteMesh = new Mesh(cameraRouteGeometry, cameraRouteMaterial)
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
  // クリックアクション用オブジェクト
  const addClickableObject = (x: number, y: number, z: number) => {
    const ballGeometry = new SphereGeometry(0.5, 32)
    const ballMaterial = new MeshBasicMaterial({
      color: 0xffffff,
    })
    ballMesh = new Mesh(ballGeometry, ballMaterial)
    ballMesh.position.set(x, y, z)
    scene.add(ballMesh)
  }
  const updateElementPositionOnScreen = (
    mesh: Object3D,
    ref: RefObject<HTMLDivElement>,
    innerHtml: string,
    visible: boolean = false
  ) => {
    const worldPos = mesh.getWorldPosition(new Vector3())
    const projection = worldPos.project(camera)
    const sx = (window.innerHeight / 2) * (+projection.x + 1.0)
    const sy = (window.innerHeight / 2) * (-projection.y + 1.0)
    const tf = ref.current as HTMLDivElement
    if (visible) {
      tf.innerHTML =
        `<p>スクリーン座標(${Math.round(sx)}, ${Math.round(sy)})` + innerHtml
      tf.style.transform = `translate(${sx}px, ${sy}px)`
    } else {
      tf.innerHTML = ''
      tf.style.transform = ''
    }
  }

  // -- rendering --
  // アニメーション用のrender関数を定義
  var scrollDistance: number = 10
  const render = () => {
    // animate camera along spline
    const time = Date.now()
    const looptime = 20 * 1000
    // const t = (time % looptime) / looptime
    const t = (Math.abs(scrollDistance) % looptime) / looptime
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
    normal.copy(binormal).cross(direction)
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
    if (movingCamera.position.x <= 0) {
      movingCamera.matrix.lookAt(
        movingCamera.position,
        lookAt.multiply(new Vector3(-1, 1, -1)),
        normal.multiply(new Vector3(1, -1, 1))
      )
    } else {
      movingCamera.matrix.lookAt(
        movingCamera.position,
        lookAt,
        normal.multiply(new Vector3(1, -1, 1))
      )
    }
    movingCamera.quaternion.setFromRotationMatrix(movingCamera.matrix)

    // options
    cameraHelper.update()
    // controls.update()

    // HTML要素の座標更新
    if (showBoxText) {
      updateElementPositionOnScreen(
        movingCamera,
        boxMountRef,
        '<button>ボタン</button>',
        true
      )
    } else {
      updateElementPositionOnScreen(movingCamera, boxMountRef, '')
    }
    updateElementPositionOnScreen(ballMesh, modalMountRef, '', true)

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
    // 開始点
    addClickableObject(21, 0.5, 29)
    addClickableObject(10, 2, 15)
    addClickableObject(2, 5, 6)
    addClickableObject(-4, 6, -1)
    addClickableObject(-20, 5, -15)
    //
    render()
    // スクロールの移動量に合わせてカメラの座標を動かす
    document.addEventListener('wheel', (event) => {
      console.log(event.deltaY)
      // movingCamera.position.z -= event.deltaY * 0.05
      scrollDistance += event.deltaY * 0.05
    })
    return () => {
      elm?.removeChild(renderer.domElement)
    }
  })

  return (
    <>
      <div ref={canvasMountRef} />
      <div id="box" ref={boxMountRef} className={styles.boxText} />
      <div id="modal" ref={modalMountRef} className={styles.boxText} />
    </>
  )
}

export default GolfCourseTourComponent
