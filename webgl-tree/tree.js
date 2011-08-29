var renderer, scene, camera,

    sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    rand = Math.random,
    floor = Math.floor,
    round = Math.round,
    PI = Math.PI,

    SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,

    // tree params
    MAX_BRANCHES = 4,
    MIN_BRANCHES = 3,

    RADIUS_SHRINK = 0.6,

    MIN_LENGTH_FACTOR = 0.5,
    MAX_LENGTH_FACTOR = 0.8,

    MIN_OFFSET_FACTOR = 0.7,

    MAX_SPREAD_RADIAN = PI / 4,
    MIN_SPREAD_RADIAN = PI / 10,

    BASE_LEAF_SCALE = 5,

    branch_counter;

    


function init() {

    ////setup track-ball camera
    //camera = new THREE.TrackballCamera({
        //fov: 45,
        //aspect: window.innerWidth / window.innerHeight,
        //near: 1,
        //far: 5000,

        //rotateSpeed: 1.0,
        //zoomSpeed: 1.2,
        //panSpeed: 0.8,

        //noZoom: false,
        //noPan: false,

        //staticMoving: true,
        //dynamicDampingFactor: 0.3,

        //keys: [65, 83, 68] rotate, zoom, pan
    //});
    camera = new THREE.Camera(45,
                              SCREEN_WIDTH / SCREEN_HEIGHT,
                              1,
                              5000);
    camera.position.set(500, 100, 400);
    camera.translate(200, new THREE.Vector3(0, 1, 0));

    // setup scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 500, 1500);

    // setup renderer
    renderer = new THREE.WebGLRenderer({ 
        clearColor: 0x000000, 
        clearAlpha: 1, 
        antialias: true 
    });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    renderer.setClearColor(scene.fog.color, 1);
    renderer.autoClear = false;

    renderer.shadowCameraNear = 3;
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 50;

    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;

    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;

    // create graphic container and attach the renderer to it
    container = document.createElement("div");
    document.body.appendChild(container);
    container.appendChild(renderer.domElement);

}


function drawTree(start_position, direction, length, depth, radius) {

    var cylinder, half_length_offset,
        new_position, new_direction, new_length, new_depth, new_radius,
        new_base_position, offset_vector,
        num_branches, color, num_segs;

    branch_counter--;

    // determine branch color
    if (depth < 3) {
        color = (rand() * 128 + 64) << 8; // random green color
    } else {
        color = ((rand() * 48 + 64) << 16) | 0x3311; // random brown color
    }

    num_segs = depth + 2; // min num_segs = 2
    cylinder = new THREE.Mesh(
           new THREE.CylinderGeometry(num_segs, // numSegs
                                      radius, // topRad
                                      radius * RADIUS_SHRINK, // botRad
                                      length, // height
                                      0,    // topOffset
                                      0),   // botOffset
           new THREE.MeshLambertMaterial({ color: color })
    );
    // rotate the cylinder to follow the direction
    cylinder.lookAt(direction);

    // get the offset from start position to cylinder center position
    half_length_offset = direction.clone();
    half_length_offset.setLength(length / 2);

    // calculate center position
    cylinder.position = start_position.clone();
    cylinder.position.addSelf(half_length_offset);

    cylinder.castShadow = true;
    cylinder.receiveShadow = false;

    scene.addObject(cylinder);

    // stop recursion if depth reached 1
    if (depth == 1) {
        return;
    }


    // calculate the base start position for next branch
    // a random offset will be added to it later
    new_base_position = start_position.clone();
    new_base_position.addSelf(
            half_length_offset.clone().multiplyScalar(2 * MIN_OFFSET_FACTOR));

    new_depth = depth - 1;
    new_radius = radius * RADIUS_SHRINK;

    // get a random branch number
    num_branches = round((rand() * (MAX_BRANCHES - MIN_BRANCHES))) 
                   + MIN_BRANCHES;


    // recursively draw the children branches
    for (var i = 0; i < num_branches; ++i) {

        // random spread radian
        var spread_radian = rand() * (MAX_SPREAD_RADIAN - MIN_SPREAD_RADIAN) + 
                            MIN_SPREAD_RADIAN;

        // generate a vector which is prependicular to the original direction
        var perp_vec = (new THREE.Vector3(1, 0, 0)).crossSelf(direction); 
        perp_vec.setLength(direction.length() * tan(spread_radian));

        // the new direction equals to the sum of the perpendicular vector
        // and the original direction
        new_direction = direction.clone().addSelf(perp_vec).normalize();

        // generate a rotation matrix to rotate the new direction with
        // the original direction being the rotation axis
        var rot_mat = new THREE.Matrix4();
        rot_mat.setRotationAxis(direction, PI * 2 / num_branches * i);
        rot_mat.rotateAxis(new_direction);

        // random new length for the next branch
        new_length = (rand() * (MAX_LENGTH_FACTOR - MIN_LENGTH_FACTOR) + 
                     MIN_LENGTH_FACTOR) * length;

        // caculate the position of the new branch
        new_position = new_base_position.clone();
        offset_vector = half_length_offset.clone();
        new_position.addSelf(
                offset_vector.multiplyScalar(
                    2 * i / (num_branches - 1) * (1 - MIN_OFFSET_FACTOR)));

        // using setTimeout to make the drawing procedure non-blocking
        setTimeout((function(a, b, c, d, e) {
            return function() {
                drawTree(a, b, c, d, e);
            };
        })(new_position, new_direction, new_length, new_depth, new_radius), 0);

        // more branches to draw, therefore increment the branch counter
        branch_counter++;
    }
}

