import {useEffect, useRef, useState} from "react";
import * as THREE from "three";
import "./index.scss";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import SunTexture from '../../assets/textures/sunmap.jpg'
import EarthTexture from '../../assets/textures/earthmap1k.jpg'
import EarthBumpTex from '../../assets/textures/earthbump1k.jpg'
import MercuryTexture from '../../assets/textures/mercurymap.jpg'
import MercuryBumpTex from '../../assets/textures/mercurybump (1).jpg'
import JupiterTex from '../../assets/textures/jupitermap.jpg'
import GalaxyTex from '../../assets/textures/galaxy.png'
import VenusTex from '../../assets/textures/venusmap.jpg'
import VenusBumpTex from '../../assets/textures/venusbump.jpg'
import MarsTex from '../../assets/textures/marsmap1k.jpg'
import ParticleMap from '../../assets/textures/circle_05.png'
import MarsBumpTex from '../../assets/textures/marsbump1k.jpg'
import GUI from 'lil-gui'

const SIZES = {width: window.innerWidth, height: window.innerHeight};
const PLANETS = [{
    key: 1, name: 'mercury', bumpMap: MercuryBumpTex, texture: MercuryTexture, x: -1.4, radius: 0.1
}, {
    key: 2, name: 'venus', bumpMap: VenusBumpTex, texture: VenusTex, x: -2.6, radius: 0.34
}, {
    key: 3, name: 'earth', bumpMap: EarthBumpTex, texture: EarthTexture, x: -3.7, radius: 0.4
}, {
    key: 3, name: 'mars', bumpMap: MarsBumpTex, texture: MarsTex, x: -5.2, radius: 0.15
}, {
    key: 5, name: 'jupiter', bumpMap: null, texture: JupiterTex, x: -10.5, radius: 0.6
}]

