import { BoidBox } from './boid'
import { type Predator } from './predator'
import * as THREE from 'three';

export class Renderer {

  canvas: HTMLCanvasElement;
  boundingBox: {width:number, height: number}
  stopped = false

  anim: number = 0

  boidNum = 0
  boxGap = 200
  depth = 200

  boidBox: BoidBox = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    front: 0,
    back: 0,
  }

  scene: THREE.Scene
  
  predatorMesh: THREE.Mesh
  predatorColor = 0x9b0000
  predator: Predator = {
    size: 40,
    x: 0,
    y: 0,
    exists: true
  }

  boidColor = 0xFFD700
  boidSize = 7

  worker: Worker

  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera

  constructor(
    canvas: HTMLCanvasElement, 
    boundingBox: {width:number, height: number}
  ){

    // let window size set boidNum
    this.boidNum = Math.min(boundingBox.width, boundingBox.height) < 768 ? 
      1000 : 1500
    // this.boidNum = 2000

    this.canvas = canvas
    this.boundingBox = boundingBox // screen
    
    // scene
    this.scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 20, boundingBox.width / boundingBox.height, 0.1, 5000 );
    camera.position.z = 2000;

    // predator
    const sphere = new THREE.SphereGeometry( this.predator.size, 32, 16 ); 
    const sphereMaterial = new THREE.MeshPhysicalMaterial({ 
      color: this.predatorColor,
      roughness: 0.5
    }); 
    this.predatorMesh = new THREE.Mesh( sphere, sphereMaterial ); 

    // lights
    const light = new THREE.AmbientLight( 0xffffff );
    const dLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight.position.set(-2000,7000,4000)
    const dLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
    dLight2.position.set(-2000,7000,4000)

    // renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
    });
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
    const points = new THREE.Points( geometry, material );
    
    // adding to scene
    this.scene.add(points);
    this.scene.add(this.predatorMesh);
    this.scene.add( light );
    this.scene.add( dLight );
    this.scene.add( dLight2 );

    // boidbox
    const { width, height, depth } = this.calculateBoidBox()

    this.renderer = renderer
    this.camera = camera
    
    const boids = [...new Array(this.boidNum)].map(() => {
      
      return {

        position: [
          Math.random() * width * (Math.random()<.5?-1:1),
          Math.random() * height * (Math.random()<.5?-1:1),
          Math.random() * depth * (Math.random()<.5?-1:1),
        ],

        // give them initial velocity
        velocity: [1,1,1]

      }

    })
    
    this.worker = new Worker(new URL("./worker.ts", import.meta.url),{
      type: 'module'
    });

    this.worker.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      if(data.positions){
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( data.positions, 3 ) );
        renderer.render( this.scene, camera );
      }
    }

    this.worker.postMessage(JSON.stringify({
      boids: boids,
      boidBox: this.boidBox,
      predator: this.predator
    }));

  }

  intersectPredator(x: number, y: number){
    return (
      ((this.predator.x + this.boundingBox.width/2) - x)**2 +
      ((this.predator.y + this.boundingBox.height/2) - y)**2
    ) < (this.predator.size**2)
  }

  setPredator(x: number, y: number){
    this.predator = { 
      size: this.predator.size,
      exists: true,
      x: (x - this.boundingBox.width/2), 
      y: (y - this.boundingBox.height/2) * -1
    }

    this.predatorMesh.position.x = this.predator.x
    this.predatorMesh.position.y = this.predator.y
    this.predatorMesh.position.z = 1

    this.worker.postMessage(JSON.stringify({
      predator: this.predator
    }));
  }

  removePredator(){
    // this.predator.exists = false
    // this.predator.x = -1000
    // this.predator.y = -1000
    // this.worker.postMessage(JSON.stringify({
    //   predator: this.predator
    // }));
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

    if(this.worker) this.worker.postMessage(JSON.stringify({
      boidBox: this.boidBox
    }));

    return { width, height, depth: this.depth }
  }
  

  // when resize happens
  changeBoundingBox(boundingBox: {width:number, height: number}){
    
    this.boundingBox = boundingBox
    this.renderer.clear()
    this.camera.aspect = boundingBox.width / boundingBox.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(boundingBox.width, boundingBox.height)

    this.calculateBoidBox()
  }

  drawBox(){
    // draw boidBox
    // this.context.beginPath()
    // this.context.moveTo(this.boidBox.left, this.boidBox.top)
    // this.context.lineTo(this.boidBox.right, this.boidBox.top)
    // this.context.lineTo(this.boidBox.right, this.boidBox.bottom)
    // this.context.lineTo(this.boidBox.left, this.boidBox.bottom)
    // this.context.lineTo(this.boidBox.left, this.boidBox.top)
    // this.context.strokeStyle = "red";
    // this.context.stroke();
  }

  draw(){

    // this.context.clearRect(
    //   -this.boundingBox.width/2, 
    //   -this.boundingBox.height/2, 
    //   this.boundingBox.width, 
    //   this.boundingBox.height
    // )
    
    // if(!this.predator.exists){

    //   let i = this.boids.length
    //   while(i--) this.boids[i].draw( this.boidBox )

    // }else{

    //   let i = this.boids.length
    //   while(i--) {
    //     if(this.boids[i].position[2]<=0) this.boids[i].draw( this.boidBox )
    //   }

    //   this.drawPredator()

    //   i = this.boids.length
    //   while(i--) {
    //     if(this.boids[i].position[2]>0) this.boids[i].draw( this.boidBox )
    //   }

    // }

    // this.drawBox()

  }

  drawPredator(){

    if(!this.predator) return;

    // this.context.beginPath();
    // this.context.arc(
    //   this.predator.x, 
    //   this.predator.y, 
    //   this.predator.size,
    //   0, 
    //   2 * Math.PI
    // );``
    
    // this.context.shadowColor = "red";
    // this.context.shadowBlur = 10
    // this.context.fillStyle = "#212121";
    // this.context.fill()
    // this.context.shadowBlur = 0

    // this.context.stroke()

  }

}