function setupLights() {
    var ambient_light, main_light, auxilary_light, back_light;

    ambient_light = new THREE.AmbientLight(0x555555);
    scene.addLight(ambient_light);

    main_light = new THREE.SpotLight(0xffffff);
    main_light.position.set(0, 1000, 1000);
    main_light.castShadow = true;
    scene.addLight(main_light);
}



function drawCoordinate(center, length) {
    var othorgonals = [
        [new THREE.Vector3(length, 0, 0), 0xff0000],
        [new THREE.Vector3(0, length, 0), 0x00ff00],
        [new THREE.Vector3(0, 0, length), 0x0000ff]
    ];

    for (var i = 0; i < othorgonals.length; ++i) {
        var v = othorgonals[i][0],
            color = othorgonals[i][1];

        var geometry = new THREE.Geometry();

        geometry.vertices.push(new THREE.Vertex(center));
        geometry.vertices.push(new THREE.Vertex(center.clone().addSelf(v)));

        var line = new THREE.Line(
            geometry, 

            new THREE.LineBasicMaterial({
                color: color, 
                opacity: 1, 
                linewidth: 3
            })
        );

        scene.addObject(line);
    }
}


function drawGridPlane(center, length, segments) {

    // line geometry
    var geometry = new THREE.Geometry();    
    geometry.vertices.push(
            new THREE.Vertex(new THREE.Vector3(-length / 2, 0, 0)));
    geometry.vertices.push(
            new THREE.Vertex(new THREE.Vector3(length / 2, 0, 0)));

    // line material
    var material = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,
        opacity: 0.7,
        linewidth: 2
    });

    for (var i = 0; i <= segments; ++i) {
        var line = new THREE.Line(geometry, material);
        line.position = center.clone();
        line.position.z += (i * length / segments) - length / 2;
        scene.addObject(line);

        var line = new THREE.Line(geometry, material);
        line.position = center.clone();
        line.position.x += (i * length / segments) - length / 2
        line.rotation.y = PI / 2;
        scene.addObject(line);
    }
}

function drawGround() {
    var ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshLambertMaterial({ color: 0x777777 })
    );
    ground.rotation.x = - PI / 2;
    ground.scale.set(100, 100, 100);

    ground.castShadow = false;
    ground.receiveShadow = true;

    scene.addObject(ground);
}


function animate(update) {
    // continue the animation if there are branches not drawn
    if (branch_counter) {
        requestAnimationFrame(animate);
    }
    renderer.clear();
    renderer.render(scene, camera);
}



//function drawLeaf(position, direction, scale) {
    
    //// leaf vertices
    //var vertices = [
        //[0, 0, 0],
        //[1, 0, -1],
        //[0, 0, 2],
        //[-1, 0, -1],
    //];
    //vertices.forEach(function (v, i, a) {
        //a[i].forEach(function (vv, ii, aa) {
            //aa[ii] *= scale;
        //});
    //}); 

    //// leaf geometry
    //var geometry = new THREE.Geometry();
    //geometry.vertices = vertices.map(function (v) {
        //return new THREE.Vertex(
            //new THREE.Vector3(v[0], v[1], v[2])
        //);
    //});
    //geometry.faces.push(new THREE.Face3(0, 1, 2));
    //geometry.faces.push(new THREE.Face3(0, 2, 3));
    //geometry.faces.push(new THREE.Face3(0, 2, 1));
    //geometry.faces.push(new THREE.Face3(0, 3, 2));

    //geometry.computeCentroids();
    //geometry.computeFaceNormals();

    //// leaf material
    //var material = new THREE.MeshLambertMaterial({
        //color: 0x00ff00,
    //});

    //var leaf = new THREE.Mesh(geometry, material);
    //leaf.lookAt(direction);
    //leaf.position = position;

    //scene.addObject(leaf);
//}

window.onload = function () {

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    init();

    setupLights();

    drawGround();

    //drawCoordinate(new THREE.Vector3(0, 0, 0),  // center
                   //200);                        // length
    

    //drawGridPlane(new THREE.Vector3(0, 0, 0),  // center
                  //500,                         // length
                  //20);                         // num segs

    // Set the initial branch counter to 1
    // the animation will stop when the counter decreases to 0
    branch_counter = 1;

    drawTree(new THREE.Vector3(0, 0, 0), // start position
             new THREE.Vector3(0, 1, 0), // direction
             150,                        // length
             8,                          // depth
             10);                        // radius

    animate();
};
