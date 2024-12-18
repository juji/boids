
import Predator from '../../items/predator'
import Boids from '../../items/boids'
import BoidBox from '../../items/boidBox'
import * as THREE from 'three'

import boidVertexShader from '../../webgl/boidVertex.glsl?raw'
import boidFragmentShader from '../../webgl/boidFragment.glsl?raw'
import { calculator } from './calculator'
import { VirtualElement } from "../../items/VirtualElement"
import CameraControls from 'camera-controls';

CameraControls.install( { THREE: THREE } );

export class BoidRenderer {

  boids: Boids
  boidBox: BoidBox
  predator: Predator
  
  boidNum = 500
  canvas: OffscreenCanvas

  // arrLen per boid
  arrLen = 7

  //
  reportTick: () => void

  compute: () => void

  dotSize = 21
  uPointDenom = 400

  constructor({
    canvas,
    virtualElement,
    devicePixelRatio,
    screen,
    boidNum,
    reportTick,
  }:{
    canvas: OffscreenCanvas
    virtualElement: VirtualElement
    devicePixelRatio: number
    screen: { width: number, height: number }
    boidNum: number
    reportTick: () => void
  }){

    this.reportTick = reportTick
    this.boidNum = boidNum
    this.canvas = canvas

    this.boidBox = new BoidBox()
    this.predator = new Predator()

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
    
    const computationSize = Math.sqrt(this.boidNum)
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

    const clock = new THREE.Clock()
    const customControls = {
      create: ( camera: THREE.PerspectiveCamera, elm: VirtualElement | HTMLCanvasElement ) => {

        const controls = new CameraControls(
          camera ,
          // @ts-ignore
          elm
        )
        controls.smoothTime = 0
        controls.minDistance = 2000
        controls.maxDistance = 20000
        controls.dollySpeed = 1
        controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY

        return controls

      },
      update: ( controls: any ) => {
        const delta = clock.getDelta();
        controls.update( delta );
      }
    }


    this.boids = new Boids({
      offscreen: true,
      customControls: customControls,
      canvas: canvas,
      devicePixelRatio: devicePixelRatio,
      virtualElement: virtualElement,
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
          uSize: new THREE.Uniform(this.dotSize * devicePixelRatio),
          uPointDenom: new THREE.Uniform(this.uPointDenom),
          // @ts-ignore
          uPositionTexture: new THREE.Uniform()
        }
      })
    })

    this.compute = calculator({
      boidArr,
      arrLen: this.arrLen,
      boidBox: this.boidBox,
      predator: this.predator,
      boids: this.boids,
      positionTextureName: 'uPositionTexture',
      velocityTextureName: 'uVelocityTexture'
    })

  }

  loop(){
  
    requestAnimationFrame(() => this.loop())
    
    this.compute()
    this.boids.draw()
    this.reportTick()
  
  }

  onScreenChange(
    screen: { width: number, height: number }, 
    devicePixelRatio: number
  ){
    this.boids.setScreenSize(screen, devicePixelRatio)
  }

}