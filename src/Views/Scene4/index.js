import {useEffect, useRef} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import "./index.scss";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";
import gsap from 'gsap'
import Stats from 'three/examples/jsm/libs/stats.module'
import DomeModel from '../../assets/models/Dome.glb'
import RiggedModel from '../../assets/models/Soldier.glb'
import CANNON from "cannon";

const SIZES = {width: window.innerWidth, height: window.innerHeight};

export const Scene4 = () => {
    const MOVE_FACTOR = useRef(400.0);
    const clock = useRef(new THREE.Clock());
    const sphere = useRef(new THREE.Mesh());
    const world = useRef(null);
    const stats = useRef(null);
    const camera = useRef(new THREE.PerspectiveCamera());
    const _scene = useRef(new THREE.Scene());
    const renderer = useRef(null);
    const controls = useRef(new PointerLockControls());
    const raycaster = useRef(new THREE.Raycaster());
    const boundary = useRef(new THREE.Box3())
    const mousePointer = useRef(new THREE.Vector2());
    const godzilla = useRef(new THREE.Group());
    const limit = useRef(new THREE.Vector3());
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const pointLight = useRef(new THREE.PointLight());
    const person = useRef(new THREE.Mesh());
    const moveForward = useRef(false);
    const moveBackward = useRef(false);
    const crouch = useRef(false);
    const moveLeft = useRef(false);
    const moveRight = useRef(false);
    const canJump = useRef(false);
    const arrow = useRef(new THREE.ArrowHelper())
    const prevTime = useRef(performance.now());
    const prevTime1 = useRef(performance.now());
    const walls = useRef([]);
    const showPiece = useRef(new THREE.Mesh())
    const stairs = useRef([])
    const objectsToUpdate = useRef([])
    const timeline = useRef(gsap.timeline());
    const cameraSphere = useRef(null);
    const cameraPhysicsSphere = useRef(null);
    const personBody = useRef(new CANNON.Body());
    const staticCollideMesh = useRef([]);
    const animationMixer = useRef(null);
    const walkAnimation = useRef(null);
    const modelAnimations = useRef({});
    const currentAction = useRef('');
    const prevPositions = useRef([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
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
    const loadColliderModel = () => {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(DomeModel, (gltf) => {
            const model = gltf.scene;
            if (model) {
                const objects = [...gltf.scene.children];
                let arr = [];
                let mesh = new THREE.Mesh()
                for (const object of objects) {
                    let targetFound = false;
                    console.log(object.name)

                    if (object?.name?.indexOf('Showpiece') !== -1) {
                        showPiece.current = object;
                    }
                    if (['Stairs_3'].includes(object?.name)) {
                        // object.material.color = new THREE.Color('red')
                        stairs.current.push(object)
                    }
                    if (object.isMesh && (object?.name?.indexOf('Dome') !== -1 || object?.name?.indexOf('Male') !== -1)) {
                        // object.visible = false;
                        if (object?.name?.indexOf('Male') !== -1) {
                            console.log(object)
                            let _pointLight = new THREE.PointLight(0x8f8f8f, 2,);
                            _pointLight.castShadow = true
                            _pointLight.position.set(0, 0, 5)
                            object.add(_pointLight);
                        }
                        object.layers.enable(1);
                        arr.push(object);
                    }
                    /*if (object.isMesh && object?.name.indexOf('Room') !== -1) {
                        // if (object.isMesh) {
                        console.log('Got one:', object);
                        mesh = new THREE.Mesh(object.geometry, new THREE.MeshNormalMaterial({color: 'green'}));
                        mesh.rotation.copy(object.rotation);
                        mesh.quaternion.copy(object.quaternion);
                        mesh.name = object.name

                        let pos = new THREE.Vector3();
                        object.getWorldPosition(pos)
                        console.log('location', pos);
                        mesh.position.copy(pos);


                        mesh.BBox = new THREE.Box3().setFromObject(mesh, true);
                        console.log(mesh.BBox)
                        // helper
                        mesh.BBoxHelper = new THREE.Box3Helper(mesh, 'green');
                        // _scene.current.add(mesh.BBoxHelper);
                        staticCollideMesh.current.push(mesh)
                        scene.add(mesh)
                        object.visible = false
                        arr.push(object);
                    }*/
                    _scene.current.add(object);
                }
                boundary.current = new THREE.Box3().setFromObject(_scene.current);
                walls.current = arr
            }
        });
    }
    const loadPlayer = () => {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(RiggedModel, (gltf) => {
            console.log('Main res', gltf)
            const model = gltf.scene;
            console.log('>>>', model)
            model.castShadow = true;
            // model.scale.set(0.02, 0.05, 0.02);
            model.position.set(0, 3, 8)
            // model.BBox = new THREE.Box3().setFromObject(model);
            // helper
            // model.BBoxHelper = new THREE.BoxHelper(model, 0xff0000);
            // godzilla.current = model;
            // _scene.current.add(model.BBoxHelper);

            _scene.current.add(model);
            let mixer = new THREE.AnimationMixer(model);
            animationMixer.current = mixer;
            gltf.animations.map(item => {
                if (item.name !== 'TPose')
                    modelAnimations.current[item.name] = mixer.clipAction(item);
            })
            person.current = model;
            console.log(modelAnimations.current)
            // const shape = new CANNON.Sphere();
            // const body = new CANNON.Body({
            //     mass: 0, shape,
            // });
            // body.position.copy(model.position);
            // world.current.addBody(body)

            // objectsToUpdate.current.push({
            //     mesh: model, body
            // })


        }, () => {
        }, (err) => {
            console.log(err)
        })
    }
    const renderModel = () => {
        const scene = new THREE.Scene();
        _scene.current = scene
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
            friction: 0.4, restitution: 0.7
        })
        _world.addContactMaterial(defaultContactMaterial)
        _world.defaultContactMaterial = defaultContactMaterial


        //physics floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({
            color: '#cbc04a', metalness: 0.3, roughness: 0.4, visible: false
        }))
        floor.receiveShadow = true
        floor.rotation.x = -Math.PI * 0.5
        _scene.current.add(floor)

        //physics floor
        const floorShape = new CANNON.Plane();
        const _floorBody = new CANNON.Body({
            mass: 0, shape: floorShape,
        });
        _floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI * 0.5)
        _world.addBody(_floorBody);


        loadPlayer();
        const geometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
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
        personBody.current = body;
        body.position.copy(_person.position);
        world.current.addBody(body)


        //camera
        const _camera = new THREE.PerspectiveCamera(70, SIZES.width / SIZES.height);
        _camera.position.set(0.1, 0.7, 0);
        // _camera.userData.obb = new OBB().fromBox3(_camera.boundingBox)

        // scene.add(_camera);
        camera.current = _camera;

        _person.add(_camera)
        // scene.add(_person, _person.BBoxHelper);

        // person.current = _person

        const canvas = document.querySelector(".canvas");

        /**
         * Raycaster
         * */
        raycaster.current = new THREE.Raycaster();
        raycaster.current.layers.set(1);

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
        console.log(controls.current)
        const _stats = Stats();
        stats.current = _stats;
        document.body.appendChild(_stats.dom);
        // createStartingMesh();
        // constructCollisionBoxes();
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
    const tick = (scene) => {
        const _camera = camera.current, _renderer = renderer.current;
        let delta = clock.current.getDelta();
        // person.current.position.copy(_camera.position).z = _camera.position.z - 1
        handleMovement();
        updateMovement();
        if (showPiece.current) {
            showPiece.current.rotation.y += 0.01
        }
        if (animationMixer.current) animationMixer.current.update(delta);
        // camera.current.quaternion.copy(person.current.quaternion);
        // camera.current.rotation.copy(person.current.rotation);
        // person.current.BBox.setFromObject(person.current);
        // checkCollision();

        // if (person.current)
        //     person.current.BBoxHelper.update();

        // controls.current.update(clock.current.getDelta());

        _renderer.render(scene, _camera);
        stats.current?.update();
        world.current.step(1 / 60, delta, 3);
        // godzilla.current.position.copy(sphere.current.position)
        // godzilla.current.quaternion.copy(sphere.current.quaternion)
        objectsToUpdate.current.forEach(object => {
            object.mesh.position.copy(object.body.position);
            object.mesh.quaternion.copy(object.body.quaternion);
        })
        // godzilla.current.position.y = 0;
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
        const SPEED = 3

        // this.tmpPosition.copy( this.body.position );
        prevPositions.current.unshift(person.current.position.clone());
        prevPositions.current.pop();
        let action = moveForward.current ? 'Run' : 'Idle';
        if (crouch.current) {
            gsap.to(person.current.scale, {
                y: 0.6
            })
        } else gsap.to(person.current.scale, {
            y: 1
        })
        if (canJump.current) {
            gsap.to(person.current.position, {
                y: 1
            })
        } else gsap.to(person.current.position, {
            y: 0
        })
        // Forward
        if (moveForward.current) {
            person.current.translateZ(-SPEED * delta);
        }
        // Back
        if (moveBackward.current) {
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

    }
    const handleMovement = () => {
        const time = performance.now();
        if (1) {
            let blocked = false;
            // raycaster.current.ray.origin.copy(person.current.position);
            // raycaster.ray.origin.y -= 10;
            // let controlCoords = controls.current.getObject().position;
            // raycaster.current.setFromCamera(mousePointer.current, camera.current)
            const delta = (time - prevTime.current) / 1000;
            const originPoint = person.current.position.clone();
            // person.current.material.opacity = 1;
            // person.current.material.color = new THREE.Color('blue')
            // let localVertex = new THREE.Vector3().fromBufferAttribute(person.current.geometry.attributes.position, vertexIndex).clone();
            // let globalVertex = localVertex.applyMatrix4(person.current.matrix);
            person.current.getWorldDirection(direction.current);
            if (moveBackward.current) direction.current.negate();
            raycaster.current.ray.origin = originPoint;
            raycaster.current.ray.direction = direction.current.negate();
            // _scene.current.remove(arrow.current)
            // arrow.current = new THREE.ArrowHelper(raycaster.current.ray.direction, raycaster.current.ray.origin, 100, Math.random() * 0xffffff)
            // _scene.current.add(arrow.current)
            // let ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
            let collisionResults = raycaster.current.intersectObjects(walls.current, false);
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

            /* const intersections = raycaster.current.intersectObjects(walls.current, false);
             if (intersections?.length) {
                 console.log(intersections[0])
                 let item = intersections?.[intersections?.length - 1]?.object;
                 person.current.userData.obb.copy(person.current.geometry.userData.obb)
                 item.userData.obb.copy(item.geometry.userData.obb)
                 person.current.userData.obb.applyMatrix4(person.current.matrixWorld)
                 item.userData.obb.applyMatrix4(item.matrixWorld);
                 if (person.current.userData.obb.intersectsOBB(item.userData.obb)) {
                     console.log('current coords', controlCoords)
                     // console.log('intersecting', item.name)
                     return
                 } else {
                     // console.log('not intersecting', item.name)
                 }
             }*/
            // else {
            // }
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

            /*  velocity.current.x -= velocity.current.x * 10.0 * delta;
              velocity.current.z -= velocity.current.z * 10.0 * delta;

              velocity.current.y -= 9.8 * 100.0 * delta; // 100.0 = mass
              direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
              direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
              direction.current.normalize(); // this ensures consistent movements in all directions
              console.log(camera.current.matrixWorldInverse.elements)
              //
              if (moveForward.current || moveBackward.current) velocity.current.z -= direction.current.z * MOVE_FACTOR.current * delta;
              if (moveLeft.current || moveRight.current) velocity.current.x -= direction.current.x * MOVE_FACTOR.current * delta;
  */
            // controls.current.moveRight(-velocity.current.x * delta * 0.04);
            // controls.current.moveForward(-velocity.current.z * delta * 0.04);

        }

        prevTime.current = time;
    }
    return (<div className={"scene"}>
        <canvas className={"canvas"}/>
    </div>);
};

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}
