var renderer, scene, camera, stats,

    /*
    initPos = new THREE.Vector3(700, 50, 1900),
    initLight = new THREE.Vector3(0, 1500, 1000),
    deltaCam = new THREE.Vector3(),
    */

    sceneHUD, hudMaterial, cameraOtho,

    SHADOW_MAP_WIDTH = 1024,
    SHADOW_MAP_HEIGHT = 1024,

    SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,

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

function createHUD() {

    cameraOrtho = new THREE.Camera( 45, SHADOW_MAP_WIDTH / SHADOW_MAP_HEIGHT, 5, 3000 );
    cameraOrtho.projectionMatrix = THREE.Matrix4.makeOrtho( SCREEN_WIDTH / - 2, SCREEN_WIDTH / 2,  
            SCREEN_HEIGHT / 2, SCREEN_HEIGHT / - 2, -10, 1000 );
    cameraOrtho.position.z = 10;

    var shader = THREE.ShaderUtils.lib[ "screen" ];
    var uniforms = new THREE.UniformsUtils.clone( shader.uniforms );

    hudMaterial = new THREE.MeshShaderMaterial( { vertexShader: shader.vertexShader, 
        fragmentShader: shader.fragmentShader, uniforms: uniforms } );

    var hudGeo = new THREE.PlaneGeometry( SHADOW_MAP_WIDTH / 2, SHADOW_MAP_HEIGHT / 2 );
    var hudMesh = new THREE.Mesh( hudGeo, hudMaterial );
    hudMesh.position.x = ( SCREEN_WIDTH - SHADOW_MAP_WIDTH / 2 ) * -0.5;
    hudMesh.position.y = ( SCREEN_HEIGHT - SHADOW_MAP_HEIGHT / 2 ) * -0.5;

    sceneHUD = new THREE.Scene();
    sceneHUD.addObject( hudMesh );

}

function init() {

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

    /*
    // SHADOW TEXTURE
    var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
    shadowTexture = new THREE.WebGLRenderTarget( SHADOW_MAP_WIDTH, SHADOW_MAP_HEIGHT, pars );
    */

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 500, 1500);

    setupLights();

    /*
    createHUD();
    */
    drawGround();

    drawTree(new THREE.Vector3(0, 0, 0), // start position
             new THREE.Vector3(0, 1, 0), // direction
             150,                        // length
             8,                          // depth
             10);                        // radius

    // setup scene
    renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: true } );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    renderer.setClearColor( scene.fog.color, 1 );
    renderer.autoClear = false;

    renderer.shadowCameraNear = 3;
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 50;

    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;
    renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
    renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;

    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;


// setup renderer
    /*
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    renderer.shadowCameraNear = 3;
    renderer.shadowCameraFar = 3000;
    renderer.shadowCameraFov = 45;

    renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
    renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;
    renderer.shadowMapEnabled = true;
    */

    // create graphic container and attach renderer to it
    container = document.createElement("div");
    document.body.appendChild(container);
    container.appendChild(renderer.domElement);



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
        color = (rand() * 128 + 64) << 8; // random green color
    } else {
        color = ((rand() * 48 + 64) << 16) | 0x3311; // random brown color
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

    cylinder.castShadow = true;
    cylinder.receiveShadow = true;

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
    //
    // TODO: use SpotLight instead of DirectionalLight

    var ambient_light, main_light, auxilary_light, back_light;

    ambient_light = new THREE.AmbientLight(0x555555);
    scene.addLight(ambient_light);

    light = new THREE.SpotLight(0xffffff);
    light.position.set(0, 1500, 1000);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    scene.addLight(light);

    /*
    light = new THREE.DirectionalLight(0xffffff, // hex color
                                            1.0,      // intensity
                                            0,        // distance
                                            true);    // cast shadow
    light.position = new THREE.Vector3(1, 1, 1).normalize(); 
    light.castShadow = true;
    scene.addLight(light);
    */

    /*
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
    */

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


function animate() {
    requestAnimationFrame(animate);
    renderer.clear();
    renderer.render(scene, camera);
    stats.update();
}


function removeInfo() {
    (function (ele) {
        ele.parentNode.removeChild(ele)
    })(document.getElementById("info"));
}


window.onload = function () {

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        removeInfo();
        return;
    }

    init();


    /*
    drawCoordinate(new THREE.Vector3(0, 0, 0),  // center
                   200);                        // length
    

    /*
    drawGridPlane(new THREE.Vector3(0, 0, 0),  // center
                  500,                         // length
                  20);                         // num segs
                  */


    animate();
};
