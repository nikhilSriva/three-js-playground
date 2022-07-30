import CANNON from "cannon-es";
import * as THREE from "three";
import {ConvexGeometry} from "three/examples/jsm/geometries/ConvexGeometry";

function convertConvexHullToTrimesh(convexHull) {
    let vertices, geometry = convexHull.geometry;
    if (geometry.index === null) {
        vertices = geometry.attributes.position.array
    } else {
        vertices = geometry.attributes.position.array
    }
    const indices = Object.keys(vertices).map(Number)
    return new CANNON.Trimesh(vertices, indices)
}

function createConvexHull(monkey) {
    const position = monkey.geometry.attributes.position.array
    const points = []
    for (let i = 0; i < position.length; i += 3) {
        points.push(new THREE.Vector3(position[i], position[i + 1], position[i + 2]))
    }
    const convexGeometry = new ConvexGeometry(points)
    let convexHull = new THREE.Mesh(convexGeometry, new THREE.MeshBasicMaterial({
        color: 0x0000ff, wireframe: true,
    }))
    // monkey.add(convexHull)
    return convexHull
}

const createConvexPolyhedron = (geometry) => {
    const position = geometry.attributes.position
    const normal = geometry.attributes.normal
    const vertices = []
    for (let i = 0; i < position.count; i++) {
        vertices.push(new THREE.Vector3().fromBufferAttribute(position, i))
    }
    const faces = []
    for (let i = 0; i < position.count; i += 3) {
        const vertexNormals = normal === undefined ? [] : [new THREE.Vector3().fromBufferAttribute(normal, i), new THREE.Vector3().fromBufferAttribute(normal, i + 1), new THREE.Vector3().fromBufferAttribute(normal, i + 2),]
        const face = {
            a: i, b: i + 1, c: i + 2, normals: vertexNormals,
        }
        faces.push(face)
    }

    const verticesMap = {}
    const points = []
    const changes = []
    for (let i = 0, il = vertices.length; i < il; i++) {
        const v = vertices[i]
        const key = Math.round(v.x * 100) + '_' + Math.round(v.y * 100) + '_' + Math.round(v.z * 100)
        if (verticesMap[key] === undefined) {
            verticesMap[key] = i
            points.push(new CANNON.Vec3(vertices[i].x, vertices[i].y, vertices[i].z))
            changes[i] = points.length - 1
        } else {
            changes[i] = changes[verticesMap[key]]
        }
    }

    const faceIdsToRemove = []
    for (let i = 0, il = faces.length; i < il; i++) {
        const face = faces[i]
        face.a = changes[face.a]
        face.b = changes[face.b]
        face.c = changes[face.c]
        const indices = [face.a, face.b, face.c]
        for (let n = 0; n < 3; n++) {
            if (indices[n] === indices[(n + 1) % 3]) {
                faceIdsToRemove.push(i)
                break
            }
        }
    }

    for (let i = faceIdsToRemove.length - 1; i >= 0; i--) {
        const idx = faceIdsToRemove[i]
        faces.splice(idx, 1)
    }

    const cannonFaces = faces.map(function (f) {
        return [f.a, f.b, f.c]
    })

    return new CANNON.ConvexPolyhedron({
        vertices: points, faces: cannonFaces,
    })
}
