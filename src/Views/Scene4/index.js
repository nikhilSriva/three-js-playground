import {useEffect, useRef} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import "./index.scss";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";
import gsap from 'gsap'
import Stats from 'three/examples/jsm/libs/stats.module'
import {OBB} from 'three/examples/jsm/math/OBB'

const SIZES = {width: window.innerWidth, height: window.innerHeight};

export const Scene4 = () => {
    const MOVE_FACTOR = useRef(400.0);
    const clock = useRef(new THREE.Clock());
    const sphere = useRef(new THREE.Mesh());
    const world = useRef(null);
    const stats = useRef(null);
    const camera = useRef(null);
    const _scene = useRef(new THREE.Scene());
    const renderer = useRef(null);
    const controls = useRef(null);
    const raycaster = useRef(new THREE.Raycaster());
    const boundary = useRef(new THREE.Box3())
    const mousePointer = useRef(new THREE.Vector2());
    const limit = useRef(new THREE.Vector3());
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const pointLight = useRef(new THREE.PointLight());
    const person = useRef(new THREE.Mesh());
    const moveForward = useRef(false);
    const moveBackward = useRef(false);
    const moveLeft = useRef(false);
    const moveRight = useRef(false);
    const canJump = useRef(false);
    const prevTime = useRef(performance.now());
    const walls = useRef([]);
    const timeline = useRef(gsap.timeline());
    const cameraSphere = useRef(null);
    const cameraPhysicsSphere = useRef(null);

    const onPointMove = (event) => {
        // camera.current.getWorldDirection(vec3.current);
        // calculate pointer position in normalized device coordinates
        mousePointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

    }

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
        window.addEventListener("mousemove", onPointMove);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);


        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("mousemove", onPointMove);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);


        };
    }, []);

    const renderModel = () => {
        const scene = new THREE.Scene();
        _scene.current = scene
        /**
         * Models
         */
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("/models/Abandonded room.glb", (gltf) => {
            const model = gltf.scene;
            if (model) {
                const objects = [...gltf.scene.children];
                let arr = []
                for (const object of objects) {
                    console.log(object.name)

                    if (object?.name.indexOf('Paper') !== -1) {
                        object.geometry.userData.obb = new OBB().fromBox3(object.geometry.boundingBox)
                        object.userData.obb = new OBB()
                        // object.visible = false
                        arr.push(object);
                    }
                    scene.add(object);
                }
                boundary.current = new THREE.Box3().setFromObject(scene);
                walls.current = arr
            }
        });
        const geometry = new THREE.BoxGeometry(0.2, 0.5, 0.1);
        geometry.computeBoundingBox();
        const _person = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            visible: false
        }));

        _person.geometry.userData.obb = new OBB().fromBox3(_person.geometry.boundingBox)
        _person.userData.obb = new OBB()
        scene.add(_person);

        console.log('>>>', geometry)
        console.log('obj>>>', _person);
        person.current = _person

        //camera
        const _camera = new THREE.PerspectiveCamera(70, SIZES.width / SIZES.height);
        _camera.position.set(0.1, 0.7, 4);
        _camera.lookAt(0, 0, 0);
        // _camera.userData.obb = new OBB().fromBox3(_camera.boundingBox)

        scene.add(_camera);
        camera.current = _camera;
        const canvas = document.querySelector(".canvas");

        /**
         * Raycaster
         * */
        raycaster.current = new THREE.Raycaster();

        /**
         * Point Light
         * */
        const _pointLight = new THREE.PointLight(0xff0000, 6, 20);
        _pointLight.castShadow = true
        scene.add(_pointLight);
        pointLight.current = _pointLight
        const timeline = gsap.timeline();

        timeline
            .to(pointLight.current, {
                duration: 1, intensity: 10,
            })
            .to(pointLight.current, {
                duration: 1, intensity: 6,
            }).repeat(-1)
        //renderer
        const _renderer = new THREE.WebGLRenderer({canvas});
        _renderer.setSize(SIZES.width, SIZES.height);
        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.render(scene, _camera);
        renderer.current = _renderer;
        // controls
        controls.current = new PointerLockControls(camera.current, renderer.current.domElement);
        canvas.addEventListener('click', function () {
            controls.current.lock()
        })
        controls.current.addEventListener('lock', function () {
            console.log('ACTIVATED')
        });

        controls.current.addEventListener('unlock', function () {
            console.log('De-ACTIVATED')
        });

        scene.add(controls.current.getObject());
        console.log(controls.current)
        const _stats = Stats();
        stats.current = _stats;
        document.body.appendChild(_stats.dom);
        tick(scene);
    };
    const onKeyDown = function (event) {
        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward.current = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft.current = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward.current = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight.current = true;
                break;
            case 'Space':
                canJump.current = true;
                break;
            default:
                break;
        }

    };

    const onKeyUp = function (event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward.current = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft.current = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward.current = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight.current = false;
                break;
            case 'Space':
                canJump.current = false;
                break;
            default:
                break;

        }

    };
    const tick = (scene) => {
        const _camera = camera.current, _renderer = renderer.current;
        handleMovement();
        person.current.position.copy(_camera.position)
        // walls.current.forEach(item => {
        //     person.current.userData.obb.copy(person.current.geometry.userData.obb)
        //     item.userData.obb.copy(item.geometry.userData.obb)
        //     person.current.userData.obb.applyMatrix4(person.current.matrixWorld)
        //     item.userData.obb.applyMatrix4(item.matrixWorld);
        //     if (person.current.userData.obb.intersectsOBB(item.userData.obb)) {
        //         person.current.material.color.set(0xff0000)
        //     } else {
        //         person.current.material.color.set(0x00ff00)
        //     }
        // })
        // raycaster.current.setFromCamera(mousePointer.current, camera.current);
        // const intersects = raycaster.current.intersectObjects(scene.children);
        // console.log(intersects)
        // if (intersects.length) {
        // person.current.position.x = Math.max(1, intersects?.[0]?.point.x)
        // }
        // raycaster.current.set(person.current.position, person.current.position);
        // const intersects = raycaster.current.intersectObjects(scene.children);
        // if (intersects.length) {
        //     intersects.forEach(item => {
        //         console.log(item.object.name)
        //         if (item.object.name === 'Rooms') {
        //             console.log('Colliding', limit.current);
        //             // if (!limit.current.x) {
        //             limit.current.copy(item.point)
        //             // }
        //             person.current.position.set(limit.current.x - 0.1, limit.current.y, limit.current.z);
        //             // limit.current.copy(item.point)
        //         } else {
        //             console.log('Not Colliding')
        //             // controls.current.movementSpeed = 0;
        //         }
        //     })
        // } else {
        //
        // }
        // controls.current.update(clock.current.getDelta());
        _renderer.render(scene, _camera);
        stats.current?.update();
        window.requestAnimationFrame(() => tick(scene));
    };

    const handleMovement = () => {
        const time = performance.now();
        if (controls.current.isLocked === true) {
            raycaster.current.ray.origin.copy(controls.current.getObject().position);
            // raycaster.ray.origin.y -= 10;
            let controlCoords = controls.current.getObject().position;


            const intersections = raycaster.current.intersectObjects(walls.current, false);

            const delta = (time - prevTime.current) / 1000;
            // console.log(intersections.map(item => item.object.name))
            if (intersections?.length) {
                let item = intersections?.[intersections?.length - 1]?.object;
                person.current.userData.obb.copy(person.current.geometry.userData.obb)
                item.userData.obb.copy(item.geometry.userData.obb)
                person.current.userData.obb.applyMatrix4(person.current.matrixWorld)
                item.userData.obb.applyMatrix4(item.matrixWorld);
                console.log(direction.current)
                if (person.current.userData.obb.intersectsOBB(item.userData.obb)) {
                    console.log('intersecting', item.name)
                } else {
                    console.log('not intersecting', item.name)
                }
            } else {
            }
            // //check of boundary collision
            // if (controlCoords.z > boundary.current.max.z) {
            //     moveBackward.current = false
            // }
            // if (controlCoords.z < boundary.current.min.z) {
            //     moveForward.current = false
            // }
            // if (controlCoords.x < -0.7) {
            //     moveLeft.current = false
            // }
            // if (controlCoords.x > 0.7) {
            //     moveRight.current = false
            // }
            velocity.current.x -= velocity.current.x * 10.0 * delta;
            velocity.current.z -= velocity.current.z * 10.0 * delta;

            velocity.current.y -= 9.8 * 100.0 * delta; // 100.0 = mass
            console.log(direction.current)
            direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
            direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
            direction.current.normalize(); // this ensures consistent movements in all directions

            if (moveForward.current || moveBackward.current) velocity.current.z -= direction.current.z * MOVE_FACTOR.current * delta;
            if (moveLeft.current || moveRight.current) velocity.current.x -= direction.current.x * MOVE_FACTOR.current * delta;

            controls.current.moveRight(-velocity.current.x * delta * 0.04);
            controls.current.moveForward(-velocity.current.z * delta * 0.04);

        }

        prevTime.current = time;
    }
    return (<div className={"scene"}>
        <canvas className={"canvas"}/>
    </div>);
};
