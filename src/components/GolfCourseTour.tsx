import { NextPage } from 'next'
import { useRef, useEffect, useState, RefObject } from 'react'
import {
  AxesHelper,
  CameraHelper,
  CatmullRomCurve3,
  GridHelper,
  Material,
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
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

const GolfCourseTourComponent: NextPage = () => {
  const canvasMountRef = useRef<HTMLDivElement>(null)
  const boxMountRef = useRef<HTMLDivElement>(null)
  const modalMountRef = useRef<HTMLDivElement>(null)
  const subCanvasMountRef = useRef<HTMLDivElement>(null)
  const distDivRef = useRef<HTMLDivElement>(null)

  const [isMovingCamera, setIsMovingCamera] = useState(true)
  const [showBoxText, setShowBoxText] = useState(false)

  // -- 関数定義 --
  // コースのカメラ視点移動パス定義
  const pinVec = new Vector3(-1, 5, -15) // ピン位置(ゴール)
  const cameraRoutePath = new CatmullRomCurve3(
    [
      new Vector3(-2, 0.5, 29), // 最初の位置: レギュラーティー位置
      new Vector3(-3, 2, 15), // 最初の位置: レディースティー位置
      new Vector3(-4, 5, 6), // フェアウェイバンカー位置
      new Vector3(-4, 6, -1), // グリーン位置
      new Vector3(-2, 6.5, -10), // グリーン位置
      pinVec,
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
  // - サブウィンドウ
  var subRenderer: WebGLRenderer
  var subElm: HTMLDivElement | null
  var subDom: HTMLCanvasElement
  var subCamera: PerspectiveCamera
  var subScene: Scene
  var markerMesh: Mesh

  // -- 定数定義 --
  const scale = 1

  // -- 初期設定 --
  // - メインウィンドウ -
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

  // - サブウィンドウ -
  const subInit = () => {
    // ウィンドウサイズ
    var subW, subH: number
    subW = 200
    subH = 600
    if (window.innerWidth < 600) {
      subW = 100
      subH = 300
    }
    // renderer
    subRenderer = new WebGLRenderer({ alpha: true })
    subRenderer.setClearColor(0xffffff, 0.6)
    subRenderer.setSize(subW, subH)
    subRenderer.setPixelRatio(window.devicePixelRatio)
    subElm = subCanvasMountRef.current
    subDom = subRenderer.domElement
    // canvasにレンダラーのcanvasを追加
    subElm?.appendChild(subRenderer.domElement)
    const fov = 60
    subCamera = new PerspectiveCamera(fov, subW / subH, 0.1, 2000)
    subCamera.position.y = 100
    // sub scene
    subScene = new Scene()
    // 座標軸を表示
    // const axes = new AxesHelper(25)
    // subScene.add(axes)
    //　カメラコントローラーの初期設定
    const controls = new OrbitControls(subCamera, subDom)
    controls.enableDamping = true

    // object
    const markerGeometry = new SphereGeometry(2, 32)
    const markerMaterial = new MeshBasicMaterial({
      color: 0xba299e,
    })
    markerMesh = new Mesh(markerGeometry, markerMaterial)
    subScene.add(markerMesh)
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
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    )
    cameraRouteObject.add(movingCamera)
    cameraHelper = new CameraHelper(movingCamera)
    scene.add(cameraHelper)
    scene.add(cameraRouteObject)
    // sub
    subScene.add(cameraRouteObject)
  }
  // ゴルフ場3Dモデルの読み込み
  const loadGolfCourseModel = (scene: Scene) => {
    // plyファイルの読み込み
    const plyLoader = new PLYLoader()
    const material = new PointsMaterial({
      vertexColors: true, // 頂点の色付けを有効にする
      size: 0.01,
    })
    // plyLoader.load(
    //   'park.ply',
    //   (geometry) => {
    //     console.log(geometry.toJSON())
    //     geometry.computeVertexNormals()
    //     const particles = new Points(geometry, material)
    //     particles.rotateX(-Math.PI / 2)
    //     particles.rotateZ(-Math.PI / 4)
    //     // scene.add(particles)
    //   },
    //   (xhr) => {
    //     console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    //   },
    //   (error) => {
    //     console.log(error)
    //   }
    // )
    // fbxファイルの読み込み
    const fbxLoader = new FBXLoader()
    fbxLoader.load(
      'park.fbx',
      (object) => {
        object.traverse((child) => {
          if (child instanceof Mesh) {
            if (child.material) {
              const oldMaterial = child.material
              child.material = new MeshBasicMaterial({
                color: oldMaterial.color,
                map: oldMaterial.map,
              })
            }
          }
          child.rotation.set(0, -Math.PI / 8, 0)
        })
        scene.add(object)
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
      },
      (error) => {
        console.error(error)
      }
    )
  }
  // クリックアクション用オブジェクト
  const addClickableObject = (x: number, y: number, z: number) => {
    const ballGeometry = new SphereGeometry(0.5, 32)
    const ballMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
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
  var distanceToPin: number = 0
  const render = () => {
    // animate camera along spline
    const time = Date.now()
    const looptime = 20 * 1000
    // const t = (time % looptime) / looptime
    const distanceToPin = pinVec.distanceTo(markerMesh.position)
    const distElm = distDivRef.current as HTMLDivElement
    distElm.innerHTML = `<p>${distanceToPin.toFixed(1)}</p>`

    const t = (Math.abs(scrollDistance) % looptime) / looptime
    cameraRouteGeometry.parameters.path.getPointAt(t, position)
    position.multiplyScalar(scale)
    markerMesh.position.set(position.x, position.y, position.z)
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
    movingCamera.matrix.lookAt(movingCamera.position, lookAt, normal)
    // ↓コメントアウトを外すとx軸をz軸方向に跨ぐ時に視点がおかしくなる
    // movingCamera.quaternion.setFromRotationMatrix(movingCamera.matrix)

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
    // updateElementPositionOnScreen(ballMesh, modalMountRef, '', true)

    // 画面に表示
    renderer.render(scene, isMovingCamera ? movingCamera : camera)
    subRenderer.render(subScene, subCamera)
    // 次のフレームを要求
    requestAnimationFrame(() => {
      render()
    })
  }
  useEffect(() => {
    init()
    subInit()
    options()
    createCameraRouteObject()
    loadGolfCourseModel(scene)
    loadGolfCourseModel(subScene)
    // 開始点
    addClickableObject(-2, 0.5, 29)
    addClickableObject(-3, 2, 15)
    addClickableObject(-4, 5, 6)
    addClickableObject(-4, 6, -1)
    addClickableObject(-2, 5, -15)
    //
    render()
    // スクロールの移動量に合わせてカメラの座標を動かす
    document.addEventListener('wheel', (event) => {
      scrollDistance += event.deltaY * 0.2
    })
    // スマホでのスクロール
    var lastY: number
    var touchMovedDistance = 0
    document.addEventListener('touchstart', (event) => {
      lastY = event.touches[0].clientY
      event.preventDefault()
    })
    document.addEventListener('touchmove', (event) => {
      var currentY = event.touches[0].clientY
      const delta = currentY - lastY
      scrollDistance += delta * 0.5
      event.preventDefault()
    })
    return () => {
      elm?.removeChild(renderer.domElement)
      subElm?.removeChild(subRenderer.domElement)
    }
  })

  return (
    <>
      <div ref={canvasMountRef} />
      <div id="box" ref={boxMountRef} className={styles.boxText} />
      <div id="modal" ref={modalMountRef} className={styles.boxText} />
      <div
        ref={subCanvasMountRef}
        className="fixed top-1/2 right-2 z-10 sm:-mt-[300px] -mt-[150px]"
      />
      {/* Yard表示 */}
      <div className="fixed top-0 left-0 flex flex-col items-center justify-center w-20 h-20 text-xs bg-slate-400 text-center">
        <p>残り</p>
        <div ref={distDivRef}>
          <p>{distanceToPin.toFixed(1)}</p>
        </div>
        <p>yard</p>
      </div>
    </>
  )
}

export default GolfCourseTourComponent
