import Predator from './predator'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import BoidBox from './boidBox';

export default class Boids {

  predator : Predator

  predatorBall: THREE.Mesh
  predatorColor = 0x9b0000

  boidColor = 0xFFD700
  boidSize = 11 // in firefox, this works better if it is set to 11

  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  geometry: THREE.BufferGeometry
  position: THREE.Float32BufferAttribute
  scene: THREE.Scene
  controls: OrbitControls
  boidPoints: THREE.Points

  counterIndex = 0
  boidBox: BoidBox

  constructor(obj: {
    canvas: HTMLCanvasElement,
    boundingBox: { width:number, height: number },
    boidBox: BoidBox,
    predator: Predator,
    initialPos: number[],
    customShaderMaterial?: THREE.ShaderMaterial
    geometryAttribute?: { [key:string]: THREE.BufferAttribute | THREE.InterleavedBufferAttribute }
  }){

    this.boidBox = obj.boidBox
    this.predator = obj.predator

    // scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 
      10, 
      obj.boundingBox.width / obj.boundingBox.height, 
      0.1, 
      100000
    );

    camera.position.z = 7000;
    camera.position.x = 4000;
    camera.position.y = 1000;

    // predator
    const sphere = new THREE.SphereGeometry( this.predator.size ); 
    const sphereMaterial = new THREE.MeshPhysicalMaterial({ 
      color: this.predatorColor,
      roughness: 0.5
    }); 
    const predatorBall = new THREE.Mesh( sphere, sphereMaterial ); 
    predatorBall.position.x = this.predator.x
    predatorBall.position.y = this.predator.y
    predatorBall.position.z = this.predator.z

    // lights
    const light = new THREE.AmbientLight( 0xffffff );
    const dLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight.position.set(-3,5,4)
    const dLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight2.position.set(-3,5,4)

    // renderer
    const renderer = new THREE.WebGLRenderer({ canvas: obj.canvas, alpha: false });
    renderer.setSize( obj.boundingBox.width, obj.boundingBox.height );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor( 0x000000, 0 )

    // Controls
    const controls = new OrbitControls( camera, obj.canvas )
    controls.enableDamping = true
    controls.enablePan = false

    // boid
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.Float32BufferAttribute(obj.initialPos, 3)
    position.setUsage( THREE.StreamDrawUsage );
    geometry.setAttribute( 'position', position );
    if(obj.geometryAttribute){
      Object.keys(obj.geometryAttribute).forEach(key => {
        if(!obj.geometryAttribute) return;
        if(!obj.geometryAttribute[key]) return;
        geometry.setAttribute(key, obj.geometryAttribute[key])
      })
    }

    // console.log(obj.customShaderMaterial)
    const material = obj.customShaderMaterial ? obj.customShaderMaterial : new THREE.PointsMaterial( { 
      color: this.boidColor,
      transparent: false,
      size: this.boidSize
    });
    const boidPoints = new THREE.Points( geometry, material );

    // helpers
    const axesHelper = new THREE.AxesHelper( 100 );
    const box = new THREE.Box3();
    box.setFromCenterAndSize( 
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( 
        this.boidBox.right - this.boidBox.left,
        this.boidBox.bottom - this.boidBox.top, 
        this.boidBox.front - this.boidBox.back, 
      ),
    );
    const boxHelper = new THREE.Box3Helper( box, 0x980000 );
    
    // adding to scene
    scene.add( predatorBall );
    scene.add( boidPoints );
    scene.add( light );
    scene.add( dLight );
    scene.add( dLight2 );
    scene.add(axesHelper)
    scene.add( boxHelper );
    
    this.geometry = geometry
    this.position = position
    this.renderer = renderer
    this.boidPoints = boidPoints
    this.camera = camera
    this.scene = scene
    this.predatorBall = predatorBall
    this.controls = controls
    this.renderer.render( this.scene, this.camera );

  }

  setScreenSize( screenSize: { width:number, height: number }){
    this.renderer.clear()
    this.renderer.setSize( screenSize.width, screenSize.height );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.camera.aspect = screenSize.width / screenSize.height
    this.camera.updateProjectionMatrix()
  }

  draw(){
    this.controls.update()
    this.renderer.render( this.scene, this.camera );
  }

}