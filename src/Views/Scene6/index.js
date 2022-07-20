import {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import "./index.scss";
import CANNON from 'cannon'
import GUI from 'lil-gui';
import HitSound from '../../assets/sounds/hit.mp3';
import VenusTex from '../../assets/textures/venusmap.jpg'
import VenusBumpTex from '../../assets/textures/venusbump.jpg'
import {Instructions} from "../../components/Instructions";

const SIZES = {width: window.innerWidth, height: window.innerHeight};

export const Scene6 = () => {
    const clock = useRef(new THREE.Clock())
    const camera = useRef(new THREE.PerspectiveCamera());
    const renderer = useRef(null);
    const scene = useRef(null);
    const bombSpecs = useRef({
        power: 30, size: 0.3
    });
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
    const gun = useRef(new THREE.Mesh());
    const _gui = useRef(null);
    const _sphereBody = useRef(null);
    const hitSound = useRef(new Audio(HitSound));
    const vec3 = useRef(new THREE.Vector3());
    const mousePointerVec = useRef(new THREE.Vector3());
    const fireInterval = useRef(1000);
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
            _gui.current.destroy();

        };
    }, []);

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
        fireBall()
    }
    const fireBall = () => {
        /**
         * Fire ball
         * */

        let color = new THREE.Color(0xffffff);
        color.setHex(Math.random() * 0xffffff);
        //3js body
        const _sphere = new THREE.Mesh(new THREE.SphereGeometry(bombSpecs.current.size, 32, 32), bombMaterial.current);
        _sphere.castShadow = true
        _sphere.receiveShadow = true
        _sphere.position.set(currentIntersect.current.point.x, currentIntersect.current.point.y, currentIntersect.current.point.z)

        //physics body
        const shape = new CANNON.Sphere(bombSpecs.current.size);
        const body = new CANNON.Body({
            mass: 10, shape,
        });
        body.position.set(currentIntersect.current.point.x, currentIntersect.current.point.y, currentIntersect.current.point.z);
        scene.current.add(_sphere);
        world.current.addBody(body)
        //
        let vector = vec3.current;
        // vec3.current.set(0, 0, 1);
        vector.unproject(camera.current);
        let ray = new THREE.Ray(new THREE.Vector3(camera.current.position.x, camera.current.position.y - 2, camera.current.position.z - 2.6), vector.sub(currentIntersect.current.point).normalize());
        vec3.current.x = -ray.direction.x;
        vec3.current.y = -ray.direction.y;
        vec3.current.z = -ray.direction.z;
        let x = body.position.x;
        let y = body.position.y;
        let z = body.position.z;
        body.velocity.set(vec3.current.x * bombSpecs.current.power, vec3.current.y * bombSpecs.current.power, vec3.current.z * bombSpecs.current.power);
        x += vec3.current.x;
        y += vec3.current.y;
        z += vec3.current.z;
        console.log(x, y, z)
        body.position.set(x, y, z);
        _sphere.position.set(x, y, z);
        objectsToUpdate.current.push({
            mesh: _sphere, body
        });
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
        console.log(bombMaterial.current)
        gui.add({
            bombPower: 30,
        }, 'bombPower').min(20).max(200).step(10).onChange((v) => {
            bombSpecs.current.power = v
        });
        gui.add({
            bombSize: 0.5,
        }, 'bombSize').min(0.3).max(3).step(0.001).onChange((v) => {
            bombSpecs.current.size = v
        });
        gui.add({
            activeMachineGun: false,
        }, 'activeMachineGun').onChange((v) => {
            if (v) {
                if (fireInterval.current)
                    clearInterval(fireInterval.current)
                fireInterval.current = setInterval(fireBall, fireInterval.current);
            } else clearInterval(fireInterval.current)
        });
        gui.add({
            fireInterval: 1000,
        }, 'fireInterval').min(100).max(1000).step(50).onChange((v) => {
            fireInterval.current = v
        });
        gui.add({
            [`generate100ObjectsToDestroy🔥`]: () => {
                for (let i = 0; i < 100; i++) {
                    let num = randomIntFromInterval(0, 2);
                    if (num < 1) {
                        createSphere((Math.random() * 0.5) + 0.13, {
                            x: (Math.random() - 0.5) * 3, y: (Math.random() * 4) + 2, z: (Math.random() - 0.5) * 3
                        })
                    } else
                        createBox(Math.random() * 0.89, Math.random() * 1.3, Math.random() * 0.9, {
                            x: (Math.random() - 0.5) * 3, y: (Math.random() * 4) + 2, z: (Math.random() - 0.5) * 3
                        })
                }
            },
        }, `generate100ObjectsToDestroy🔥`);
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

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshStandardMaterial({
            alphaTest: 0, visible: false
        }))
        plane.position.z = camera.current.position.z
        _scene.add(plane);
        _plane.current = plane;


        // Create a sphere
        const mass = 5, radius = 1.3;
        const sphereShape = new CANNON.Sphere(radius);
        const sphereBody = new CANNON.Body({mass: mass});
        sphereBody.addShape(sphereShape);
        sphereBody.position.set(0, 0, 3);
        sphereBody.linearDamping = 0.9;
        world.current?.addBody(sphereBody);
        _sphereBody.current = sphereBody;

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
        const _camera = new THREE.PerspectiveCamera(75, SIZES.width / SIZES.height, 0.1, 1000)
        _camera.rotation.order = 'YXZ';
        _camera.position.set(-3, 6, 20)
        _scene.add(_camera)

        camera.current = _camera;

        /**
         * Gun
         * */
        const _gun = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 3, 32, 32, 32), new THREE.MeshStandardMaterial({
            roughness: 0.3, metalness: 0.4, color: 'red',
        }));
        _gun.castShadow = true
        _gun.lookAt(0, 0, 0)
        _gun.position.set(_camera.position.x, _camera.position.y - 2, _camera.position.z - 2.6)
        scene.current.add(_gun);
        gun.current = _gun

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
        const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth, 32, 32, 32), new THREE.MeshStandardMaterial({
            roughness: 0.3, metalness: 0.4, envMap: envMapTexture.current, envMapIntensity: 0.5, color: 'black',
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
        // const intersects = raycaster.current.intersectObjects(objectsToUpdate.current.map(item => item.mesh));
        const intersects = raycaster.current.intersectObjects(scene.children);

        //gun movement
        const intersect = raycaster.current.intersectObject(_plane.current);
        if (intersect?.[0]?.point) gun.current.lookAt(intersect?.[0]?.point);

        if (intersects.length) {
            if (!currentIntersect.current) {
                _canvas.current.style.cursor = `crosshair`
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
            object.mesh.position.copy(object.body.position);
            object.mesh.quaternion.copy(object.body.quaternion);

            if (object.mesh.position.z < -200 || object.mesh.position.x < -130) {
                //remove very far objects.
                //can also be implemented with a "sleep" event
                scene.remove(object.mesh)
            }
        })
        // sphere.current.position.copy(physicsSphere.current.position)
        window.requestAnimationFrame(() => tick(scene));
    };
    return (<div className={"scene"}>
        <Instructions title={`Hit 'Em`}
                      subText={`Create random shapes. Click to shoot asteroids outta your space gun and Hit 'em all!!!!`}/>
        <canvas className={"canvas"}/>
    </div>);
};

function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}
