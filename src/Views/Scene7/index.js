import {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import "./index.scss";
import * as CANNON from 'cannon-es'
import GUI from 'lil-gui';
import HitSound from '../../assets/sounds/hit.mp3';
import VenusTex from '../../assets/textures/venusmap.jpg'
import VenusBumpTex from '../../assets/textures/venusbump.jpg'
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";

const SIZES = {width: window.innerWidth, height: window.innerHeight};

export const Scene7 = () => {
    const instructionDiv = useRef(document.querySelector('.instruction'))
    const clock = useRef(new THREE.Clock())
    const camera = useRef(new THREE.PerspectiveCamera());
    const renderer = useRef(null);
    const scene = useRef(null);
    const playerControls = useRef({
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
    });
    const bombSpecs = useRef({
        power: 30, size: 0.3
    });
    const laserGun = useRef(null)
    const world = useRef(null);
    const bombMaterial = useRef(new THREE.MeshStandardMaterial());
    const envMapTexture = useRef(null);
    const objectsToUpdate = useRef([]);
    const sphere = useRef(new THREE.Mesh());
    const previousElapsedTime = useRef(0);
    const orbitControl = useRef(null);
    const mousePointer = useRef(new THREE.Vector2());
    const raycaster = useRef(new THREE.Raycaster());
    const _canvas = useRef(null);
    const _plane = useRef(null);
    const currentIntersect = useRef(null);
    const [activateMachineGun, setActiveMachineGun] = useState(false)
    const _gui = useRef(null);
    const _sphereBody = useRef(new CANNON.Body());
    const _sphereMesh = useRef(new THREE.Mesh());
    const hitSound = useRef(new Audio(HitSound));
    const vec3 = useRef(new THREE.Vector3());
    // const velocity = useRef(new CANNON.Vec3())
    const fireInterval = useRef(1000);

    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());

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
        instructionDiv.current = document.querySelector('.instruction');

        // Handing Resize
        window.addEventListener("resize", onResize);
        window.addEventListener("click", onPointClick);
        window.addEventListener("mousemove", onPointMove);
        document.addEventListener('keydown', onKeyDown,);
        document.addEventListener('keyup', onKeyUp,);

        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("click", onPointClick);
            window.removeEventListener("mousemove", onPointMove);
            document.removeEventListener('keydown', onKeyDown,);
            document.removeEventListener('keyup', onKeyUp,);

        };
    }, []);

    function onKeyDown(event) {
        switch (event.keyCode) {
            case 38: /*up*/
            case 87: /*W*/
            case 90: /*Z*/
                playerControls.current.moveForward = true;
                break;

            case 40: /*down*/
            case 83: /*S*/
                playerControls.current.moveBackward = true;
                break;

            case 37: /*left*/
            case 65: /*A*/
            case 81: /*Q*/
                playerControls.current.moveLeft = true;
                break;

            case 39: /*right*/
            case 68: /*D*/
                playerControls.current.moveRight = true;
                break;

        }

    }

    function onKeyUp(event) {

        switch (event.keyCode) {
            case 38: /*up*/
            case 87: /*W*/
            case 90: /*Z*/
                playerControls.current.moveForward = false;
                break;

            case 40: /*down*/
            case 83: /*S*/
                playerControls.current.moveBackward = false;
                break;

            case 37: /*left*/
            case 65: /*A*/
            case 81: /*Q*/
                playerControls.current.moveLeft = false;
                break;

            case 39: /*right*/
            case 68: /*D*/
                playerControls.current.moveRight = false;
                break;

        }

    };
    const onPointMove = (event) => {
        // camera.current.getWorldDirection(vec3.current);
        // calculate pointer position in normalized device coordinates
        mousePointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        //gun movement
        raycaster.current.setFromCamera(mousePointer.current, camera.current);//set raycaster
    }

    const onPointClick = (event) => {
        if (event.path?.[0] !== _canvas.current) return;
        if (currentIntersect.current) {
            let body = objectsToUpdate.current.filter(item => item.mesh.uuid === currentIntersect.current?.object?.uuid)?.[0]?.body;
            // body.applyLocalForce(
            //     new CANNON.Vec3(
            //         Math.random() * 100 + 40,
            //         Math.random() * 100 + 30, Math.random() * 100 + 60),
            //     new CANNON.Vec3(currentIntersect.current.point.x, currentIntersect.current.point.y, currentIntersect.current.point.z)
            // );
        }
    }

    const renderModel = () => {
        const _scene = new THREE.Scene();
        scene.current = _scene;
        const gui = new GUI();
        _gui.current = gui;

        const fog = new THREE.Fog('#030303', 80, 180);
        scene.current.fog = fog

        const textureLoader = new THREE.TextureLoader();
        bombMaterial.current = new THREE.MeshStandardMaterial({
            roughness: 0.4, metalness: 0.5, map: textureLoader.load(VenusTex), bumpMap: textureLoader.load(VenusBumpTex)
        });


        /**
         * Floor
         */
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({
            color: '#777777', metalness: 0.3, roughness: 0.4,
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
        directionalLight.position.set(30, 40, -50)
        _scene.add(directionalLight)


        /**
         * Models
         */
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("/models/Abandonded room.glb", (gltf) => {
            const model = gltf.scene.children[0];
            const objects = [...gltf.scene.children];
            console.log(objects)
            // if (model) {
            //     for (const object of objects) {
            //         object.position.set(-2, 0, 4);
            //         object.castShadow = true;
            //         if (object?.name.indexOf('Rooms') !== -1) {
            //             console.log(object)
            //             const shape = new CANNON.Box(new CANNON.Vec3(5, 5, 5));
            //             const body = new CANNON.Body({mass: 0});
            //             body.addShape(shape);
            //             body.position.copy(object.position);
            //             _world.addBody(body)
            //         }
            //         _scene.add(object);
            //     }
            //
            //
            //     const modelShape = new CANNON.Box(new CANNON.Vec3(10, 10, 20));
            //     const modelBody = new CANNON.Body({mass: 0});
            //     modelBody.addShape(modelShape);
            //     modelBody.position.set(-20, 100, 4);
            //     _world.addBody(modelBody);
            // objectsToUpdate.current.push({
            //     mesh: model,
            //     body: modelBody
            // })
            // }
        });


        /**
         * Physics world
         * */
        const _world = new CANNON.World();
        _world.broadphase = new CANNON.NaiveBroadphase();
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


        /*var bunnyBody = new CANNON.Body({
            mass: 1
        });
        for (var i = 0; i < BUNNY.length; i++) {

            var rawVerts = BUNNY[i].verts;
            var rawFaces = BUNNY[i].faces;
            var rawOffset = BUNNY[i].offset;

            var verts = [], faces = [], offset;

            // Get vertices
            for (var j = 0; j < rawVerts.length; j += 3) {
                verts.push(new CANNON.Vec3(rawVerts[j],
                    rawVerts[j + 1],
                    rawVerts[j + 2]));
            }

            // Get faces
            for (var j = 0; j < rawFaces.length; j += 3) {
                faces.push([rawFaces[j], rawFaces[j + 1], rawFaces[j + 2]]);
            }

            // Get offset
            offset = new CANNON.Vec3(rawOffset[0], rawOffset[1], rawOffset[2]);

            // Construct polyhedron
            var bunnyPart = new CANNON.ConvexPolyhedron({vertices: verts, faces});

            // Add to compound
            bunnyBody.addShape(bunnyPart, offset);
        }
        // Create body
        bunnyBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        var z180 = new CANNON.Quaternion();
        z180.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI);
        bunnyBody.quaternion = z180.mult(bunnyBody.quaternion);
        // _world.addBody(bunnyBody);
*/

        const mesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32,), new THREE.MeshNormalMaterial());
        mesh.position.y = 10
        _scene.add(mesh)
        // demo.addVisual(bunnyBody);


        // Create a sphere
        const sphereMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3, 32, 32), new THREE.MeshNormalMaterial())
        sphereMesh.position.set(0, 1, 10);
        sphereMesh.castShadow = true;
        _sphereMesh.current = sphereMesh;
        _scene.add(sphereMesh);

        const mass = 40, radius = 1.3;
        const sphereShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        const sphereBody = new CANNON.Body({mass: mass});
        sphereBody.addShape(sphereShape);
        sphereBody.position.set(0, 1, 13);
        _world.addBody(sphereBody);
        _sphereBody.current = sphereBody;

        objectsToUpdate.current.push({
            mesh: sphereMesh,
            body: sphereBody
        })


        //create a block
        const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 20, 32, 32, 32),
            new THREE.MeshBasicMaterial({color: 'green'}))
        boxMesh.position.set(3, 1, 3);
        boxMesh.castShadow = true;
        // _scene.add(boxMesh);

        const boxShape = new CANNON.Box(new CANNON.Vec3(2, 10, 20));
        const boxBody = new CANNON.Body({mass: 0});
        boxBody.addShape(boxShape);
        boxBody.position.set(3, 1, 3);
        _world.addBody(boxBody);

        objectsToUpdate.current.push({
            mesh: boxMesh,
            body: boxBody
        })


        /**
         * Camera
         */
        const _camera = new THREE.PerspectiveCamera(75, SIZES.width / SIZES.height, 0.1, 1000)
        _camera.position.set(0, 6, 20);
        _camera.lookAt(_scene.position)
        _scene.add(_camera)

        camera.current = _camera;

        /**
         * Gun
         * */
            // const _gun = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3, 32, 32, 32), new THREE.MeshStandardMaterial({
            //     roughness: 0.3, metalness: 0.4, color: 'red',
            // }));

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
        _renderer.setClearColor('#030303')
        _renderer.render(_scene, _camera);
        renderer.current = _renderer;
        // controls
        orbitControl.current = new PointerLockControls(_camera, _renderer.domElement);
        _scene.add(orbitControl.current.getObject());
        canvas.addEventListener('click', function () {
            orbitControl.current.lock()
        })
        orbitControl.current.addEventListener('lock', function () {
            console.log('ACTIVATED')
        });

        orbitControl.current.addEventListener('unlock', function () {
            console.log('De-ACTIVATED')
        });

        tick(_scene);
    };
    const tick = (scene) => {
        let elapsedTime = clock.current.getElapsedTime();
        const _camera = camera.current, _renderer = renderer.current;


        //update physics world
        const deltaTime = elapsedTime - previousElapsedTime.current;
        previousElapsedTime.current = elapsedTime;

        let scalingFactor = 0.3;

        let moveX = Number(playerControls.current.moveRight) - Number(playerControls.current.moveLeft);
        let moveZ = Number(playerControls.current.moveBackward) - Number(playerControls.current.moveForward);
        let moveY = 0;

        // _camera.getWorldDirection(direction.current);
        // let {x, y, z} = direction.current
        let resultantImpulse = new CANNON.Vec3(moveX, moveY, moveZ);
        // _sphereBody.current.velocity.addScaledVector(scalingFactor, resultantImpulse, _sphereBody.current.velocity)


        let delta = clock.current.getDelta();
        let moveDistance = 1; // n pixels per second

        // move forwards, backwards, left, or right
        if (playerControls.current.moveForward) {
            _sphereBody.current.velocity.z += moveDistance;
        }
        if (playerControls.current.moveBackward) {
            _sphereBody.current.velocity.z -= moveDistance;
        }
        if (playerControls.current.moveLeft) {
            _sphereBody.current.velocity.x += moveDistance;
        }
        if (playerControls.current.moveRight) {
            _sphereBody.current.velocity.x -= moveDistance;
        }


        // orbitControl.current.moveRight(_sphereBody.current.velocity.x * 0.04);
        // orbitControl.current.moveForward(_sphereBody.current.velocity.z * 0.04);

        //make a TPS Camera
        // const cameraOffset = new THREE.Vector3(0.0, 3.0, 5.0); // NOTE Constant offset between the camera and the target
        // const objectPosition = new THREE.Vector3();
        // _sphereMesh.current.getWorldPosition(objectPosition);
        // _camera.position.copy(objectPosition.clone()).add(cameraOffset);

        // let relativeCameraOffset = new THREE.Vector3(0, 2, 3);
        //
        // let cameraOffset = relativeCameraOffset.applyMatrix4(_sphereMesh.current.matrixWorld);
        //
        // _camera.position.x = cameraOffset.x;
        // _camera.position.y = cameraOffset.y;
        // _camera.position.z = cameraOffset.z;
        // _camera.lookAt(_sphereMesh.current.position);
        //
        objectsToUpdate.current.forEach(object => {
            object.mesh.position.copy(object.body.position);
            // object.mesh.quaternion.copy(object.body.quaternion);
        })
        world.current.step(1 / 60, deltaTime, 3);
        _renderer.render(scene, _camera);
        window.requestAnimationFrame(() => tick(scene));
    };
    return (<div className={"scene"}>
        <canvas className={"canvas"}/>
    </div>);
};

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}
