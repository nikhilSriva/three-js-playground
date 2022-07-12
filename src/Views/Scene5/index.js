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
import MarsBumpTex from '../../assets/textures/marsbump1k.jpg'

const SIZES = {width: window.innerWidth, height: window.innerHeight};
const PLANETS = [{
    key: 1, bumpMap: MercuryBumpTex, texture: MercuryTexture, x: -1.4, radius: 0.1
}, {
    key: 2, bumpMap: VenusBumpTex, texture: VenusTex, x: -2.6, radius: 0.34
}, {
    key: 3, bumpMap: EarthBumpTex, texture: EarthTexture, x: -3.7, radius: 0.4
}, {
    key: 3, bumpMap: MarsBumpTex, texture: MarsTex, x: -5.2, radius: 0.15
}, {
    key: 5, bumpMap: null, texture: JupiterTex, x: -10.5, radius: 0.6
}]
export const Scene5 = () => {
    const clock = useRef(new THREE.Clock())
    const camera = useRef(null);
    const [loading, setLoading] = useState(false);
    const renderer = useRef(null);
    const directionalLight = useRef(null);
    const pointLight = useRef(null);
    const orbitControl = useRef(null);
    const spotlight = useRef(null);
    const isPointLightAnimating = useRef(false);
    const starMesh = useRef(null);
    const planets = useRef([]);
    const mousePointer = useRef({x: null, y: null});

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
        // window.addEventListener("mousemove", onPointMove);

        return () => {
            window.removeEventListener("resize", onResize);
            // window.removeEventListener("mousemove", onPointMove);
        };
    }, []);

    const onPointMove = (event) => {
        // calculate pointer position in normalized device coordinates
        mousePointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mousePointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    const renderModel = () => {
        const scene = new THREE.Scene();
        const manager = new THREE.LoadingManager();

        const textureLoader = new THREE.TextureLoader(manager);
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
        PLANETS.forEach(planet => {
            const item = new THREE.Mesh(
                new THREE.SphereGeometry(planet.radius, 32, 32),
                new THREE.MeshStandardMaterial({
                    bumpMap: textureLoader.load(planet.bumpMap),
                    map: textureLoader.load(planet.texture)
                }))
            item.position.x = planet.x;
            planets.current.push(item);
            scene.add(item)
        })
        scene.add(sun);
        //camera
        camera.current = new THREE.PerspectiveCamera(70, SIZES.width / SIZES.height,);
        camera.current.position.set(0, 6, 10);
        scene.add(camera.current)

        const canvas = document.querySelector('.canvas')
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
        sun.add(pointLight)

        //renderer
        renderer.current = new THREE.WebGLRenderer({canvas});
        renderer.current.setSize(SIZES.width, SIZES.height)
        renderer.current.setPixelRatio(window.devicePixelRatio)
        renderer.current.render(scene, camera.current);
        tick(scene);
        // tick(scene);
    };

    const tick = (scene,) => {
        orbitControl.current.update();
        animatePlanets()
        starMesh.current.rotation.z += 0.0001
        starMesh.current.rotation.x += 0.0001
        starMesh.current.rotation.y += 0.0001
        renderer.current.render(scene, camera.current);
        window.requestAnimationFrame(() => tick(scene));
    };
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
