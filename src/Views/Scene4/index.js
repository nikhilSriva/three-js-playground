import {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import "./index.scss";
import gsap from 'gsap'
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";
import Stats from 'three/examples/jsm/libs/stats.module'
import DomeModel from '../../assets/models/Dome.glb'
import SoldierModel from '../../assets/models/Soldier.glb'
import * as CANNON from "cannon-es";
import CannonDebugger from 'cannon-es-debugger'

import domeHeight from "../../assets/textures/grill-texture/Metal_Grill_024_height.png";
import domeAoMap from "../../assets/textures/grill-texture/Metal_Grill_024_ambientOcclusion.jpg";
import domeNormalMap from "../../assets/textures/grill-texture/Metal_Grill_024_normal.jpg";
import domeMetalMap from "../../assets/textures/grill-texture/Metal_Grill_024_metallic.jpg";
import domeRoughMap from "../../assets/textures/grill-texture/Metal_Grill_024_roughness.jpg";
import domeBase from "../../assets/textures/grill-texture/Metal_Grill_024_basecolor.jpg";

import floorBase from "../../assets/textures/scifi-texture/Sci-fi_Metal_Plate_003_basecolor.jpg";
import floorAoMap from "../../assets/textures/scifi-texture/Sci-fi_Metal_Plate_003_ambientOcclusion.jpg";
import floorMetalMap from "../../assets/textures/scifi-texture/Sci-fi_Metal_Plate_003_metallic.jpg";
import floorRoughMap from "../../assets/textures/scifi-texture/Sci-fi_Metal_Plate_003_roughness.jpg";
import floorNormalMap from "../../assets/textures/scifi-texture/Sci-fi_Metal_Plate_003_normal.jpg";

const SIZES = {width: window.innerWidth, height: window.innerHeight};
const axisY = new CANNON.Vec3(0, 1, 0);
const moveDistance = 20;

export const Scene4 = () => {
    const clock = useRef(new THREE.Clock());
    const world = useRef(null);
    const stats = useRef(null);
    const camera = useRef(new THREE.PerspectiveCamera());
    const _scene = useRef(new THREE.Scene());
    const renderer = useRef(null);
    const controls = useRef(null);
    const raycaster = useRef(new THREE.Raycaster());
    const boundary = useRef(new THREE.Box3())
    const mousePointer = useRef(new THREE.Vector2());
    const direction = useRef(new THREE.Vector3());
    const pointLight = useRef(new THREE.PointLight());
    const person = useRef(new THREE.Mesh());
    const moveForward = useRef(false);
    const moveBackward = useRef(false);
    const crouch = useRef(false);
    const moveLeft = useRef(false);
    const moveRight = useRef(false);
    const canJump = useRef(false);
    const isCurrentlyJumping = useRef(false)
    const [loading, setLoading] = useState(false);
    const gltfLoader = useRef(new GLTFLoader());

    const prevTime = useRef(performance.now());
    const prevTime1 = useRef(performance.now());
    const walls = useRef([]);
    const showPiece = useRef(new THREE.Mesh())
    const stairs = useRef([])
    const objectsToUpdate = useRef([])
    const personBody = useRef(new CANNON.Body());
    const staticCollideMesh = useRef([]);
    const animationMixer = useRef(null);
    const cannonDebugger = useRef(new CannonDebugger())
    const modelAnimations = useRef({});
    const currentAction = useRef('');
    const rotationQuaternion = useRef(new CANNON.Quaternion());
    const localVelocity = useRef(new CANNON.Vec3());
    const prevPositions = useRef([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);

    const onPointMove = (event) => {
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
    const loadColliderModel = () => {
        const textureLoader = new THREE.TextureLoader();
        gltfLoader.current.load(DomeModel, (gltf) => {
            const model = gltf.scene;
            if (model) {
                const objects = [...gltf.scene.children];
                let arr = [];
                let mesh = new THREE.Mesh()
                for (let object of objects) {
                    let targetFound = false;

                    if (object?.name?.indexOf('Showpiece') !== -1) {
                        showPiece.current = object;
                    }
                    if (object?.name === 'Stand') {
                        stairs.current.push(object);
                        // object.visible=false;
                        let mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshNormalMaterial());
                        mesh.position.y = 0.4
                        object = mesh
                    }
                    if (['Stairs_part_2'].includes(object?.name)) {
                        stairs.current.push(object)
                    }

                    if (object.isMesh) {
                        if (object?.name?.indexOf('Male') !== -1) {
                            object.material = new THREE.MeshNormalMaterial()
                            let _pointLight = new THREE.PointLight(0x707070, 0.1,);
                            _pointLight.castShadow = true
                            object.add(_pointLight);
                        }
                        if (object?.name?.indexOf('Dome') !== -1) {
                            const baseMap = textureLoader.load(domeBase);
                            const heightMap = textureLoader.load(domeHeight);
                            const aoMap = textureLoader.load(domeAoMap);
                            const metalnessMap = textureLoader.load(domeMetalMap);
                            const roughnessMap = textureLoader.load(domeRoughMap);
                            const normalMap = textureLoader.load(domeNormalMap);

                            baseMap.repeat.set(4, 4)
                            heightMap.repeat.set(4, 4)
                            aoMap.repeat.set(4, 4)
                            metalnessMap.repeat.set(4, 4)
                            roughnessMap.repeat.set(4, 4)
                            normalMap.repeat.set(4, 4)

                            baseMap.wrapS = THREE.RepeatWrapping
                            heightMap.wrapS = THREE.RepeatWrapping
                            aoMap.wrapS = THREE.RepeatWrapping
                            metalnessMap.wrapS = THREE.RepeatWrapping
                            roughnessMap.wrapS = THREE.RepeatWrapping
                            normalMap.wrapS = THREE.RepeatWrapping

                            baseMap.wrapT = THREE.RepeatWrapping
                            aoMap.wrapT = THREE.RepeatWrapping
                            metalnessMap.wrapT = THREE.RepeatWrapping
                            roughnessMap.wrapT = THREE.RepeatWrapping
                            heightMap.wrapT = THREE.RepeatWrapping
                            normalMap.wrapT = THREE.RepeatWrapping

                            object.material = new THREE.MeshStandardMaterial({
                                map: baseMap,
                                transparent: true, // bumpMap: heightMap,
                                // displacementMap: heightMap,
                                // displacementScale: 0.0001,
                                normalMap: normalMap,
                                metalnessMap: metalnessMap,
                                roughnessMap: roughnessMap,
                                aoMap: aoMap
                            })
                        }
                        object.layers.enable(1);
                        arr.push(object);
                    }
                    _scene.current.add(object);
                }
                boundary.current = new THREE.Box3().setFromObject(_scene.current);
                walls.current = arr
            }
        });
    }
    const loadPlayer = () => {

        gltfLoader.current.load(SoldierModel, (gltf) => {
            const model = gltf.scene;
            model.castShadow = true;
            // model.position.set(0, 0, 8)
            // model.BBox = new THREE.Box3().setFromObject(model);
            // helper
            // model.BBoxHelper = new THREE.BoxHelper(model, 0xff0000);
            // godzilla.current = model;
            // _scene.current.add(model.BBoxHelper);

            _scene.current.add(model);
            let mixer = new THREE.AnimationMixer(model);
            animationMixer.current = mixer;
            let backRun = null;
            gltf.animations.map(item => {
                if (item.name !== 'TPose') modelAnimations.current[item.name] = mixer.clipAction(item);
                if (item.name === 'Run') {
                    modelAnimations.current[item.name] = mixer.clipAction(item);
                    backRun = mixer.clipAction(item.clone());
                }
            })

            backRun.timeScale = -1;
            modelAnimations.current['BackRun'] = backRun;

            model.add(camera.current)

            // player cannon body
            person.current = model;
            // _scene.current.add(mesh);
            let body = new CANNON.Body({
                mass: 1,
                material: new CANNON.Material('slipperyMaterial'),
                shape: new CANNON.Sphere(0.06),
                linearDamping: 0.9,
                angularDamping: 1.0,
            });
            // body.addShape(shape);
            model.position.set(0, 3, 5)
            body.position.set(0, 3, 5)
            personBody.current = body;
            world.current.addBody(body);

            objectsToUpdate.current.push({
                mesh: model, body
            })


        }, () => {
        }, (err) => {
            console.log(err)
        })
    }
    const renderModel = () => {
        const scene = new THREE.Scene();
        _scene.current = scene;
        const manager = new THREE.LoadingManager();
        gltfLoader.current = new GLTFLoader(manager);
        const textureLoader = new THREE.TextureLoader(manager);

        manager.onStart = function () {
            console.log('Loading ßtarted!');
            setLoading(true);
        };
        manager.onLoad = function () {
            console.log('Loading complete!');
            setLoading(false);
        };
        loadColliderModel();
        /**
         * Physics world
         * */
        const _world = new CANNON.World();
        _world.gravity.set(0, -40.82, 0);
        world.current = _world;

        //physics material
        const defaultMaterial = new CANNON.Material('concrete');

        const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
            friction: 0.4, restitution: 0.4
        })
        _world.addContactMaterial(defaultContactMaterial)
        _world.defaultContactMaterial = defaultContactMaterial


        //physics floor
        const baseMap = textureLoader.load(floorBase);
        const aoMap = textureLoader.load(floorAoMap);
        const metalnessMap = textureLoader.load(floorMetalMap);
        const roughnessMap = textureLoader.load(floorRoughMap);
        const normalMap = textureLoader.load(floorNormalMap);

        baseMap.repeat.set(20, 20)
        aoMap.repeat.set(20, 20)
        metalnessMap.repeat.set(20, 20)
        roughnessMap.repeat.set(20, 20)
        normalMap.repeat.set(20, 20)

        baseMap.wrapS = THREE.RepeatWrapping
        aoMap.wrapS = THREE.RepeatWrapping
        metalnessMap.wrapS = THREE.RepeatWrapping
        roughnessMap.wrapS = THREE.RepeatWrapping
        normalMap.wrapS = THREE.RepeatWrapping

        baseMap.wrapT = THREE.RepeatWrapping
        aoMap.wrapT = THREE.RepeatWrapping
        metalnessMap.wrapT = THREE.RepeatWrapping
        roughnessMap.wrapT = THREE.RepeatWrapping
        normalMap.wrapT = THREE.RepeatWrapping


        const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({
            map: baseMap, normalMap: normalMap, metalnessMap: metalnessMap, roughnessMap: roughnessMap, aoMap: aoMap
        }))
        floor.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2))
        floor.receiveShadow = true;
        floor.position.y = 0.001
        floor.rotation.x = -Math.PI * 0.5
        _scene.current.add(floor)

        //physics floor
        // Physics ground
        const groundShape = new CANNON.Box(new CANNON.Vec3(200, 200, 0.0000001));
        let floorBody = new CANNON.Body({mass: 0});
        floorBody.addShape(groundShape);
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        _world.addBody(floorBody);

        let halfExtents = new CANNON.Vec3(2, 2.25, 2);
        let boxShape = new CANNON.Box(halfExtents);

        let boxGeometry = new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);
        let boxMaterial = new THREE.MeshNormalMaterial();

        let boxBody = new CANNON.Body({mass: 0});
        boxBody.addShape(boxShape);
        let boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);

        boxBody.position.set(15, 0, 0);
        boxMesh.position.set(15, 0, 0);

        world.current.addBody(boxBody);
        scene.add(boxMesh);


        /*const geometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
        geometry.computeBoundingBox();
        const _person = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: 'blue', visible: true
        }));
        _person.position.set(0, 0.1, 8)
        _person.BBoxHelper = new THREE.BoxHelper(_person, 0xff0000);
        _person.BBox = new THREE.Box3().setFromObject(_person);

        const shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.2, 0.1));
        const body = new CANNON.Body({
            mass: 2, shape,
        });
        body.position.copy(_person.position);
        world.current.addBody(body)*/

        cannonDebugger.current = new CannonDebugger(scene, world.current, {
            color: 'green'
        });

        //camera
        const _camera = new THREE.PerspectiveCamera(55, SIZES.width / SIZES.height);
        _camera.position.set(0, 0.5, 1.3);
        _camera.updateProjectionMatrix();

        // scene.add(_camera);
        camera.current = _camera;
        loadPlayer();
        const canvas = document.querySelector(".canvas");

        /**
         * Raycaster
         * */
        raycaster.current = new THREE.Raycaster();

        /**
         * Point Light
         * */
        const _pointLight = new THREE.PointLight(0x8f8f8f, 0.5,);
        _pointLight.castShadow = true
        _pointLight.position.set(0, 10, 1)
        scene.add(_pointLight);
        pointLight.current = _pointLight

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight)
        const timeline = gsap.timeline();

        // timeline
        //     .to(pointLight.current, {
        //         duration: 1, intensity: 0.5,
        //     })
        //     .to(pointLight.current, {
        //         duration: 1, intensity: 0.1,
        //     }).repeat(-1)
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

        // controls.current = new OrbitControls(_camera, _renderer.domElement);
        const _stats = Stats();
        stats.current = _stats;
        document.body.appendChild(_stats.dom);
        tick(scene);
    };

    const onKeyDown = function (event) {
        switch (event.code) {
            case "ShiftLeft":
                crouch.current = true;
                break;
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
                isCurrentlyJumping.current = true;
                break;
            default:
                break;
        }

    };

    const onKeyUp = function (event) {
        switch (event.code) {

            case "ShiftLeft":
                crouch.current = false;
                break;
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
    const checkCollision = () => {
        let boxesCollision = false;
        staticCollideMesh.current.some((mesh) => {
            if (person.current.BBox.intersectsBox(mesh.BBox)) {
                console.log('Intersection', mesh)
                boxesCollision = true;
                return true;
            }
        });
        if (boxesCollision) {
            person.current.position.copy(prevPositions.current[prevPositions.current.length - 5]);
        }
    }
    const resetCharacter = () => {
        personBody.current.position.set(0, 3, 6)
    }
    const tick = (scene) => {
        const _camera = camera.current, _renderer = renderer.current;
        let delta = clock.current.getDelta();
        objectsToUpdate.current.forEach(object => {
            object.mesh.position.copy(object.body.position)
            object.mesh.quaternion.copy(object.body.quaternion);
        })
        checkRaycastCollision();
        updateMovement();
        if (showPiece.current) {
            showPiece.current.rotation.y += 0.01
        }

        if (animationMixer.current) animationMixer.current.update(delta);

        cannonDebugger.current.update() // Update the CannonDebugger meshes
        _renderer.render(scene, _camera);
        stats.current?.update();
        world.current.step(1 / 60, delta, 3);
        window.requestAnimationFrame(() => tick(scene));
    };


    const constructCollisionBoxes = () => {

        staticCollideMesh.current.forEach(function (mesh) {
            // Bounding Box
            mesh.BBox = new THREE.Box3().setFromObject(mesh);

            // helper
            mesh.BBoxHelper = new THREE.BoxHelper(mesh, 0xff0000);
            _scene.current.add(mesh.BBoxHelper);
        });
    }

    const updateMovement = () => {
        const time = performance.now();
        const delta = (time - prevTime1.current) / 1000;
        prevTime1.current = time;
        const rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second

        // this.tmpPosition.copy( this.body.position );
        prevPositions.current.unshift(person.current.position.clone());
        prevPositions.current.pop();
        let action = 'Idle';

        //movement through rigid body
        if (canJump.current) {
            if (isCurrentlyJumping.current === true) {
                personBody.current.velocity.y = 10;
            }
            isCurrentlyJumping.current = false;
        }
        if (moveLeft.current) {
            //camera rotate
            rotationQuaternion.current.setFromAxisAngle(axisY, rotateAngle);
            personBody.current.quaternion = rotationQuaternion.current.mult(personBody.current.quaternion);
        }

        if (moveRight.current) {
            //camera rotate
            rotationQuaternion.current.setFromAxisAngle(axisY, -rotateAngle);
            personBody.current.quaternion = rotationQuaternion.current.mult(personBody.current.quaternion);
        }


        localVelocity.current.set(0, 0, moveDistance * 0.2)
        let worldVelocity = personBody.current.quaternion.vmult(localVelocity.current);

        if (moveForward.current) {
            action = 'Run'
            personBody.current.velocity.x = -worldVelocity.x;
            personBody.current.velocity.z = -worldVelocity.z;
        }

        if (moveBackward.current) {
            action = 'BackRun'
            personBody.current.velocity.x = worldVelocity.x;
            personBody.current.velocity.z = worldVelocity.z;
        }
        if (modelAnimations.current[action] && (action !== currentAction.current)) {
            modelAnimations.current[currentAction.current]?.fadeOut(1);
            modelAnimations.current[action]?.reset()?.fadeIn(0.4).play()

            currentAction.current = action
        }
        /**
         * Translation Approach
         * */
        /*if (crouch.current) {
            gsap.to(person.current.scale, {
                y: 0.6
            })
        } else gsap.to(person.current.scale, {
            y: 1
        })
        if (canJump.current) {
            if (isCurrentlyJumping.current)
                person.current.position.y = 10;
            isCurrentlyJumping.current = false
        }
        // Forward
        if (moveForward.current) {
            action = 'Run'
            person.current.translateZ(-SPEED * delta);
        }
        // Back
        if (moveBackward.current) {
            action = 'BackRun'
            person.current.translateZ(SPEED * delta);
        }
        // Left
        if (moveLeft.current) {
            person.current.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotateAngle);
            // person.current.translateX(-1.6 * delta);
        }
        // Right
        if (moveRight.current) {
            person.current.rotateOnAxis(new THREE.Vector3(0, 1, 0), -rotateAngle);
            // person.current.translateX(1.6 * delta);
        }
        if (modelAnimations.current[action] && (action !== currentAction.current)) {
            modelAnimations.current[currentAction.current]?.fadeOut(1);
            modelAnimations.current[action]?.reset()?.fadeIn(0.4).play()

            currentAction.current = action
        }

        const relativeCameraOffset = new THREE.Vector3(0, 0.6, 1);

        const cameraOffset = relativeCameraOffset.applyMatrix4(person.current.matrixWorld);
        camera.current.position.x = cameraOffset.x;
        camera.current.position.y = cameraOffset.y;
        camera.current.position.z = cameraOffset.z;
        camera.current.lookAt(person.current.position.x, person.current.position.y, person.current.position.z);
*/
    }
    const checkRaycastCollision = () => {
        const time = performance.now();
        if (1) {
            let blocked = false;
            // raycaster.current.ray.origin.copy(person.current.position);
            // raycaster.ray.origin.y -= 10;
            // let controlCoords = controls.current.getObject().position;
            // raycaster.current.setFromCamera(mousePointer.current, camera.current)
            const delta = (time - prevTime.current) / 1000;
            const originPoint = person.current.position.clone();
            person.current.getWorldDirection(direction.current);
            if (moveBackward.current) direction.current.negate();
            raycaster.current.ray.origin = originPoint;
            raycaster.current.ray.direction = direction.current.negate();
            // _scene.current.remove(arrow.current)
            // arrow.current = new THREE.ArrowHelper(raycaster.current.ray.direction, raycaster.current.ray.origin, 100, Math.random() * 0xffffff)
            // _scene.current.add(arrow.current)
            let collisionResults = raycaster.current.intersectObjects(walls.current, false);
            let stairIntersect = null;
            if (stairs.current?.length) {
                stairIntersect = raycaster.current.intersectObjects(stairs.current, true);
            }
            if (stairIntersect?.length) {
            }
            if (collisionResults.length > 0 && collisionResults[0]?.distance < 0.25) {
                console.log('~~~~~HIT~~~~~', collisionResults[0]?.distance);
                blocked = true;
                // a collision occurred... do something...
            }
            if (blocked) {
                // person.current.material.opacity = 0.3;
                // person.current.material.color = new THREE.Color('red');
                person.current.position.copy(prevPositions.current[prevPositions.current.length - 5]);
            }

            // velocity.current.x -= velocity.current.x * 10.0 * delta;
            // velocity.current.z -= velocity.current.z * 10.0 * delta;
            //
            // velocity.current.y -= 9.8 * 100.0 * delta; // 100.0 = mass
            // direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
            // direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
            // direction.current.normalize(); // this ensures consistent movements in all directions
            // //
            // if (moveForward.current || moveBackward.current) velocity.current.z -= direction.current.z * MOVE_FACTOR.current * delta;
            // if (moveLeft.current || moveRight.current) velocity.current.x -= direction.current.x * MOVE_FACTOR.current * delta;
            // personBody.current.velocity.set(velocity.current.x, velocity.current.y, velocity.current.z)
            // controls.current.moveRight(-velocity.current.x * delta * 0.04);
            // controls.current.moveForward(-velocity.current.z * delta * 0.04);

        }

        prevTime.current = time;
    }
    return (<div className={"scene"}>
        <canvas className={"canvas"}/>
        {loading && <p className={'loading'}>Loading...</p>}
    </div>);
};

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}
