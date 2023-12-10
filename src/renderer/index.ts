import { BoidBox } from './boid'
import { type Predator } from './predator'
import * as THREE from 'three';

export class Renderer {

  boundingBox: {width:number, height: number}

  boidNum = 0
  boxGap = 200
  depth = 100

  boidBox: BoidBox = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    front: 0,
    back: 0,
  }
  
  predator: THREE.Mesh
  predatorColor = 0x9b0000
  predatorAttr: Predator = {
    size: 40,
    x: 0,
    y: 0,
    exists: true
  }

  boidColor = 0xFFD700
  boidSize = 11 // in firefox, this works better if it is set to 11

  worker: Worker

  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera

  constructor(
    canvas: HTMLCanvasElement, 
    boundingBox: {width:number, height: number}
  ){

    // let window size set boidNum
    this.boidNum = Math.min(boundingBox.width, boundingBox.height) < 768 ? 1000 : 1500
    this.boundingBox = boundingBox // screen
    
    // scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 15, boundingBox.width / boundingBox.height, 0.1, 5000 );
    camera.position.z = 3000;

    // predator
    const sphere = new THREE.SphereGeometry( this.predatorAttr.size, 32, 16 ); 
    const sphereMaterial = new THREE.MeshPhysicalMaterial({ 
      color: this.predatorColor,
      roughness: 0.5
    }); 
    this.predator = new THREE.Mesh( sphere, sphereMaterial ); 

    // lights
    const light = new THREE.AmbientLight( 0xffffff );
    const dLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight.position.set(-2000,7000,4000)
    const dLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight2.position.set(-2000,7000,4000)

    // renderer
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
    renderer.setSize( boundingBox.width, boundingBox.height);
    renderer.setClearColor( 0x000000, 0 )
    renderer.autoClear = true

    // boid
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial( { 
      color: this.boidColor,
      transparent: false
    });
    material.size = this.boidSize
    const boids = new THREE.Points( geometry, material );
    
    // adding to scene
    scene.add(boids);
    scene.add(this.predator);
    scene.add( light );
    scene.add( dLight );
    scene.add( dLight2 );
    
    this.renderer = renderer
    this.camera = camera
    
    // worker
    this.worker = new Worker(new URL("./worker.ts", import.meta.url),{
      type: 'module'
    });
    
    this.worker.onmessage = (e: MessageEvent) => {
      if(e.data.positions){
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( e.data.positions, 3 ) );
        renderer.render( scene, camera );
      }
    }

    // boidbox
    const { width, height, depth } = this.calculateBoidBox()
    this.worker.postMessage({
      boids: [...new Array(this.boidNum)].map(() => {
        return {
          position: [
            Math.random() * width * (Math.random()<.5?-1:1),
            Math.random() * height * (Math.random()<.5?-1:1),
            Math.random() * depth * (Math.random()<.5?-1:1),
          ],
          // give them initial velocity
          velocity: [1,1,1]
        }
        
      }),
      boidBox: this.boidBox,
      predator: this.predatorAttr
    });

  }

  setPredator(x: number, y: number){
    this.predatorAttr = { 
      ...this.predatorAttr,
      x: (x - this.boundingBox.width/2), 
      y: (y - this.boundingBox.height/2) * -1
    }

    this.predator.position.x = this.predatorAttr.x
    this.predator.position.y = this.predatorAttr.y
    this.predator.position.z = 1

    this.worker.postMessage({
      predator: this.predatorAttr
    });
  }

  // when resize happens
  changeBoundingBox(boundingBox: {width:number, height: number}){
    
    this.boundingBox = boundingBox
    this.calculateBoidBox()

    this.renderer.clear()
    this.camera.aspect = boundingBox.width / boundingBox.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(boundingBox.width, boundingBox.height)

  }

  calculateBoidBox(){
    const width = this.boundingBox.width/2
    const height = this.boundingBox.height/2
    const smaller = Math.min(width, height)

    this.boxGap = 3 * smaller / 10

    this.boidBox = {
      top: (-height/2) + this.boxGap,
      left: (-width) + this.boxGap,
      bottom: (height/2) - this.boxGap,
      right: (width) - this.boxGap,
      front: this.depth - this.boxGap,
      back: -this.depth + this.boxGap
    }

    if(this.worker) this.worker.postMessage({
      boidBox: this.boidBox
    });

    return { width, height, depth: this.depth }
  }

}