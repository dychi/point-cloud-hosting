import { NextPage } from 'next'
import { useEffect, useRef } from 'react'
import {
  Mesh,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  WebGLRenderer,
  AxesHelper,
} from 'three'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import GUI from 'lil-gui'

const PointCloudLoader: NextPage = () => {
  // canvasのコンテナ用
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // ウィンドウサイズ
    const w = window.innerWidth
    const h = window.innerHeight

    // レンダラーを作成
    const renderer = new WebGLRenderer()
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    const elm = mountRef.current
    const dom = renderer.domElement
    // canvasにレンダラーのcanvasを追加
    elm?.appendChild(renderer.domElement)

    // カメラを作成
    // ウィンドウとWebGLの座標を一致させるため、描画がウィンドウぴったりになるようにカメラを調整
    const fov = 60
    const fovRad = (fov / 2) * (Math.PI / 180)
    const dist = h / 2 / Math.tan(fovRad)
    const camera = new PerspectiveCamera(fov, w / h, 0.1, 2000)
    camera.position.z = 10

    //　カメラコントローラーの初期設定
    const controls = new OrbitControls(camera, dom)
    controls.enableDamping = true

    // シーンを作成
    const scene = new Scene()

    // 座標軸を表示
    const axes = new AxesHelper(25)
    scene.add(axes)

    // guiを追加
    const gui = new GUI()
    gui.add(document, 'title')
    const obj = {
      hello_function: () => alert('hello'),
    }
    gui.add(obj, 'hello_function')

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

    // // fbxファイルの読み込み
    // const fbxLoader = new FBXLoader()
    // fbxLoader.load(
    //   'dog.fbx',
    //   (object) => {
    //     object.traverse(function (child) {
    //       if ((child as THREE.Mesh).isMesh) {
    //         // (child as THREE.Mesh).material = material
    //         if ((child as THREE.Mesh).material) {
    //           ;(
    //             (child as THREE.Mesh).material as THREE.MeshBasicMaterial
    //           ).transparent = false
    //         }
    //       }
    //     })
    //     object.scale.set(0.01, 0.01, 0.01)
    //     scene.add(object)
    //   },
    //   (xhr) => {
    //     console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    //   },
    //   (error) => {
    //     console.error(error)
    //   }
    // )

    // render関数を定義
    const render = () => {
      // 次のフレームを要求
      requestAnimationFrame(() => {
        render()
      })
      controls.update()
      // 画面に表示
      renderer.render(scene, camera)
    }
    render()

    return () => {
      elm?.removeChild(renderer.domElement)
    }
  })
  return <div ref={mountRef} />
}

export default PointCloudLoader
