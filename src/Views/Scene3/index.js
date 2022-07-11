import gsap from "gsap";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./index.scss";

const SIZES = { width: window.innerWidth, height: window.innerHeight };

export const Scene3 = () => {
  const camera = useRef(null);
  const renderer = useRef(null);
  const orbitControl = useRef(null);
  const duck = useRef(null);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const currentIntersect = useRef(null);

  const onPointMove = (event) => {
    // calculate pointer position in normalized device coordinates
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const onPointClick = (event) => {
    if (currentIntersect.current) {
      const { object } = currentIntersect.current;
      const timeline = gsap.timeline();
      gsap.to(object.rotation, {
        duration: 2,
        y: object.rotation.y + Math.PI * 2 * 4,
      });
      timeline
        .to(object.scale, {
          duration: 1,
          x: object.scale.x * 2,
          y: object.scale.y * 2,
          z: object.scale.z * 2,
        })
        .to(object.scale, {
          duration: 1,
          x: object.scale.x,
          y: object.scale.y,
          z: object.scale.z,
        });
    }
  };

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
    window.addEventListener("mousemove", onPointMove);
    window.addEventListener("click", onPointClick);

    // Handing Resize
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("mousemove", onPointMove);
      window.removeEventListener("click", onPointClick);
    };
  }, []);

  const renderModel = () => {
    const scene = new THREE.Scene();

    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.far = 15;
    directionalLight.shadow.camera.left = -7;
    directionalLight.shadow.camera.top = 7;
    directionalLight.shadow.camera.right = 7;
    directionalLight.shadow.camera.bottom = -7;
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    /**
     * Models
     */
    const gltfLoader = new GLTFLoader();
    gltfLoader.load("/models/Duck.glb", (gltf) => {
      const model = gltf.scene.children[0];
      if (model) {
        model.position.set(0, -0.5, 0);
        model.scale.set(
          model.scale.x * 0.5,
          model.scale.y * 0.5,
          model.scale.z * 0.5
        );
        duck.current = model;
        scene.add(model);
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
    if (_camera) {
      orbitControl.current?.update(0);
      if (duck.current) {
        raycaster.setFromCamera(pointer, _camera);
        const objectsToTest = [duck.current];

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(objectsToTest);

        if (intersects.length) {
          currentIntersect.current = intersects[0];
        } else {
          currentIntersect.current = null;
        }
      }
    }
    _renderer.render(scene, _camera);
    window.requestAnimationFrame(() => tick(scene));
  };
  return (
    <div className={"scene"}>
      <canvas className={"canvas"} />
    </div>
  );
};
