import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./index.scss";

const SIZES = { width: window.innerWidth, height: window.innerHeight };

export const Scene4 = () => {
  const camera = useRef(null);
  const renderer = useRef(null);
  const orbitControl = useRef(null);

  const onResize = () => {
    const _camera = camera.current,
      _renderer = renderer.current;
    if (_camera && _renderer) {
      // update sizes
      SIZES.width = window.innerWidth;
      SIZES.height = window.innerHeight;

      //   update camera
      _camera.aspect = SIZES.width / SIZES.height;
      _camera.updateProjectionMatrix();

      //   update renderer
      _renderer.setSize(SIZES.width, SIZES.height);
      _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  };

  useEffect(() => {
    renderModel();

    // Handing Resize
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const renderModel = () => {
    const scene = new THREE.Scene();

    /**
     * Models
     */
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("/models/Abandonded room.glb", (gltf) => {
      const model = gltf.scene;
      if (model) {
        const objects = [...gltf.scene.children];
        for (const object of objects) {
          scene.add(object);
        }
      }
    });

    //camera
    const _camera = new THREE.PerspectiveCamera(70, SIZES.width / SIZES.height);
    _camera.position.set(1, 2, 4);
    scene.add(_camera);
    camera.current = _camera;
    const canvas = document.querySelector(".canvas");

    //renderer
    const _renderer = new THREE.WebGLRenderer({ canvas });
    _renderer.setSize(SIZES.width, SIZES.height);
    _renderer.setPixelRatio(window.devicePixelRatio);
    _renderer.render(scene, _camera);
    renderer.current = _renderer;

    // controls
    orbitControl.current = new OrbitControls(_camera, canvas);
    orbitControl.current.enableDamping = true;

    tick(scene);
  };

  const tick = (scene) => {
    const _camera = camera.current,
      _renderer = renderer.current;
    orbitControl.current?.update(0);
    _renderer.render(scene, _camera);
    window.requestAnimationFrame(() => tick(scene));
  };
  return (
    <div className={"scene"}>
      <canvas className={"canvas"} />
    </div>
  );
};
