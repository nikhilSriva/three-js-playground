import {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import "./index.scss";
import DungeonModel from '../../assets/models/dungeon.glb'
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";
import {acceleratedRaycast, computeBoundsTree, MeshBVH, MeshBVHVisualizer} from "three-mesh-bvh";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import SoldierModel from "../../assets/models/knight.glb";
import CrystalModel from "../../assets/models/Crystal.glb";
import GUI from "lil-gui";
import gsap from 'gsap'
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass";
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";
import {Instructions} from "../../components/Instructions";

const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;

const SIZES = {width: window.innerWidth, height: window.innerHeight};
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);

const ORB_POSITIONS = [{
    x: 9, y: 1.4, z: 3.75
}, {
    x: -10.002181588493995,
    y: 1.4581646733462643,
    z: -7.704358034552327
}, {
    x: 7.256411342221488, y: 3.432587854144039, z: -23.652041021749998
},
    {
        x: 5.256411342221488, y: 3.432587854144039, z: -10.652041021749998
    }]
const params = {
    updateRate: 1,
    autoUpdate: true,
    firstPerson: false,
    displayCollider: false,
    displayBVH: false,
    visualizeDepth: 10,
    gravity: -2200,
    playerSpeed: 40,
    physicsSteps: 5,

    reset: () => {
        console.log('RESET')
    },

};
let upVector = new THREE.Vector3(0, 1, 0);

