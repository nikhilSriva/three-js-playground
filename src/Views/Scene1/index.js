import './index.scss';
import {useEffect, useRef} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

const SIZES = {width: window.innerWidth, height: window.innerHeight};

export const Scene1 = () => {
    const clock = useRef(new THREE.Clock())
    const cursor = useRef({x: 0, y: 0})
    const orbitControl = useRef(null);

    useEffect(() => {
        renderModel();
    }, []);

    const renderModel = () => {
        const scene = new THREE.Scene()
        const cube = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshBasicMaterial({color: 'green'})
        const mesh = new THREE.Mesh(cube, material);
        scene.add(mesh);

        //camera
        const camera = new THREE.PerspectiveCamera(74, SIZES.width / SIZES.height,);
        camera.position.set(0, 0, 4);
        scene.add(camera)

        const canvas = document.querySelector('.canvas')
        orbitControl.current = new OrbitControls(camera, canvas)
        orbitControl.current.enableDamping = true
        //renderer
        const renderer = new THREE.WebGLRenderer({canvas});
        renderer.setSize(SIZES.width, SIZES.height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.render(scene, camera);
        tick(mesh, scene, camera, renderer);
    }

    const tick = (mesh, scene, camera, renderer) => {
        orbitControl.current.update()
        renderer.render(scene, camera)
        window.requestAnimationFrame(() => tick(mesh, scene, camera, renderer))
    }
    return <div className={'scene'}>
        <canvas className={'canvas'}/>
    </div>
}
