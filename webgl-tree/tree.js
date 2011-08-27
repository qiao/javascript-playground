var renderer, scene, camera, stats,

    MAX_BRANCHES = 5,
    MIN_BRANCHES = 3,
    RADIUS_SHRINK = 0.6,
    MIN_LENGTH_FACTOR = 0.7,
    MAX_LENGTH_FACTOR = 1,
    MIN_OFFSET_FACTOR = 0.7,

    sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    rand = Math.random,
    floor = Math.floor,
    PI = Math.PI;


function init() {

    // setup renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // create graphic container and attach renderer to it
    container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(renderer.domElement);

    // setup track-ball camera
    camera = new THREE.TrackballCamera({
        fov:    45,
        aspect: window.innerWidth / window.innerHeight,
        near:   1,
        far:    10000,

        rotateSpeed: 1.0,
        zoomSpeed: 1.2,
        panSpeed: 0.8,

        noZoom: false,
        noPan: false,

        staticMoving: true,
        dynamicDampingFactor: 0.3,

        keys: [ 65, 83, 68] // rotate, zoom, pan
    });
    camera.position.set(500, 100, 400);
    camera.translate(200, new THREE.Vector3(0, 1, 0));

    // setup scene
    scene = new THREE.Scene();

    // setup stats
    stats = new Stats();
    stats.domElement.style.position = "absolute";
    stats.domElement.style.top = "0px";
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);

}


function drawTree(start_position, direction, length, depth, radius) {

    var cylinder, half_length_offset,
        new_position, new_direction, new_length, new_depth, new_radius,
        new_base_position, offset_vector,
        num_branches, color, num_segs;

    // determine branch color
    if (depth < 3) {
        color = floor(rand() * 128 + 64) << 8; // random green color
    } else {
        color = (floor(rand() * 48 + 64) << 16) + 0x3311; // random brown color
    }

    num_segs = depth + 1; // min num_segs = 2
    cylinder = new THREE.Mesh(
           new THREE.CylinderGeometry(num_segs,    // numSegs
                                      radius,    // topRad
                                      radius * RADIUS_SHRINK,    // botRad
                                      length,    // height
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
    num_branches = floor((rand() % (MAX_BRANCHES - MIN_BRANCHES))) 
                   + MIN_BRANCHES;

    // recursively generate child-branches
    for (var i = 0; i < num_branches; ++i) {

        new_direction = new THREE.Vector3(rand() - 0.5, 
                                          rand() - 0.5, 
                                          rand() - 0.5);
        new_direction.normalize();
        new_direction.addSelf(direction.clone().multiplyScalar(1.2));
        new_direction.normalize();
        
        new_length = rand() % (MAX_LENGTH_FACTOR - MIN_LENGTH_FACTOR) + 
                     MIN_LENGTH_FACTOR * length;

        new_position = new_base_position.clone();
        offset_vector = half_length_offset.clone();
        new_position.addSelf(
                offset_vector.multiplyScalar(
                    2 * i / (num_branches - 1) * (1 - MIN_OFFSET_FACTOR)));

        setTimeout((function(a, b, c, d, e) {
            return function() {
                drawTree(a, b, c, d, e);
            };
        })(new_position, new_direction, new_length, new_depth, new_radius), 0);

    }

}

function setupLights() {

    var ambient_light, main_light, auxilary_light, back_light;

    ambient_light = new THREE.AmbientLight(0x555555);
    scene.addLight(ambient_light);

    main_light = new THREE.DirectionalLight(0xffffff, // hex color
                                            1.0,      // intensity
                                            0,        // distance
                                            true);    // cast shadow
    main_light.position = new THREE.Vector3(1, 1, 1).normalize(); 
    scene.addLight(main_light);

    auxilary_light = new THREE.DirectionalLight(0xffffff,
                                                0.5,
                                                0,
                                                false); // shadow off
    auxilary_light.position = new THREE.Vector3(-1, 0.7, 1).normalize();
    scene.addLight(auxilary_light);

    back_light = new THREE.DirectionalLight(0xffffff,
                                            0.7,
                                            0,
                                            false);
    back_light.position = new THREE.Vector3(0, 0.5, -1).normalize();
    scene.addLight(back_light);

}



function drawCoordinate(center, length) {

    var othorgonals = [
        [
            new THREE.Vector3(length, 0, 0),
            0xff0000
        ],
        [
            new THREE.Vector3(0, length, 0),
            0x00ff00
        ],
        [
            new THREE.Vector3(0, 0, length),
            0x0000ff
        ]
    ];

    for (var i in othorgonals) {
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


function drawGridPlane(params) {
    var center   = params.center   || new THREE.Vector3(0, 0, 0),
        length   = params.length   || 500,
        segments = params.segments || 20;

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


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    stats.update();

}


function removeInfo() {
    (function(ele) {
        ele.parentNode.removeChild(ele)
    })(document.getElementById("info"));
}


window.onload = function() {

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        removeInfo();
        return;
    }
    init();

    setupLights();

    /*
    drawCoordinate(new THREE.Vector3(-250, 0, -250),  // center
                   200);                        // length
    */

    drawGridPlane(new THREE.Vector3(0, 0, 0),  // center
                  500,                         // length
                  20);                         // num segs

    drawTree(new THREE.Vector3(0, 0, 0), // start position
             new THREE.Vector3(0, 1, 0), // direction
             150,                        // length
             8,                          // depth
             10);                        // radius

    animate();
};
