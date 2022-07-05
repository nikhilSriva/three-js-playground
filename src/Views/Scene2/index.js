import './index.scss';
import {useEffect, useRef} from "react";
import * as THREE from "three";
import GUI from 'lil-gui';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

const SIZES = {width: window.innerWidth, height: window.innerHeight};

export const Scene2 = () => {
    const clock = useRef(new THREE.Clock())
    const cursor = useRef({x: 0, y: 0})
    const orbitControl = useRef(null);

    useEffect(() => {
        renderModel();
    }, []);

    const renderModel = () => {
        const initGui = () => {
            const gui = new GUI();
            const effectController = {
                showWireframe: true,
                showShadow: true
            }
            gui.add(effectController, 'showWireframe').onChange((value) => {
                if (value)
                    mesh.add(wireSphere)
                else mesh.remove(wireSphere)
            });
            // gui.add(effectController, 'showShadow').onChange((value) => {
            //     if (value) {
            //         light.position.set(5, 0, 0);
            //     } else {
            //         light.position.set(0, 0, 0);
            //     }
            //
            // });
            gui.add(effectController, 'quickSpin')

        }
        const scene = new THREE.Scene();
        const geometry = new THREE.IcosahedronGeometry(2, 1);
        const count = geometry.attributes.position.count;
        const color = new THREE.Color();
        //add color to the ico
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        const colorBuffer = geometry.attributes.color;

        //200 number of vertex
        for (let i = 0; i < 200; i++) {
            //generate random colors on it and set in the color buffer
            color.setHSL(Math.random(), 0.6, 0.45);
            colorBuffer.setXYZ(i * 3, color.r, color.g, color.b);
            colorBuffer.setXYZ(i * 2 + 1, color.r, color.g, color.b);
            colorBuffer.setXYZ(i + 2, color.r, color.g, color.b);
        }

        const material = new THREE.MeshLambertMaterial({
            vertexColors: true
        });

        ///created this wireframe type sphere to show border of triangles
        const wireSphere = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({color: 'black', wireframe: true, wireframeLinewidth: 10})
        );
        const mesh = new THREE.Mesh(geometry, material);
        mesh.add(wireSphere)
        scene.add(mesh);
        // scene.add(new THREE.AmbientLight(0x222222));

        //camera
        const camera = new THREE.PerspectiveCamera(70, SIZES.width / SIZES.height,);
        camera.position.set(0, 0, 6.5);
        scene.add(camera)

        //add shadow to left side
        let light = new THREE.DirectionalLight();
        light.position.set(5, 0, 0);
        camera.add(light);

        const canvas = document.querySelector('.canvas')
        orbitControl.current = new OrbitControls(camera, canvas)
        orbitControl.current.enableDamping = true
        //renderer
        const renderer = new THREE.WebGLRenderer({canvas});
        renderer.setSize(SIZES.width, SIZES.height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.render(scene, camera);
        initGui();
        tick(mesh, scene, camera, renderer, geometry);
    }

    const tick = (mesh, scene, camera, renderer, geometry) => {
        let elapsedTime = clock.current.getElapsedTime();
        mesh.rotation.y = 0.2 * elapsedTime;
        mesh.rotation.y = 0.2 * elapsedTime;
        mesh.rotation.z = 0.2 * elapsedTime;
        // geometry.rotateX(40)

        orbitControl.current.update();
        renderer.render(scene, camera)
        requestAnimationFrame(() => tick(mesh, scene, camera, renderer, geometry))
    }


    return <div className={'scene'}>
        <canvas className={'canvas'}/>
    </div>
}
