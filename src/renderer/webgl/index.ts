import Predator from '../items/predator'
import Boids from '../items/boids'
import BoidBox from '../items/boidBox'
import { calculator } from './calculator'

import boidVertexShader from './boidVertex.glsl'
import boidFragmentShader from './boidFragment.glsl'
import * as THREE from 'three';

export class Renderer {

  boids: Boids
  boidBox: BoidBox
  predator: Predator
  
  boidNum = 500
  canvas: HTMLCanvasElement

  // arrLen per boid
  arrLen = 7

  //
  reportFps: (fps: number) => void
  prevTime: number = performance.now()
  frames = 0
  setCounter = false

  // log
  // log = true

  //
  calculator: {
    compute: () => void
  }

  dotSize = 1.3

  constructor(par: {
    canvas: HTMLCanvasElement,
    boidNum: number,
    screen: { width:number, height: number },
    reportFps: (fps: number) => void
  }){

    const {
      canvas,
      boidNum,
      screen,
      reportFps,
    } = par

    if(!boidNum) throw new Error('boidNum is falsy')

    const computationSize = Math.ceil(Math.sqrt(boidNum))
    this.boidNum = computationSize ** 2

    this.canvas = canvas
    this.reportFps = reportFps
    this.predator = new Predator()
    
    // boidbox
    this.boidBox = new BoidBox()

    let boidArr: number[] = []
    ;[...new Array(this.boidNum)].map((_,i) => {

      const position = [
        // /* -> toggle
        // outside boidBox
        Math.random() * this.boidBox.width * (Math.random()<.5?-1:1),
        Math.random() * this.boidBox.height * (Math.random()<.5?-1:1),
        Math.random() * this.boidBox.depth * (Math.random()<.5?-1:1),
      ]

      // set sharedArray
      boidArr[ (i * this.arrLen) + 0 ] = position[0]
      boidArr[ (i * this.arrLen) + 1 ] = position[1]
      boidArr[ (i * this.arrLen) + 2 ] = position[2]

      // veolocity
      boidArr[ (i * this.arrLen) + 3 ] = Math.random() < 0.5 ? -1 : 1
      boidArr[ (i * this.arrLen) + 4 ] = Math.random() < 0.5 ? -1 : 1
      boidArr[ (i * this.arrLen) + 5 ] = Math.random() < 0.5 ? -1 : 1

      // grid num
      boidArr[ (i * this.arrLen) + 6 ] = this.boidBox.getGridNum(
        position[0],
        position[1],  
        position[2],  
      )
      
    })

    const particlesUvArray = new Float32Array(this.boidNum * 2)
    for(let y = 0; y < computationSize; y++){
      for(let x = 0; x < computationSize; x++){

        const i = (y * computationSize + x)
        const i2 = i * 2

        // Particles UV
        const uvX = (x + 0.5) / computationSize
        const uvY = (y + 0.5) / computationSize

        particlesUvArray[i2 + 0] = uvX;
        particlesUvArray[i2 + 1] = uvY;

      }
    }

    this.boids = new Boids({
      canvas: canvas,
      boundingBox: screen,
      boidBox: this.boidBox,
      predator: this.predator,
      geometryAttribute: { aParticlesUv: new THREE.BufferAttribute(particlesUvArray,2) },
      initialPos: boidArr.reduce((a,b,i)=> {
        if(
          !(i % this.arrLen) ||
          !((i-1) % this.arrLen) ||
          !((i-2) % this.arrLen)
        ) a.push(b); 
        return a
      },[] as number[]),
      customShaderMaterial: new THREE.ShaderMaterial({
        vertexShader: boidVertexShader,
        fragmentShader: boidFragmentShader,
        transparent: true,
        uniforms: {
          uSize: new THREE.Uniform(this.dotSize),
          // @ts-ignore
          uPositionTexture: new THREE.Uniform()
        }
      })
    })

    this.calculator = calculator({
      boidArr,
      arrLen: this.arrLen,
      boidBox: this.boidBox,
      predator: this.predator,
      boids: this.boids,
      positionTextureName: 'uPositionTexture',
      velocityTextureName: 'uVelocityTexture'
    })

    this.prevTime = performance.now()
    this.loop() 

  }

  // when resize happens
  changeScreenSize(screen: {width:number, height: number}){
    this.boids.setScreenSize(screen)
  }

  loop(){
  
    requestAnimationFrame(() => this.loop())
    
    this.calculator.compute()
    this.boids.draw()
      
    // fps counter
    const time = performance.now();
    this.frames++;
    if (time > this.prevTime + 1000) {
      let fps = Math.round( ( this.frames * 1000 ) / ( time - this.prevTime ) );
      this.prevTime = time;
      this.frames = 0;
      this.reportFps(fps)
    }
  
  }

}