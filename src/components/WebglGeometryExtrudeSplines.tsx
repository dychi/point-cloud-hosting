import { NextPage } from 'next'
import { useEffect, useRef, useState } from 'react'
import {
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector3,
  CatmullRomCurve3,
  MeshLambertMaterial,
  MeshBasicMaterial,
  TubeGeometry,
  CameraHelper,
  Color,
  DirectionalLight,
  Object3D,
  SphereGeometry,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as Curves from 'three/examples/jsm/curves/CurveExtras'
import Stats from 'three/examples/jsm/libs/stats.module'
import GUI from 'lil-gui'

const WebglGeometryExtrudeSplines: NextPage = () => {
  const [progress, setProgress] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  // canvasのコンテナ用
  const mountRef = useRef<HTMLDivElement>(null)

  const params = {
    spline: 'GrannyKnot',
    scale: 4,
    extrusionSegments: 100,
    radiusSegments: 3,
    closed: true,
    animationView: true,
    lookAhead: false,
    cameraHelper: true,
  }
  const handleScroll = () => {
    console.log('window.scrollY: ', scrollY)
    setScrollY(window.scrollY)
  }
  useEffect(() => {
    document.addEventListener('scroll', handleScroll, { passive: true })
    var container: HTMLDivElement, stats: Stats
    var camera: PerspectiveCamera,
      scene: Scene,
      renderer: WebGLRenderer,
      splineCamera: PerspectiveCamera
    var cameraHelper: CameraHelper, cameraEye: Mesh

    const direction = new Vector3()
    const binormal = new Vector3()
    const normal = new Vector3()
    const position = new Vector3()
    const lookAt = new Vector3()

    const sampleClosedSpline = new CatmullRomCurve3(
      [
        new Vector3(0, -40, -40),
        new Vector3(0, 40, -40),
        new Vector3(0, 140, -40),
        new Vector3(0, 40, 40),
        new Vector3(0, -40, 40),
      ],
      true,
      'catmullrom'
    )
    // Keep a dictionary of Curve instances
    const splines = {
      GrannyKnot: new Curves.GrannyKnot(),
      HeartCurve: new Curves.HeartCurve(3.5),
      SampleClosedSpline: sampleClosedSpline,
    }

    var parent: Object3D, tubeGeometry: TubeGeometry, mesh: Mesh

    const material = new MeshLambertMaterial({ color: 0xff00ff })

    const wireframeMaterial = new MeshBasicMaterial({
      color: 0x000000,
      opacity: 0.3,
      wireframe: true,
      transparent: true,
    })

    const addTube = () => {
      if (mesh !== undefined) {
        parent.remove(mesh)
        mesh.geometry.dispose()
      }

      const extrudePath = splines.GrannyKnot

      tubeGeometry = new TubeGeometry(
        extrudePath,
        params.extrusionSegments,
        2,
        params.radiusSegments,
        params.closed
      )

      addGeometry(tubeGeometry)

      setScale()
    }

    const setScale = () => {
      mesh.scale.set(params.scale, params.scale, params.scale)
    }

    const addGeometry = (geometry: TubeGeometry) => {
      // 3D shape

      mesh = new Mesh(geometry, material)
      const wireframe = new Mesh(geometry, wireframeMaterial)
      mesh.add(wireframe)

      parent.add(mesh)
    }
    const animateCamera = () => {
      cameraHelper.visible = params.cameraHelper
      cameraEye.visible = params.cameraHelper
    }
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    const init = () => {
      const container = mountRef.current as HTMLDivElement

      // camera
      camera = new PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.01,
        10000
      )
      camera.position.set(0, 50, 500)

      // scene

      scene = new Scene()
      scene.background = new Color(0xf0f0f0)

      // light

      const light = new DirectionalLight(0xffffff)
      light.position.set(0, 0, 1)
      scene.add(light)

      // tube

      parent = new Object3D()
      scene.add(parent)

      splineCamera = new PerspectiveCamera(
        84,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      )
      parent.add(splineCamera)

      cameraHelper = new CameraHelper(splineCamera)
      scene.add(cameraHelper)

      addTube()

      // debug camera
      cameraEye = new Mesh(
        new SphereGeometry(5),
        new MeshBasicMaterial({ color: 0xdddddd })
      )
      parent.add(cameraEye)

      cameraHelper.visible = params.cameraHelper
      cameraEye.visible = params.cameraHelper

      // renderer
      renderer = new WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(window.innerWidth, window.innerHeight)
      container.appendChild(renderer.domElement)

      // stats

      stats = Stats()
      container.appendChild(stats.dom)

      // dat.GUI
      const gui = new GUI({ width: 285 })

      const folderGeometry = gui.addFolder('Geometry')
      folderGeometry
        .add(params, 'spline', Object.keys(splines))
        .onChange(function () {
          addTube()
        })
      folderGeometry
        .add(params, 'scale', 2, 10)
        .step(2)
        .onChange(function () {
          setScale()
        })
      folderGeometry
        .add(params, 'extrusionSegments', 50, 500)
        .step(50)
        .onChange(function () {
          addTube()
        })
      folderGeometry
        .add(params, 'radiusSegments', 2, 12)
        .step(1)
        .onChange(function () {
          addTube()
        })
      folderGeometry.add(params, 'closed').onChange(function () {
        addTube()
      })
      folderGeometry.open()

      const folderCamera = gui.addFolder('Camera')
      folderCamera.add(params, 'animationView').onChange(function () {
        animateCamera()
      })
      folderCamera.add(params, 'lookAhead').onChange(function () {
        animateCamera()
      })
      folderCamera.add(params, 'cameraHelper').onChange(function () {
        animateCamera()
      })
      folderCamera.open()

      // スクロール/角度のコントロール
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.minDistance = 100
      controls.maxDistance = 2000

      window.addEventListener('resize', onWindowResize)
      console.log('getDistance', controls.getDistance())
      controls.addEventListener('scroll', handleScroll)
    }
    init()
    // render関数を定義
    const render = () => {
      // animate camera along spline
      const time = Date.now()
      const looptime = 20 * 1000
      const t = (time % looptime) / looptime
      tubeGeometry.parameters.path.getPointAt(t, position)
      position.multiplyScalar(params.scale)
      // interpolation
      const segments = tubeGeometry.tangents.length
      const pickt = t * segments
      const pick = Math.floor(pickt)
      const pickNext = (pick + 1) % segments

      binormal.subVectors(
        tubeGeometry.binormals[pickNext],
        tubeGeometry.binormals[pick]
      )
      binormal.multiplyScalar(pickt - pick).add(tubeGeometry.binormals[pick])

      tubeGeometry.parameters.path.getTangentAt(t, direction)
      const offset = 15

      normal.copy(binormal).cross(direction)

      // we move on a offset on its binormal
      position.add(normal.clone().multiplyScalar(offset))

      splineCamera.position.copy(position)
      cameraEye.position.copy(position)

      // using arclength for stablization in look ahead
      tubeGeometry.parameters.path.getPointAt(
        (t + 30 / tubeGeometry.parameters.path.getLength()) % 1,
        lookAt
      )
      lookAt.multiplyScalar(params.scale)

      // camera orientation 2 - up orientation via normal
      if (!params.lookAhead) lookAt.copy(position).add(direction) // lookAhead
      splineCamera.matrix.lookAt(splineCamera.position, lookAt, normal)
      splineCamera.quaternion.setFromRotationMatrix(splineCamera.matrix)

      cameraHelper.update()

      renderer.render(
        scene,
        params.animationView === true ? splineCamera : camera
        // splineCamera
      )
      // アニメーション
      requestAnimationFrame(() => {
        render()
      })
      // stats: FPSビューの更新
      stats.update()
    }
    render()

    return () => {
      container?.removeChild(renderer.domElement)
    }
  })
  return <div ref={mountRef} />
}

export default WebglGeometryExtrudeSplines
