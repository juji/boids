import { type Predator } from './predator'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type BoidBox = {
  top: number
  left: number
  bottom: number,
  right: number
  front: number
  back: number  
}

export type BoidInit = {
  position: [number, number, number]
}

export default class Boids {

  boids:BoidInit[] = []
  boidsLength: number

  predatorAttr:Predator = {
    exists: true,
    size: 40,
    x: 0,
    y: 0,
    z: 0
  }

  predator: THREE.Mesh
  predatorColor = 0x9b0000

  boidColor = 0xFFD700
  boidSize = 11 // in firefox, this works better if it is set to 11

  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  geometry: THREE.BufferGeometry
  position: THREE.Float32BufferAttribute
  scene: THREE.Scene
  controls: OrbitControls

  sharedArray: Float32Array
  posCounter: Int8Array
  counterIndex = 0

  hasChanged: number[]
  prevTime: number = performance.now()
  frames = 0
  fps: number = 0
  boidBox: BoidBox

  sendFps: (fps: number) => void;
  arrLen: number = 0

  constructor(
    sharedArray: Float32Array,
    arrLen: number,
    posCounter: Int8Array,
    canvas: HTMLCanvasElement,
    boundingBox: { width:number, height: number },
    boidBox: BoidBox,
    sendFps: (fps: number) => void
  ){

    this.boidBox = boidBox
    this.sendFps = sendFps
    this.posCounter = posCounter
    this.hasChanged = new Array(this.posCounter.length).fill(0)
    this.sharedArray = sharedArray
    this.boidsLength = sharedArray.length / arrLen
    this.arrLen = arrLen

    // scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 
      15, 
      boundingBox.width / boundingBox.height, 
      0.1, 
      10000
    );

    camera.position.z = 5000;
    camera.position.x = 4000;
    camera.position.y = 1000;

    // predator
    const sphere = new THREE.SphereGeometry( this.predatorAttr.size ); 
    const sphereMaterial = new THREE.MeshPhysicalMaterial({ 
      color: this.predatorColor,
      roughness: 0.5
    }); 
    const predator = new THREE.Mesh( sphere, sphereMaterial ); 
    predator.position.x = this.predatorAttr.x
    predator.position.y = this.predatorAttr.y
    predator.position.z = 0

    // lights
    const light = new THREE.AmbientLight( 0xffffff );
    const dLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight.position.set(-3,5,4)
    const dLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight2.position.set(-3,5,4)

    // renderer
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
    renderer.setSize( boundingBox.width, boundingBox.height );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor( 0x000000, 0 )

    // Controls
    const controls = new OrbitControls( camera, canvas )
    controls.enableDamping = true
    controls.enablePan = false

    // boid
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.Float32BufferAttribute(
      sharedArray.reduce((a,b,i)=> {
        if(
          !(i % arrLen) ||
          !((i-1) % arrLen) ||
          !((i-2) % arrLen)
        ) a.push(b); 
        return a
      },[] as number[]),
      3
    )

    position.setUsage( THREE.StreamDrawUsage );
    geometry.setAttribute( 'position', position );

    const material = new THREE.PointsMaterial( { 
      color: this.boidColor,
      transparent: false
    });
    material.size = this.boidSize
    const boidPoints = new THREE.Points(geometry, material );


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
    scene.add( predator );
    scene.add( boidPoints );
    scene.add( light );
    scene.add( dLight );
    scene.add( dLight2 );
    scene.add(axesHelper)
    scene.add( boxHelper );
    
    this.geometry = geometry
    this.position = position
    this.renderer = renderer
    this.camera = camera
    this.scene = scene
    this.predator = predator
    this.controls = controls

    this.renderer.render( this.scene, this.camera );

  }

  setScreenSize( screenSize: { width:number, height: number }){
    this.renderer.clear()
    this.renderer.setSize( screenSize.width, screenSize.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.camera.aspect = screenSize.width / screenSize.height
    this.camera.updateProjectionMatrix()
  }

  setPredator( predatorAttr: Predator ){
    this.predatorAttr = {
      ...this.predatorAttr,
      ...predatorAttr
    }
    this.predator.position.x = this.predatorAttr.x
    this.predator.position.y = this.predatorAttr.y
    this.predator.position.z = 0
  }

  draw(){
    this.controls.update()
    this.renderer.render( this.scene, this.camera );
  }

  setPositions(){
    
    let counter = this.posCounter.length
    let counterLen = Math.ceil(this.boidsLength / counter)
    while(counter--) {

      if(!this.posCounter[counter]) continue;
      if(this.hasChanged[counter]) continue;
      
      this.hasChanged[counter] = 1
      let start = counter * counterLen
      let end = Math.min(start + counterLen, this.boidsLength)
      
      while(end--) {
        if(end<start) break;
        this.position.set([
          this.sharedArray[ end * this.arrLen + 0 ],
          this.sharedArray[ end * this.arrLen + 1 ],
          this.sharedArray[ end * this.arrLen + 2 ],  
        ], end*3)
      }
      
      this.geometry.attributes.position.needsUpdate = true
    }
    
    if( this.hasChanged.findIndex(v => !v) === -1 ){

      this.posCounter.fill(0)
      this.hasChanged.fill(0)

      // fps counter
      const time = performance.now();
      this.frames++;
      if (time > this.prevTime + 1000) {
        let fps = Math.round( ( this.frames * 1000 ) / ( time - this.prevTime ) );
        this.prevTime = time;
        this.frames = 0;
        this.sendFps(fps)
      }

    }

  }

}