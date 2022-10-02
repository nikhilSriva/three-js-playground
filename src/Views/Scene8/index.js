import { useEffect, useRef, useState } from "react";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// import DungeonModel from "../../assets/models/dungeon.glb";
import Soldier from "../../assets/models/UpdatedSoldier.glb";
// import ChineseCity from "../../assets/models/low_poly_chinese_city.glb";
import { getDirectionOffset } from "../../utils";

// ------------
// * Global Constants
// ------------
const SIZES = { width: window.innerWidth, height: window.innerHeight };

export const Scene8 = () => {
  // ------------
  // * UseStates
  // ------------
  const [loading, setLoading] = useState(false);
  const [loadingPercentage, setLoadingPercentage] = useState(0);

  // ------------
  // * UseRefs
  // ------------
  const _clock = useRef(null);
  const _scene = useRef(null);
  const _camera = useRef(null);
  const _renderer = useRef(null);
  const _plane = useRef(null);
  const _controller = useRef(null);
  const _gltfLoader = useRef(null);
  const _ambientLight = useRef(null);
  const _player = useRef(null);
  const _mixer = useRef(null);
  const _previousTime = useRef(0);
  const _keysPressed = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  });

  // ------------
  // * Functions
  // ------------
  const createScene = () => {
    _scene.current = new THREE.Scene();
  };

  const createCamera = () => {
    const camera = new THREE.PerspectiveCamera(
      75,
      SIZES.width / SIZES.height
      // 0.1,
      // 100
    );
    camera.position.z = 3;
    // camera.position.set(0, , 0);
    // camera.updateProjectionMatrix();
    _camera.current = camera;
    _scene.current.add(_camera.current);
  };

  const createRenderer = () => {
    const canvas = document.querySelector(".canvas");
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(SIZES.width, SIZES.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.render(_scene.current, _camera.current);
    _renderer.current = renderer;
  };

  const createAxesHelper = () => {
    const axesHelper = new THREE.AxesHelper(1);
    _scene.current.add(axesHelper);
  };

  const createLoadingManager = () => {
    const manager = new THREE.LoadingManager();
    manager.onStart = function () {
      console.log("Loading Started!");
      setLoading(true);
    };
    manager.onProgress = function (_, itemLoaded, totalItems) {
      setLoadingPercentage((totalItems / itemLoaded) * 100);
    };
    manager.onLoad = function () {
      console.log("Loading complete!");
      setLoading(false);
    };
    _gltfLoader.current = new GLTFLoader(manager);
  };

  const createLights = () => {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x223344, 1);
    hemiLight.position.set(0, 20, 0);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    _scene.current.add(hemiLight, dirLight);
  };

  const loadEnvironment = () => {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({ color: 0x555555, depthWrite: false })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    _plane.current = plane;
    _scene.current.add(plane);

    // _gltfLoader.current.load(
    //   ChineseCity,
    //   (gltf) => {
    //     console.log(
    //       "🚀 ~ file: index.js ~ line 84 ~ loadEnvironment ~ gltf",
    //       gltf
    //     );
    //     const gltfScene = gltf.scene;
    //     console.log(
    //       "🚀 ~ file: index.js ~ line 79 ~ loadEnvironment ~ gltfScene",
    //       gltfScene
    //     );
    //     gltfScene.position.set(-20.5, -0.5, -20);
    //     _scene.current.add(gltfScene);
    //   },
    //   () => {},
    //   (err) => console.error("Error while loading model", err)
    // );
  };

  const createControl = () => {
    const controller = new OrbitControls(
      _camera.current,
      _renderer.current.domElement
    );
    _controller.current = controller;
  };

  const createPlayer = () => {
    _gltfLoader.current.load(Soldier, (gltf) => {
      const soldier = gltf.scene;
      _scene.current.add(soldier);

      soldier.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
        }
      });

      const animations = gltf.animations;
      const mixer = new THREE.AnimationMixer(soldier);
      // const action = mixer.clipAction(gltf.animations[3]);
      _mixer.current = mixer;
      // action.play();
      const actions = animations.reduce(
        (actions, animation) => ({
          ...actions,
          [animation.name]: mixer.clipAction(animation),
        }),
        {}
      );
      _player.current = {
        model: soldier,
        actions,
        currentAction: "TPose",
        walkDirection: new THREE.Vector3(),
      };
    });
  };

  const updateCameraTarget = (moveX, moveZ) => {
    // move camera
    _camera.current.position.x += moveX;
    _camera.current.position.z += moveZ;

    // update camera target
    const { model } = _player.current;
    const cameraTarget = new THREE.Vector3();
    cameraTarget.x = model.position.x;
    cameraTarget.y = model.position.y + 1;
    cameraTarget.z = model.position.z;
    _controller.current.target = cameraTarget;
  };

  const playerUpdateHandler = (delta) => {
    const keysMap = _keysPressed.current;
    const directionPressed = Object.keys(keysMap).some(
      (key) => !!keysMap[key] && key !== "shift"
    );
    const isShiftPressed = keysMap.shift;

    // Setting current animation state (Run, Walk, Idle)
    let play = "";
    if (directionPressed && isShiftPressed) {
      play = "Run";
    } else if (directionPressed) {
      play = "Walk";
    } else {
      play = "Idle";
    }

    // Switching animation state
    const { model, currentAction, actions, walkDirection } = _player.current;
    if (currentAction !== play) {
      const toPlay = actions[play];
      const current = actions[currentAction];

      current.fadeOut();
      toPlay.reset().fadeIn().play();
      _player.current.currentAction = play;
    }
    // Updating mixer to play the current animation
    _mixer.current.update(delta);

    // Calculating the direction of player movement
    if (currentAction === "Run" || currentAction === "Walk") {
      const camera = _camera.current;

      // Calculate towards camera direction
      const angleYCameraDirection = Math.atan2(
        camera.position.x - model.position.x,
        camera.position.z - model.position.z
      );

      // diagonal movement angle offset
      const directionOffset = getDirectionOffset(keysMap);

      // rotate model
      const rotateAngle = new THREE.Vector3(0, 1, 0);
      const rotateQuarternion = new THREE.Quaternion();
      rotateQuarternion.setFromAxisAngle(
        rotateAngle,
        angleYCameraDirection + directionOffset
      );
      model.quaternion.rotateTowards(rotateQuarternion, 0.2);

      // Calculate direction
      camera.getWorldDirection(walkDirection);
      walkDirection.y = 0;
      walkDirection.normalize();
      walkDirection.applyAxisAngle(rotateAngle, directionOffset);

      // run/walk playerVelocity
      const runVelocity = 5;
      const walkVelocity = 2;
      const velocity = currentAction === "Run" ? runVelocity : walkVelocity;

      // move model & camera
      const moveX = walkDirection.x * velocity * delta;
      const moveZ = walkDirection.z * velocity * delta;
      model.position.x += moveX;
      model.position.z += moveZ;
      updateCameraTarget(moveX, moveZ);
    }
  };

  const animate = (scene) => {
    const camera = _camera.current;
    const renderer = _renderer.current;
    if (camera && renderer) {
      renderer.render(scene, camera);
    }

    const player = _player.current;
    if (player) {
      const previousTime = _previousTime.current;
      const elapsedTime = _clock.current.getElapsedTime();
      _previousTime.current = elapsedTime;
      const deltaTime = elapsedTime - previousTime;
      playerUpdateHandler(deltaTime);
    }

    window.requestAnimationFrame(() => animate(scene));
  };

  const renderModal = () => {
    // initiating clock for update
    _clock.current = new THREE.Clock();

    createScene();
    createCamera();
    createRenderer();
    createAxesHelper();
    createLoadingManager();
    createLights();
    loadEnvironment();
    createControl();
    createPlayer();

    animate(_scene.current);
  };

  const keyDownHandler = (event) => {
    const key = event.key.toLowerCase();
    if (key in _keysPressed.current) {
      _keysPressed.current[event.key.toLowerCase()] = true;
    }
  };

  const keyUpHandler = (event) => {
    const key = event.key.toLowerCase();
    if (key in _keysPressed.current) {
      _keysPressed.current[event.key.toLowerCase()] = false;
    }
  };

  const onResize = () => {
    const camera = _camera.current,
      renderer = _renderer.current;
    if (_camera && _renderer) {
      // update sizes
      SIZES.width = window.innerWidth;
      SIZES.height = window.innerHeight;

      //   update camera
      camera.aspect = SIZES.width / SIZES.height;
      camera.updateProjectionMatrix();

      //   update renderer
      renderer.setSize(SIZES.width, SIZES.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  };

  // ------------
  // * UseEffects
  // ------------
  useEffect(() => {
    renderModal();
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("keydown", keyDownHandler);
      window.removeEventListener("keyup", keyUpHandler);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="scene">
      <canvas className="canvas" />
      {loading && <p className="loading">Loading... {loadingPercentage}</p>}
    </div>
  );
};
