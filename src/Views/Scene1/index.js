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
        const scene = new THREE.Scene();
        scene.background = new THREE.CubeTextureLoader().load([
            '../../assets/textures/px_eso0932a.jpeg',
            '../../assets/textures/nx_eso0932a.jpeg',
            '../../assets/textures/py_eso0932a.jpeg',
            '../../assets/textures/ny_eso0932a.jpeg',
            '../../assets/textures/pz_eso0932a.jpeg',
            '../../assets/textures/nz_eso0932a.jpeg',
        ]);
        const cube = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2)
        const material = new THREE.MeshBasicMaterial({color: 'green', wireframe: true})
        const mesh = new THREE.Mesh(cube, material);
        mesh.position.set(-2, 0, 0)
        scene.add(mesh);

        const light1 = new THREE.SpotLight()
        light1.position.set(2.5, 5, 5)
        light1.angle = Math.PI / 4
        light1.penumbra = 0.5
        light1.castShadow = true
        light1.shadow.mapSize.width = 1024
        light1.shadow.mapSize.height = 1024
        light1.shadow.camera.near = 0.5
        light1.shadow.camera.far = 20
        scene.add(light1)

        const light2 = new THREE.SpotLight()
        light2.position.set(-2.5, 5, 5)
        light2.angle = Math.PI / 4
        light2.penumbra = 0.5
        light2.castShadow = true
        light2.shadow.mapSize.width = 1024
        light2.shadow.mapSize.height = 1024
        light2.shadow.camera.near = 0.5
        light2.shadow.camera.far = 20
        scene.add(light2)


        //camera
        const camera = new THREE.PerspectiveCamera(70, SIZES.width / SIZES.height,);
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
