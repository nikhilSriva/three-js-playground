import {useEffect, useRef} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import "./index.scss";
import CANNON from 'cannon'
import GUI from 'lil-gui';
import Icon from '../../assets/bomb.png'
import HitSound from '../../assets/sounds/hit.mp3';

const SIZES = {width: window.innerWidth, height: window.innerHeight};

export const Scene6 = () => {
    const clock = useRef(new THREE.Clock())
    const camera = useRef(null);
    const renderer = useRef(null);
    const scene = useRef(null);
    const world = useRef(null);
    const envMapTexture = useRef(null);
    const objectsToUpdate = useRef([]);
    const sphere = useRef(new THREE.Mesh());
    const previousElapsedTime = useRef(0);
    const orbitControl = useRef(null);
    const mousePointer = useRef(new THREE.Vector2());
    const raycaster = useRef(null);
    const _canvas = useRef(null);
    const currentIntersect = useRef(null);
    const vec3 = useRef(new THREE.Vector3());
    const hitSound = useRef(new Audio(HitSound));
    const onResize = () => {
        const _camera = camera.current, _renderer = renderer.current;
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
        window.addEventListener("click", onPointClick);
        window.addEventListener("mousemove", onPointMove);


        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("click", onPointClick);
            window.removeEventListener("mousemove", onPointMove);


        };
    }, []);

    const onPointMove = (event) => {
        // calculate pointer position in normalized device coordinates
        mousePointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePointer.current.y = -(event.clientY / window.innerHeight * 2 - 1);
    }
    const onPointClick = (event) => {
        if (currentIntersect.current) {
            let body = objectsToUpdate.current.filter(item => item.mesh.uuid === currentIntersect.current?.object?.uuid)?.[0]?.body;
            console.log(currentIntersect.current.point)
            body.applyLocalForce(
                new CANNON.Vec3(
                    Math.random() * 100 + 40,
                    Math.random() * 100 + 30, Math.random() * 100 + 60),
                new CANNON.Vec3(currentIntersect.current.point.x, currentIntersect.current.point.y, currentIntersect.current.point.z)
            );
        }
    }

    const renderModel = () => {
        const _scene = new THREE.Scene();
        scene.current = _scene;
        const gui = new GUI();

        gui.add({
            createSphere: () => createSphere((Math.random() * 0.5) + 0.13, {
                x: (Math.random() - 0.5) * 3, y: (Math.random() * 4) + 2, z: (Math.random() - 0.5) * 3
            }),
        }, 'createSphere');
        gui.add({
            createBox: () => createBox(Math.random() * 0.89, Math.random() * 1.3, Math.random() * 0.9, {
                x: (Math.random() - 0.5) * 3, y: (Math.random() * 4) + 2, z: (Math.random() - 0.5) * 3
            }),
        }, 'createBox');

        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const _envMapTexture = cubeTextureLoader.load(['../../assets/textures/envTex/px.png', '../../assets/textures/envTex/nx.png', '../../assets/textures/envTex/py.png', '../../assets/textures/envTex/ny.png', '../../assets/textures/envTex/pz.png', '../../assets/textures/envTex/nz.png',])
        envMapTexture.current = _envMapTexture
        /**
         * Floor
         */
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({
            color: '#777777', metalness: 0.3, roughness: 0.4, envMap: _envMapTexture, envMapIntensity: 0.5
        }))
        floor.receiveShadow = true
        floor.rotation.x = -Math.PI * 0.5
        _scene.add(floor)

        /**
         * Lights
         */
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
        _scene.add(ambientLight)

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
        directionalLight.castShadow = true
        directionalLight.shadow.mapSize.set(1024, 1024)
        // directionalLight.shadow.camera.far = 15
        // directionalLight.shadow.camera.left = -7
        // directionalLight.shadow.camera.top = 7
        // directionalLight.shadow.camera.right = 7
        // directionalLight.shadow.camera.bottom = -7
        directionalLight.position.set(30, 40, -50)
        _scene.add(directionalLight)

        /**
         * Physics world
         * */
        const _world = new CANNON.World();
        _world.gravity.set(0, -9.82, 0);
        world.current = _world;

        //physics material
        const defaultMaterial = new CANNON.Material('concrete');

        const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
            friction: 0.4, restitution: 0.7
        })
        _world.addContactMaterial(defaultContactMaterial)
        _world.defaultContactMaterial = defaultContactMaterial


        //physics floor
        const floorShape = new CANNON.Plane();
        const _floorBody = new CANNON.Body({
            mass: 0, shape: floorShape,
        });
        _floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI * 0.5)
        _world.addBody(_floorBody);


        /**
         * Camera
         */
        const _camera = new THREE.PerspectiveCamera(75, SIZES.width / SIZES.height, 0.1, 100)
        _camera.position.set(-3, 6, 6)
        _scene.add(_camera)

        camera.current = _camera;


        const canvas = document.querySelector(".canvas");
        _canvas.current = canvas;
        /**
         * Raycaster
         * */
        raycaster.current = new THREE.Raycaster();


        //renderer
        const _renderer = new THREE.WebGLRenderer({canvas});
        _renderer.shadowMap.enabled = true
        _renderer.shadowMap.type = THREE.PCFSoftShadowMap
        _renderer.setSize(SIZES.width, SIZES.height);
        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.render(_scene, _camera);
        renderer.current = _renderer;
        // controls
        orbitControl.current = new OrbitControls(_camera, canvas);
        orbitControl.current.enableDamping = true;
        tick(_scene);
    };

    const createSphere = (radius, position) => {
        const _sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshStandardMaterial({
            roughness: 0.4, metalness: 0.5, envMap: envMapTexture.current, envMapIntensity: 0.5, color: 'red'
        }));
        _sphere.castShadow = true
        _sphere.position.copy(position)
        scene.current.add(_sphere);
        sphere.current = _sphere;


        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: radius, position: new CANNON.Vec3(0, 3, 0), shape, friction: 2
        });
        body.position.copy(position);
        world.current.addBody(body)

        objectsToUpdate.current.push({
            mesh: _sphere, body
        })
    }
    const createBox = (width, height, depth, position) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth, 32, 32, 32),
            new THREE.MeshStandardMaterial({
                roughness: 0.3,
                metalness: 0.4,
                envMap: envMapTexture.current,
                envMapIntensity: 0.5,
                color: 'black',
            }));
        box.castShadow = true
        box.position.copy(position)
        scene.current.add(box);


        const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5));
        const body = new CANNON.Body({
            mass: 1, shape,
        });
        body.position.copy(position);
        body.addEventListener('collide', () => hitSound.current.play())
        world.current.addBody(body)

        objectsToUpdate.current.push({
            mesh: box, body
        })
    }
    const tick = (scene) => {
        let elapsedTime = clock.current.getElapsedTime();
        const _camera = camera.current, _renderer = renderer.current;
        orbitControl.current?.update(0);
        _renderer.render(scene, _camera);

        raycaster.current.setFromCamera(mousePointer.current, camera.current)
        const intersects = raycaster.current.intersectObjects(objectsToUpdate.current.map(item => item.mesh));
        if (intersects.length) {
            if (!currentIntersect.current) {
                _canvas.current.style.cursor = `url(${Icon}), auto`
            }
            currentIntersect.current = intersects[0];
        } else {
            if (currentIntersect.current) {
                _canvas.current.style.cursor = 'default'
            }
            currentIntersect.current = null;
        }
        //update physics world
        const deltaTime = elapsedTime - previousElapsedTime.current;
        previousElapsedTime.current = elapsedTime;
        world.current.step(1 / 60, deltaTime, 3);

        objectsToUpdate.current.forEach(object => {
            object.mesh.position.copy(object.body.position)
            object.mesh.quaternion.copy(object.body.quaternion)
        })
        // sphere.current.position.copy(physicsSphere.current.position)
        window.requestAnimationFrame(() => tick(scene));
    };
    return (<div className={"scene"}>
        <canvas className={"canvas"}/>
    </div>);
};