const parameters = {
    count: 100000,
    size: 0.03,
    radius: 5,
    branches: 3,
    spin: 1,
    randomness: 0.2,
    randomnessPower: 3,
    insideColor: '#ff6030',
    outsideColor: '#1b3984',
}
export const Scene5 = ({moveCamera = false}) => {
    const clock = useRef(new THREE.Clock())
    const camera = useRef(null);
    const _gui = useRef(null);
    const SPEED_FACTOR = useRef(1);
    const [loading, setLoading] = useState(false);
    const renderer = useRef(null);
    const particleGeometry = useRef(null);
    const _scene = useRef(null);
    const _geometry = useRef(null);
    const _material = useRef(null);
    const _points = useRef(null);
    const orbitControl = useRef(null);
    const raycaster = useRef(null);
    const currentIntersect = useRef(null);
    const _canvas = useRef(null);
    const starMesh = useRef(null);
    const previousTime = useRef(0);
    const planets = useRef([]);
    const mousePointer = useRef(new THREE.Vector2());

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
        window.addEventListener("click", onPointClick);

        return () => {
            window.removeEventListener("resize", onResize);
            window.removeEventListener("mousemove", onPointMove);
            window.removeEventListener("click", onPointClick);
            _gui.current?.destroy()
        };
    }, []);

    const onPointMove = (event) => {
        // calculate pointer position in normalized device coordinates
        mousePointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePointer.current.y = -(event.clientY / window.innerHeight * 2 - 1);
    }
    const onPointClick = (event) => {
        if (currentIntersect.current) {
            let position = currentIntersect.current.object.geometry.attributes.position.array;
            for (let i = 0; i < position.length; i++) {
                const i3 = i * 3;
                position[i3] = (Math.random() + Math.random())
                position[i3 + 1] = (Math.random() + Math.random())
                position[i3 + 2] = (Math.random() + Math.random())
            }
            currentIntersect.current.object.geometry.attributes.position.needsUpdate = true;
        }
    }
    const renderModel = () => {
        const scene = new THREE.Scene();
        _scene.current = scene
        const manager = new THREE.LoadingManager();
        const textureLoader = new THREE.TextureLoader(manager);
        if (!moveCamera) {
            const gui = new GUI();
            _gui.current = gui;
            gui.add(parameters, 'count').min(100).max(100000).step(100).onFinishChange(() => generateGalaxy(scene));
            gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(() => generateGalaxy(scene));
            gui.add(parameters, 'radius').min(0.1).max(20).step(0.1).onFinishChange(() => generateGalaxy(scene));
            gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(() => generateGalaxy(scene));
            gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(() => generateGalaxy(scene));
            gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(() => generateGalaxy(scene));
            gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(() => generateGalaxy(scene));
            gui.addColor(parameters, 'insideColor').onFinishChange(() => generateGalaxy(scene));
            gui.addColor(parameters, 'outsideColor').onFinishChange(() => generateGalaxy(scene));
        }
        manager.onStart = function () {
            console.log('Loading ßtarted!');
            setLoading(true);
        };
        manager.onLoad = function () {
            console.log('Loading complete!');
            setLoading(false);
        };
        const sunTexture = textureLoader.load(SunTexture);
        const sunMaterial = new THREE.MeshBasicMaterial({map: sunTexture});
        const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), sunMaterial)

        //render planets
        if (!moveCamera) {
            PLANETS.forEach(planet => {
                const item = new THREE.Mesh(
                    new THREE.SphereGeometry(planet.radius, 32, 32),
                    new THREE.MeshStandardMaterial({
                        bumpMap: textureLoader.load(planet.bumpMap),
                        map: textureLoader.load(planet.texture)
                    }))
                item.receiveShadow = true;
                item.uuid = planet.name
                item.position.x = planet.x;
                planets.current.push(item);
                scene.add(item)
            })
            scene.add(sun);
        }
        //camera
        camera.current = new THREE.PerspectiveCamera(70, SIZES.width / SIZES.height, 0.1);
        camera.current.position.set(0, 6, 10);
        scene.add(camera.current)

        const canvas = document.querySelector('.canvas');
        _canvas.current = canvas;
        orbitControl.current = new OrbitControls(camera.current, canvas)
        orbitControl.current.enableDamping = true


        //galaxy
        const starGeometry = new THREE.SphereGeometry(80, 64, 64);
        const starMaterial = new THREE.MeshBasicMaterial({
            map: textureLoader.load(GalaxyTex), side: THREE.BackSide, transparent: true,
        });
        starMesh.current = new THREE.Mesh(starGeometry, starMaterial);
        scene.add(starMesh.current);

        //lights
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.castShadow = true
        sun.add(pointLight)

        /**
         * Particles
         * */

        // const particleGeometry = new THREE.SphereGeometry(1, 32, 32);
        particleGeometry.current = new THREE.BufferGeometry();
        const count = 20000;
        let positions = new Float32Array(count * 3);
        let colors = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
            colors[i] = Math.random();
        }
        particleGeometry.current.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        particleGeometry.current.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        const particleMaterial = new THREE.PointsMaterial({size: 0.1, sizeAttenuation: true})
        particleMaterial.alphaMap = textureLoader.load(ParticleMap)
        particleMaterial.transparent = true
        particleMaterial.depthWrite = false
        particleMaterial.blending = THREE.AdditiveBlending;
        particleMaterial.vertexColors = true;
        const particle = new THREE.Points(particleGeometry.current, particleMaterial);
        particle.position.x = -3
        // scene.add(particle)

        generateGalaxy(scene)


        /**
         * Raycaster
         * */
        raycaster.current = new THREE.Raycaster();

        //renderer
        renderer.current = new THREE.WebGLRenderer({canvas});
        renderer.current.shadowMap.enabled = true
        renderer.current.setSize(SIZES.width, SIZES.height)
        renderer.current.setPixelRatio(window.devicePixelRatio)
        renderer.current.render(scene, camera.current);
        tick(scene);
    };
    const generateGalaxy = (scene) => {
        if (_points.current !== null) {
            _geometry.current.dispose();
            _material.current.dispose();
            _scene.current.remove(_points.current)
        }
        const geometry = new THREE.BufferGeometry();
        _geometry.current = geometry;
        const positions = new Float32Array(parameters.count * 3);
        const colors = new Float32Array(parameters.count * 3);
        const insideColor = new THREE.Color(parameters.insideColor);
        const outsideColor = new THREE.Color(parameters.outsideColor);

        for (let i = 0; i < parameters.count; i++) {
            const i3 = i * 3;
            let radius = parameters.radius * Math.random();
            let spinAngle = radius * parameters.spin;
            const mixedColor = insideColor.clone();
            mixedColor.lerp(outsideColor, radius / parameters.branches)
            const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;
            const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
            const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)
            const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1)

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            //colors
            colors[i3] = mixedColor.r
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const geometryMaterial = new THREE.PointsMaterial({
            size: parameters.size,
            sizeAttenuation: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        })
        const textureLoader = new THREE.TextureLoader();
        geometryMaterial.alphaMap = textureLoader.load(ParticleMap)
        geometryMaterial.transparent = true
        _material.current = geometryMaterial;
        const points = new THREE.Points(geometry, geometryMaterial);
        _points.current = points;
        scene.add(points)
    }

    const tick = (scene,) => {
        orbitControl.current.update();
        animatePlanets();
        let elapsedTime = clock.current.getElapsedTime();

        //raycaster
        raycaster.current.setFromCamera(mousePointer.current, camera.current)
        const intersects = raycaster.current.intersectObjects(planets.current);
        if (intersects.length) {
            if (!currentIntersect.current) {
                _canvas.current.style.cursor = 'pointer'
                // SPEED_FACTOR.current = 0.2;
            }
            currentIntersect.current = intersects[0];
        } else {
            if (currentIntersect.current) {
                _canvas.current.style.cursor = 'default'
                // SPEED_FACTOR.current = 1
            }
            currentIntersect.current = null;
        }
        elapsedTime > 0.6 && moveCamera && animateCamera();
        particleGeometry.current.attributes.position.needsUpdate = true;
        starMesh.current.rotation.z += 0.0001
        starMesh.current.rotation.x += 0.0001
        starMesh.current.rotation.y += 0.0001
        renderer.current.render(scene, camera.current);
        window.requestAnimationFrame(() => tick(scene));
    };

    const animateCamera = () => {
        let elapsedTime = clock.current.getElapsedTime() * 0.045;
        if (camera.current.position.y <= -1.4 && camera.current.position.x <= -1.4) {
            camera.current.position.x -= (elapsedTime * 0.02);
            camera.current.position.z -= (elapsedTime * 0.02);
        } else if (camera.current.position.y >= -0.2) {
            camera.current.position.y -= (elapsedTime);
            camera.current.position.z -= (elapsedTime);
        } else {
            camera.current.rotation.y += (elapsedTime * 0.0002);
            camera.current.position.x -= (elapsedTime * 0.0002);

        }
    }
    const animatePlanets = () => {
        if (planets.current?.length) {
            planets.current?.forEach((item, index) => {
                let elapsedTime = clock.current.getElapsedTime() * (3 / PLANETS[index]?.key);
                item.position.x = Math.cos(elapsedTime * 0.3) * Math.abs(PLANETS[index]?.x);
                item.position.y = 0;
                item.position.z = Math.sin(elapsedTime * 0.3) * Math.abs(PLANETS[index]?.x);
            })
        }

    }
    return (<div className={"scene"}>
        <canvas className={"canvas"}/>
        {
            loading && <p className={'loading'}>Loading...</p>
        }
    </div>);
};