export const Scene4BVH = () => {
    const clock = useRef(new THREE.Clock());
    const stats = useRef(null);
    const _gui = useRef(null);
    const camera = useRef(new THREE.PerspectiveCamera());
    const _scene = useRef(new THREE.Scene());
    const renderer = useRef(null);
    const controls = useRef(null);
    const mousePointer = useRef(new THREE.Vector2());
    const animationMixer = useRef(null);
    const modelAnimations = useRef({});
    const currentAction = useRef('');
    const moveForward = useRef(false);
    const moveBackward = useRef(false);
    const crouch = useRef(false);
    const moveLeft = useRef(false);
    const moveRight = useRef(false);
    const canJump = useRef(false);
    const isCurrentlyJumping = useRef(false)
    const [loading, setLoading] = useState(0);
    const gltfLoader = useRef(new GLTFLoader());
    const collider = useRef(null);
    const visualizer = useRef(null);
    const raycaster = useRef(new THREE.Raycaster());
    const playerVelocity = useRef(new THREE.Vector3());
    let player = useRef(new THREE.Mesh());
    const tempVector = useRef(new THREE.Vector3());
    const tempVector2 = useRef(new THREE.Vector3());
    const tempBox = useRef(new THREE.Box3());
    const tempMat = useRef(new THREE.Matrix4());
    const tempSegment = useRef(new THREE.Line3());
    const playerIsOnGround = useRef(false);
    const isCollided = useRef(false);
    const orbModel = useRef(null);
    const orbParticles = useRef([]);
    const orb = useRef(new THREE.Mesh());
    const raycasterObjects = useRef([]);
    const direction = useRef(new THREE.Vector3());
    const effectComposer = useRef(null)
    const meshHelper = useRef(null);
    const bvhHelper = useRef(null);
    const firstClickDone = useRef(false);
    const rotationQuaternion = useRef(new THREE.Quaternion());
    const enemies = useRef([]);
    const guardTorch = useRef(null);
    const playerModel = useRef(null);
    const orbPower = useRef(0);
    const arrow = useRef(new THREE.ArrowHelper())
    const labelRenderer = useRef(new CSS2DRenderer())
    const lights = useRef({
        hemishphereLight: null, light: null
    })
    const onPointMove = (event) => {
        // mousePointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        // mousePointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        mousePointer.current.x = (event.clientX - windowHalf.x);
        mousePointer.current.y = (event.clientY - windowHalf.x);
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
        window.addEventListener("click", onPointClick);

        window.addEventListener("mousemove", onPointMove);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);


        return () => {
            _gui.current?.destroy();
            window.removeEventListener("resize", onResize);
            window.removeEventListener("click", onPointClick);
            window.removeEventListener("mousemove", onPointMove);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);

        };
    }, []);

    const onPointClick = () => {
        if (!firstClickDone.current) {
            let div = document.querySelector('.instruction');
            if (div) {
                div.remove();
                firstClickDone.current = true
            }
        }
    }
    const enableNight = () => {
        playerModel.current.traverse(c => {
            if (c.name === 'armor') {
                const spotLight = new THREE.SpotLight('#f1e6cc', 1);
                spotLight.position.set(0, 3, 0.1);
                spotLight.castShadow = true;
                spotLight.angle = Math.PI * 0.14;
                spotLight.shadow.mapSize.width = 1024;
                spotLight.shadow.mapSize.height = 1024;
                spotLight.distance = 40
                spotLight.shadow.focus = 1;
                spotLight.shadow.camera.far = 20
                spotLight.penumbra = 0.25;
                guardTorch.current = spotLight;
                c.add(spotLight)
                c.add(spotLight.target)
            }
        });
        lights.current.hemishphereLight.intensity = 0.02;
        _scene.current.remove(lights.current.light)
    }
    const disableNight = () => {
        guardTorch.current.removeFromParent();
        lights.current.hemishphereLight.intensity = 0.4;
        _scene.current.add(lights.current.light)
    }
    const removeTorchFromPlayer = () => {
        guardTorch.current.removeFromParent();
    }
    const loadPlayer = () => {
        gltfLoader.current.load(SoldierModel, (gltf) => {
            const model = gltf.scene;
            console.log('SOldier model', model)
            model.castShadow = true;
            model.scale.set(0.12, 0.12, 0.12);
            model.rotation.y = Math.PI;
            model.traverse((c) => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                }
            })
            model.updateMatrixWorld(true);
            playerModel.current = model;
            let mixer = new THREE.AnimationMixer(model);
            if (!animationMixer.current) animationMixer.current = mixer;
            let backRun = null;
            if (gltf.animations.length) {
                console.log(gltf.animations)
                gltf.animations.forEach(item => {
                    if (item.name === 'Idle') {
                        modelAnimations.current[item.name] = mixer.clipAction(item);
                    }
                })
                modelAnimations.current['BackRun'] = backRun;

            }

            let _player = new THREE.Mesh(new RoundedBoxGeometry(1.0, 1.7, 1.0, 10, 0.5), new THREE.MeshBasicMaterial({
                visible: false
            }));
            _player.capsuleInfo = {
                radius: 0.5, segment: new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0.0))
            };
            _player.position.set(15.75, 1, 30);
            model.position.y = -1.5;
            _player.add(camera.current);
            _player.add(model);
            _player.castShadow = true;
            _player.receiveShadow = true;
            _player.material.shadowSide = 2;
            _scene.current.add(_player);
            player.current = _player;
        }, () => {
        }, (err) => {
            console.log(err)
        })


    }
    const loadColliderModel = () => {
        gltfLoader.current.load(DungeonModel, (gltf) => {
            const gltfScene = gltf.scene;
            console.log('Main res DungeonModel', gltfScene);
            gltfScene.scale.setScalar(.01);
            gltfScene.position.y = -4.6;

            const box = new THREE.Box3();
            box.setFromObject(gltfScene);
            box.getCenter(gltfScene.position).negate();
            gltfScene.updateMatrixWorld(true);

            // visual geometry setup
            const toMerge = {};
            gltfScene.traverse(c => {
                if (/Gate/.test(c.name) || // pink brick
                    c.material && c.material?.color?.r === 1.0) {
                    return;
                }
                if (c.isMesh) {
                    if (c.name.indexOf('Character') !== -1) {
                        console.log('Main Character', c);
                    }
                    if (c.name.indexOf('Enemie') !== -1) {

                        enemies.current.push(c)
                    }
                    const hex = c.material.color?.getHex();
                    toMerge[hex] = toMerge[hex] || [];
                    toMerge[hex].push(c);
                }
            });
            let environment = new THREE.Group();
            const spotLight = new THREE.SpotLight('#f1e6cc', 1);
            spotLight.position.set(0, 3, 0.1);
            spotLight.castShadow = true;
            spotLight.angle = Math.PI * 0.14;
            spotLight.shadow.mapSize.width = 1024;
            spotLight.shadow.mapSize.height = 1024;
            spotLight.distance = 40
            spotLight.shadow.focus = 1;
            spotLight.shadow.camera.far = 20
            spotLight.penumbra = 0.25;
            for (const hex in toMerge) {
                const arr = toMerge[hex];
                const visualGeometries = [];
                arr.forEach(mesh => {
                    if (mesh.material?.emissive?.r !== 0) {
                        environment.attach(mesh);
                    } else {
                        const geom = mesh.geometry.clone();
                        geom.applyMatrix4(mesh.matrixWorld);
                        visualGeometries.push(geom);
                    }
                });

                if (visualGeometries.length) {
                    const newGeom = BufferGeometryUtils.mergeBufferGeometries(visualGeometries);
                    const newMesh = new THREE.Mesh(newGeom, new THREE.MeshStandardMaterial({
                        color: parseInt(hex), shadowSide: 2
                    }));
                    newMesh.castShadow = true;
                    newMesh.receiveShadow = true;
                    newMesh.material.shadowSide = 2;
                    environment.add(newMesh);

                }

            }


            // collect all geometries to merge
            const geometries = [];
            environment.updateMatrixWorld(true);
            environment.traverse(c => {
                if (c.geometry) {
                    const cloned = c.geometry.clone();
                    cloned.applyMatrix4(c.matrixWorld);
                    for (const key in cloned.attributes) {
                        if (key !== 'position') {
                            cloned.deleteAttribute(key);
                        }
                    }
                    geometries.push(cloned);
                }

            });

            // create the merged geometry
            const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
            mergedGeometry.boundsTree = new MeshBVH(mergedGeometry, {lazyGeneration: false});

            let _collider = new THREE.Mesh(mergedGeometry);
            _collider.visible = false;
            _collider.material.wireframe = true;
            _collider.material.opacity = 0.5;
            _collider.material.transparent = true;

            let _visualizer = new MeshBVHVisualizer(_collider, params.visualizeDepth);
            _visualizer.visible = false;
            collider.current = _collider;
            visualizer.current = _visualizer;

            _scene.current.add(_visualizer);
            _scene.current.add(_collider);
            _scene.current.add(environment);

        }, () => {
        }, (err) => {
            console.log(err)
        })
    }

    const createScene = () => {
        _scene.current = new THREE.Scene();
    }
    const createLoadingManager = () => {
        const manager = new THREE.LoadingManager();
        gltfLoader.current = new GLTFLoader(manager);

        manager.onStart = function () {
            console.log('Loading ßtarted!');
            setLoading(0);
        };
        manager.onLoad = function () {
            console.log('Loading complete!');
            setLoading(100);
        };
        manager.onProgress = function (url, itemsLoaded, itemsTotal) {
            setLoading(Math.floor(itemsLoaded / itemsTotal * 100))
        };
    }
    const createCamera = () => {
        const _camera = new THREE.PerspectiveCamera(75, SIZES.width / SIZES.height, 0.1, 50);
        _camera.position.set(0, 2.3, 4);
        _camera.updateProjectionMatrix();
        camera.current = _camera;
    }
    const createLights = () => {
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1.5, 1).multiplyScalar(50);
        light.shadow.mapSize.setScalar(2048);
        light.shadow.bias = -1e-4;
        light.shadow.normalBias = 0.05;
        light.castShadow = true;

        const shadowCam = light.shadow.camera;
        shadowCam.bottom = shadowCam.left = -30;
        shadowCam.top = 30;
        shadowCam.right = 45;
        lights.current.light = light;
        lights.current.hemishphereLight = new THREE.HemisphereLight(0xffffff, 0x223344, 0.4)
        _scene.current.add(lights.current.light, lights.current.hemishphereLight);
    }
    const createRenderer = () => {
        const canvas = document.querySelector(".canvas");
        const _renderer = new THREE.WebGLRenderer({canvas});
        _renderer.setSize(SIZES.width, SIZES.height);
        _renderer.setPixelRatio(window.devicePixelRatio);
        _renderer.shadowMap.enabled = true;
        _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        _renderer.outputEncoding = THREE.sRGBEncoding;
        _renderer.render(_scene.current, camera.current);
        renderer.current = _renderer;
    }

    const cameraControls = () => {
        controls.current = new OrbitControls(camera.current, renderer.current.domElement);
        controls.current.enabled = false;
    }

    function reset(loadExtraProps = true) {
        playerVelocity.current.set(0, 0, 0);
        player.current.position.set(15.75, 1, 30);
        orbPower.current = 0;
    }

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
                console.log('SPACE')
                if (playerIsOnGround.current) {
                    playerVelocity.current.y = 130 + (orbPower.current * 30);
                }
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


    const fadeObjects = () => {
        if (orbParticles.current.length && isCollided.current) {
            let dimCounter = 0;
            for (let i = 0; i < orbParticles.current.length; i++) {
                let mesh = orbParticles.current[i];
                if (mesh.material.opacity <= 1) {
                    if (mesh.material.opacity <= 0) {
                        dimCounter += 1;
                        _scene.current.remove(mesh);
                    } else {
                        mesh.material.opacity -= 0.002;
                        mesh.material.needsUpdate = true
                    }
                }
            }
            if (dimCounter === orbParticles.current.length) {
                orbPower.current += 1;
                _scene.current.remove(orbModel.current);
                isCollided.current = false
            }
        }
    }
    const tick = (scene) => {
        const _camera = camera.current, _renderer = renderer.current;
        fadeObjects()
        _renderer.autoClear = false;
        _renderer.clear();
        _camera.layers.set(1);
        effectComposer.current.render();
        _renderer.clearDepth();
        _camera.layers.set(0);
        _renderer.render(scene, _camera);
        labelRenderer.current.render(scene, camera.current)
        // _renderer.render(scene, _camera);
        stats.current?.update();
        _scene.current.updateMatrixWorld(true);
        checkCollision()
        updateCollider();
        window.requestAnimationFrame(() => tick(scene));
    };
    const checkCollision = () => {
        const originPoint = player.current.position.clone();
        player.current.getWorldDirection(direction.current);
        raycaster.current.ray.origin = originPoint;
        raycaster.current.ray.direction = direction.current.negate();
        raycaster.current.set(player.current.position, direction.current);
        raycaster.current.firstHitOnly = true;

        let collisionResults = raycaster.current.intersectObjects(raycasterObjects.current, false);
        if (collisionResults.length && collisionResults[0]?.distance < 0.35) {
            if (orbModel.current) {
                console.log('HIT')
                isCollided.current = true
            }
        }

    }

    const updateCollider = () => {
        if (collider.current) {
            const physicsSteps = params.physicsSteps;

            for (let i = 0; i < physicsSteps; i++) {
                updatePlayer(clock.current.getDelta() / physicsSteps);

            }

        }
    }

    const updatePlayer = (delta) => {
        const rotateAngle = Math.PI / 2 * (delta * 8);   // pi/2 radians (90 degrees) per second
        playerVelocity.current.y += playerIsOnGround.current ? 0 : delta * params.gravity;
        player.current.position.addScaledVector(playerVelocity.current, delta);
        let action = 'Idle';

        // move the player
        const angle = controls.current.getAzimuthalAngle();
        if (firstClickDone.current) {
            if (moveForward.current) {
                // tempVector.current.set(0, 0, -1).applyAxisAngle(upVector, angle);
                player.current.translateZ(-(params.playerSpeed * delta));

            }

            if (moveBackward.current) {
                action = 'BackRun'
                player.current.translateZ(params.playerSpeed * delta);

            }
            if (modelAnimations.current[action] && (action !== currentAction.current)) {
                modelAnimations.current[currentAction.current]?.fadeOut(1);
                modelAnimations.current[action]?.reset()?.fadeIn(0.4).play();
                currentAction.current = action
            }


            if (moveLeft.current) {

                rotationQuaternion.current.setFromAxisAngle(upVector, rotateAngle);
                player.current.setRotationFromQuaternion(rotationQuaternion.current.multiply(player.current.quaternion));
                // tempVector.current.set(-1, 0, 0).applyAxisAngle(upVector, angle);
                // player.current.position.addScaledVector(tempVector.current, params.playerSpeed * delta);

            }

            if (moveRight.current) {
                rotationQuaternion.current.setFromAxisAngle(upVector, -rotateAngle);
                player.current.setRotationFromQuaternion(rotationQuaternion.current.multiply(player.current.quaternion));
                // tempVector.current.set(1, 0, 0).applyAxisAngle(upVector, angle);
                // player.current.position.addScaledVector(tempVector.current, params.playerSpeed * delta);

            }

            player.current.updateMatrixWorld();
        }
        // adjust player position based on collisions
        const capsuleInfo = player.current.capsuleInfo;
        tempBox.current.makeEmpty();
        tempMat.current.copy(collider.current.matrixWorld).invert();
        tempSegment.current.copy(capsuleInfo.segment);

        // get the position of the capsule in the local space of the collider
        tempSegment.current.start.applyMatrix4(player.current.matrixWorld).applyMatrix4(tempMat.current);
        tempSegment.current.end.applyMatrix4(player.current.matrixWorld).applyMatrix4(tempMat.current);

        // get the axis aligned bounding box of the capsule
        tempBox.current.expandByPoint(tempSegment.current.start);
        tempBox.current.expandByPoint(tempSegment.current.end);

        tempBox.current.min.addScalar(-capsuleInfo.radius);
        tempBox.current.max.addScalar(capsuleInfo.radius);

        collider.current.geometry.boundsTree.shapecast({

            intersectsBounds: box => box.intersectsBox(tempBox.current),

            intersectsTriangle: tri => {

                // check if the triangle is intersecting the capsule and adjust the
                // capsule position if it is.
                const triPoint = tempVector.current;
                const capsulePoint = tempVector2.current;

                const distance = tri.closestPointToSegment(tempSegment.current, triPoint, capsulePoint);
                if (distance < capsuleInfo.radius) {

                    const depth = capsuleInfo.radius - distance;
                    const direction = capsulePoint.sub(triPoint).normalize();

                    tempSegment.current.start.addScaledVector(direction, depth);
                    tempSegment.current.end.addScaledVector(direction, depth);

                }

            }

        });

        // get the adjusted position of the capsule collider in world space after checking
        // triangle collisions and moving it. capsuleInfo.segment.start is assumed to be
        // the origin of the player model.
        const newPosition = tempVector.current;
        newPosition.copy(tempSegment.current.start).applyMatrix4(collider.current.matrixWorld);

        // check how much the collider was moved
        const deltaVector = tempVector2.current;
        deltaVector.subVectors(newPosition, player.current.position);

        // if the player was primarily adjusted vertically we assume it's on something we should consider ground
        playerIsOnGround.current = deltaVector.y > Math.abs(delta * playerVelocity.current.y * 0.25);
        // let playerIsOnGround = true;

        const offset = Math.max(0.0, deltaVector.length() - 1e-5);
        deltaVector.normalize().multiplyScalar(offset);

        // adjust the player model
        player.current.position.add(deltaVector);

        if (!playerIsOnGround.current) {
            deltaVector.normalize();
            playerVelocity.current.addScaledVector(deltaVector, -deltaVector.dot(playerVelocity.current));

        } else {
            playerVelocity.current.set(0, 0, 0);
        }

        // adjust the camera
        // camera.current.position.sub(controls.current.target);
        // controls.current.target.copy(player.current.position);
        // camera.current.position.add(player.current.position);

        // if the player has fallen too far below the level reset their position to the start
        if (player.current.position.y < -10) {
            console.log('RESETTTING')
            reset();
            loadProps();
        }

    }

    const createGui = () => {
        const gui = new GUI();
        _gui.current = gui;

        gui.add({
            enableNightMode: false
        }, 'enableNightMode').onChange(v => {
            v ? enableNight() : disableNight()
        })

    }
    const loadProps = () => {
        if (orbModel.current) {
            _scene.current.remove(orbModel.current);
        }
        gltfLoader.current.load(CrystalModel, (gltf) => {
            let model = gltf.scene;
            let pointLight = new THREE.PointLight(0x00ff00, 5);
            pointLight.distance = 2;
            model.scale.set(0.8, 0.8, 0.8)
            model.traverse(c => {
                if (c.isMesh) {
                    orbParticles.current.push(c);
                    if (c.name === 'MainOrb') {
                        raycasterObjects.current.push(c);
                        orb.current = c;
                        c.layers.enable(1);
                        c.material.transparent = true;
                        let timeline = gsap.timeline();
                        timeline
                            .to(c.position, {
                                duration: 2.5, y: 1.5, ease: 'power1.in'
                            })
                            .to(c.position, {
                                duration: 2.5, y: 0.7, ease: 'power1.in'
                            }).repeat(-1);
                        c.castShadow = true;
                        c.receiveShadow = true;
                        c.add(pointLight)
                    }
                }
            })

            let i = 0;
            model.position.set(ORB_POSITIONS[i].x, ORB_POSITIONS[i].y, ORB_POSITIONS[i].z);
            orbModel.current = model;
            _scene.current.add(model);
            let mixer = new THREE.AnimationMixer(model);
            if (!animationMixer.current) animationMixer.current = mixer;
            let action = mixer.clipAction(gltf.animations?.[0]);
            action.play();

        })
    }
    const createEffects = () => {
        const _effectComposer = new EffectComposer(renderer.current)
        _effectComposer.setSize(SIZES.width, SIZES.height)
        _effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const renderPass = new RenderPass(_scene.current, camera.current)
        _effectComposer.addPass(renderPass);
        const unrealBloomPass = new UnrealBloomPass();
        unrealBloomPass.renderToScreen = true
        unrealBloomPass.threshold = 0.21
        unrealBloomPass.strength = 2
        unrealBloomPass.radius = 0.9
        _effectComposer.addPass(unrealBloomPass)
        effectComposer.current = _effectComposer;
    }
    const creatLabelRenderer = () => {
        const _labelRenderer = new CSS2DRenderer();
        _labelRenderer.setSize(window.innerWidth, window.innerHeight);
        _labelRenderer.domElement.style.position = 'absolute';
        _labelRenderer.domElement.style.top = '0px';
        labelRenderer.current = _labelRenderer;
        document.body.appendChild(_labelRenderer.domElement)
    }
    const renderModel = () => {
        createGui();
        createScene();
        createCamera()
        createLoadingManager();
        loadPlayer();
        reset();
        loadProps();
        loadColliderModel();
        createLights();
        createRenderer();
        cameraControls();
        createEffects()
        creatLabelRenderer();
        const _stats = Stats();
        stats.current = _stats;
        document.body.appendChild(_stats.dom);
        tick(_scene.current);
    };

    return (<div className={"scene"}>
        <Instructions title={`⚔️ Dungeon`}
                      subText={`WASD to move, SPACE to jump. \nConsume green orbs for more jump power. \n Do try the night mode in this`}/>
        <canvas className={"canvas"}/>
        {loading !== 100 && <p className={'loading'}>Loading {loading}%</p>}
    </div>);
};
