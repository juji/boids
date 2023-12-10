import { type Predator } from './predator'
import Boid,{ BoidBox, BoidInit } from './boid'
import * as THREE from 'three';

export default class Boids {

  boids:Boid[] = []
  boidBox: BoidBox = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    front: 0,
    back: 0,
  }

  predatorAttr:Predator = {
    exists: true,
    size: 40,
    x: 0,
    y: 0
  }

  predator: THREE.Mesh
  predatorColor = 0x9b0000

  boidColor = 0xFFD700
  boidSize = 11 // in firefox, this works better if it is set to 11

  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  geometry: THREE.BufferGeometry
  scene: THREE.Scene

  data: number[] = []

  constructor(
    boids: BoidInit[],
    canvas: OffscreenCanvas,
    boundingBox: { width:number, height: number }
  ){

    console.log({
      boids,
      canvas,
      boundingBox,
    })

    this.boids = boids.map((boid : BoidInit) => {
      
      return new Boid({
        position: boid.position,
        velocity: boid.velocity
      })

    });

    // scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 15, boundingBox.width / boundingBox.height, 0.1, 5000 );
    camera.position.z = 3000;

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
    renderer.setSize( boundingBox.width, boundingBox.height, false);
    renderer.setClearColor( 0x000000, 0 )
    renderer.autoClear = true

    // boid
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial( { 
      color: this.boidColor,
      transparent: false
    });
    material.size = this.boidSize
    const boidPoints = new THREE.Points(geometry, material );
    
    // adding to scene
    scene.add( predator );
    scene.add( boidPoints );
    scene.add( light );
    scene.add( dLight );
    scene.add( dLight2 );
    
    this.geometry = geometry
    this.renderer = renderer
    this.camera = camera
    this.scene = scene
    this.predator = predator

  }

  setBoundingBox( boundingBox: { width:number, height: number }){
    this.renderer.clear()
    this.renderer.setSize( boundingBox.width, boundingBox.height, false);
    this.camera.aspect = boundingBox.width / boundingBox.height
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

  setBoidBox( boidBox: BoidBox ){
    this.boidBox = boidBox
  }

  draw(){
    this.geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( this.data, 3 ) );
    this.renderer.render( this.scene, this.camera );
  }

  calculate(){
    this.loop()
    this.data = []
    let i = this.boids.length
    while(i--) {
      this.boids[i].calculate( this.boidBox )
      this.data.push(this.boids[i].position[0])
      this.data.push(this.boids[i].position[1])
      this.data.push(this.boids[i].position[2])
    }
  }

  loop(){

    // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html

    const { boids, predatorAttr:predator } = this

    // visible range is a range
    const visibleRange = 40 + Math.random() * 40

    // Separation
    const avoidFactor = 0.05
    const protectedRange = 20

    // Alignment
    const matchingfactor = 0.05

    // Cohesion
    const centeringFactor = 0.0005

    // Predator
    const predatorturnfactor = 1
    const predatoryRange = (predator.size || 0) * 2


    let i = boids.length
    while(i--) {

      boids[i].accelleration[0] = 0
      boids[i].accelleration[1] = 0
      boids[i].accelleration[2] = 0

      // Separation
      let closeDx = 0
      let closeDy = 0
      let closeDz = 0

      let neighboringBoids = 0

      // Alignment
      let xVelAvg = 0
      let yVelAvg = 0
      let zVelAvg = 0

      // Cohesion
      let xPosAvg = 0
      let yPosAvg = 0
      let zPosAvg = 0
      

      let j = boids.length
      while(j--) {
        if(j===i) continue;

        const distance = Math.sqrt(
          (boids[j].position[0] - boids[i].position[0])**2 +
          (boids[j].position[1] - boids[i].position[1])**2 +
          (boids[j].position[2] - boids[i].position[2])**2
        )
        
        // Separation
        if(distance < protectedRange){
          closeDx += boids[i].position[0] - boids[j].position[0]
          closeDy += boids[i].position[1] - boids[j].position[1]
          closeDz += boids[i].position[2] - boids[j].position[2]
        }

        if(distance < visibleRange){

          // Alignment
          xVelAvg += boids[j].velocity[0] 
          yVelAvg += boids[j].velocity[1] 
          zVelAvg += boids[j].velocity[2] 

          // Cohesion
          xPosAvg += boids[j].position[0]
          yPosAvg += boids[j].position[1]
          zPosAvg += boids[j].position[2]

          neighboringBoids++

        }

      }

      // Separation
      boids[i].accelleration[0] += closeDx * avoidFactor
      boids[i].accelleration[1] += closeDy * avoidFactor
      boids[i].accelleration[2] += closeDz * avoidFactor
      
      if(neighboringBoids){
        
        // Alignment
        xVelAvg /= neighboringBoids
        yVelAvg /= neighboringBoids
        zVelAvg /= neighboringBoids
        boids[i].accelleration[0] += (xVelAvg - boids[i].velocity[0]) * matchingfactor
        boids[i].accelleration[1] += (yVelAvg - boids[i].velocity[1]) * matchingfactor
        boids[i].accelleration[2] += (zVelAvg - boids[i].velocity[2]) * matchingfactor

        // Cohesion
        xPosAvg /= neighboringBoids
        yPosAvg /= neighboringBoids
        zPosAvg /= neighboringBoids
        boids[i].accelleration[0] += (xPosAvg - boids[i].position[0]) * centeringFactor
        boids[i].accelleration[1] += (yPosAvg - boids[i].position[1]) * centeringFactor
        boids[i].accelleration[2] += (zPosAvg - boids[i].position[2]) * centeringFactor

      }

      if(predator.exists){

        const predatorDx = boids[i].position[0] - predator.x
        const predatorDy = boids[i].position[1] - predator.y
        const predatorDz = boids[i].position[2] - 0 // predator z is always 0

        const predatorDistance = Math.sqrt(
          predatorDx**2 + predatorDy**2 + predatorDz**2
        )

        if(predatorDistance < predatoryRange){
          boids[i].accelleration[0] += predatorturnfactor * (predatorDx/Math.abs(predatorDx))
          boids[i].accelleration[1] += predatorturnfactor * (predatorDy/Math.abs(predatorDy))
          boids[i].accelleration[2] += predatorturnfactor * (predatorDz/Math.abs(predatorDz))
        }
        
      }

    }

  }


}