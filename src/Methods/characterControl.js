/***************************************************************************************************************
 * Translation Approach
 **************************************************************************************************************/

/**
 Use this along to change character position third person cam style
 * */
/*
if (crouch.current) {
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
camera.current.lookAt(person.current.position.x, person.current.position.y, person.current.position.z);*/

/**
 - For collision boundaries, use raycaster approach
 * */
/*
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
}*/


/***************************************************************************************************************
 * Bounding Box Approach
 **************************************************************************************************************/


/**
 construct each mesh's bounding box
 * */
/*
mesh.BBox = new THREE.Box3().setFromObject(mesh);
mesh.BBoxHelper = new THREE.BoxHelper(mesh, 0xff0000);
_scene.current.add(mesh.BBoxHelper);
*/

/**
 add this boxHelper in animation loop for easy debugging
 also update character's Box
 **/
/*

 person.current.BBox.setFromObject(person.current);

 if (person.current)
    person.current.BBoxHelper.update();
*/

/**
 Store characters positions in a vector, so that later on collision detection we can position the char
 back to its non-colliding position
 **/
/*
prevPositions.current.unshift(person.current.position.clone());
prevPositions.current.pop();
*/

/**
 * Add this collisionCheck in animation loop. Check for collisions and do whatever you want if it's true
 * */
/*
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
*/

/**
 * Add this in animation loop, if you wanna see where your raycaster is pointing
 * */
/*
_scene.current.remove(arrow.current)
arrow.current = new THREE.ArrowHelper(raycaster.current.ray.direction, raycaster.current.ray.origin, 100, Math.random() * 0xffffff)
_scene.current.add(arrow.current)
*/

/**
 * Create convexPolyhedron for Cannon Body
 * */
/*

const positions = object.geometry.attributes.position.array
const points = []
for (let i = 0; i < positions.length; i += 3) {
    points.push(new CANNON.Vec3(positions[i], positions[i + 1], positions[i + 2]))
}
const faces = []
for (let i = 0; i < positions.length / 3; i += 3) {
    faces.push([i, i + 1, i + 2])
}
let shape = new CANNON.ConvexPolyhedron({
    vertices:points,
    faces
});
*/
