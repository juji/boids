
// import { webGLBoid } from './boid.js'

import {
  maxVelocity,
  minVelocity,
  turnFactor,
  avoidFactor,
  protectedRange,
  matchingfactor,
  centeringFactor,
  predatorturnfactor,
} from '../items/constants'

import type { CalculatorPar } from '../items/calculator-par.js'
import { GPUComputationRenderer, Variable } from 'three/examples/jsm/Addons.js'
import { DataTexture } from 'three'

import positionComp from './positionComp.glsl'
import velocityComp from './velocityComp.glsl'

type Position = {
  size: number

  computation: GPUComputationRenderer | null
  
  posTexture: DataTexture | null
  posVar: Variable | null

  velTexture: DataTexture | null
  velVar: Variable | null

}

// visible range is a range
// and visible range should always be > protectedRange
const getVisibleRange = () => 40 + Math.random() * 40

// greatly affects fps
// but, setting these to low, 
// we will start to see group of boids on the same space
const maxPartner = 20 // max is calcPerThread
//

export function calculator({
  sharedArray,
  sal,
  boidBox,
  predator,
  boids,
}:CalculatorPar){

  const visibleRange = getVisibleRange()

  const len = sharedArray.length
  const boidLen = len / sal

  const gpgpu: Position = {
    size: Math.ceil(Math.sqrt(boidLen)),
    computation: null,

    posTexture: null,
    posVar: null,

    velTexture: null,
    velVar: null
  }

  gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, boids.renderer)
  
  gpgpu.posTexture = gpgpu.computation.createTexture()
  gpgpu.posVar = gpgpu.computation.addVariable('uPosition', positionComp, gpgpu.posTexture)

  function position(  grid: number ){
    return [
      Math.random() * (Math.random()<.5?-1:1),
      Math.random() * (Math.random()<.5?-1:1),
      Math.random() * (Math.random()<.5?-1:1),
    ]
  }

  function  velocity(){
    return [
      (Math.random() < 0.5 ? -1 : 1) * 0.1,
      (Math.random() < 0.5 ? -1 : 1) * 0.1,
      (Math.random() < 0.5 ? -1 : 1) * 0.1,
    ]
  }
      // // change these
      // const position = [

      //   Math.random() * this.boidBox.width * (Math.random()<.5?-1:1),
      //   Math.random() * this.boidBox.height * (Math.random()<.5?-1:1),
      //   Math.random() * this.boidBox.depth * (Math.random()<.5?-1:1),

      // ]

      // const velocity = [
      //   Math.random() < 0.5 ? -1 : 1,
      //   Math.random() < 0.5 ? -1 : 1,
      //   Math.random() < 0.5 ? -1 : 1,
      // ]
      
      // sharedArray[ (i * this.arrLen) + 0 ] = position[0]
      // sharedArray[ (i * this.arrLen) + 1 ] = position[1]
      // sharedArray[ (i * this.arrLen) + 2 ] = position[2]

      // sharedArray[ (i * this.arrLen) + 3 ] = velocity[0]
      // sharedArray[ (i * this.arrLen) + 4 ] = velocity[1]
      // sharedArray[ (i * this.arrLen) + 5 ] = velocity[2]

      // // grid num
      // sharedArray[ (i * this.arrLen) + 6 ] = this.boidBox.getGridNum(
      //   position[0],
      //   position[1],  
      //   position[2],  
      // )

  gpgpu.velTexture = gpgpu.computation.createTexture()
  gpgpu.velVar = gpgpu.computation.addVariable('uVelocity', velocityComp, gpgpu.velTexture)

  // initialize velocity

  gpgpu.computation.setVariableDependencies(gpgpu.posVar, [ gpgpu.posVar, gpgpu.velVar ])
  gpgpu.computation.setVariableDependencies(gpgpu.velVar, [ gpgpu.posVar, gpgpu.velVar ])

  gpgpu.computation.init()

  // @ts-ignore
  // const calc = WebGLBoid({
  //   len: sharedArray.length,
  //   sal,
  //   predator,
  //   boidBox,
  //   maxVelocity,
  //   minVelocity,
  //   turnFactor,
  //   avoidFactor,
  //   protectedRange,
  //   matchingfactor,
  //   centeringFactor,
  //   predatorturnfactor,
  //   visibleRange,
  //   maxPartner,
  // })

  return () => {


    // GPGPU Update
    gpgpu.computation && gpgpu.computation.compute()
    // boids.geometry.attributes.position.needsUpdate = true

    // const r = calc(sharedArray)
    // // console.log({ startIndex, endIndex })

    // let n = boidLen
    // while(n--){
      
    //   sharedArray[ n * sal + 0 ] += r[ n ][ 0 ]
    //   sharedArray[ n * sal + 1 ] += r[ n ][ 1 ]
    //   sharedArray[ n * sal + 2 ] += r[ n ][ 2 ]

    //   boids.position.set([
    //     sharedArray[ n * sal + 0 ],
    //     sharedArray[ n * sal + 1 ],
    //     sharedArray[ n * sal + 2],  
    //   ], n * 3)

    //   sharedArray[ n * sal + 3 ] = r[ n ][ 0 ]
    //   sharedArray[ n * sal + 4 ] = r[ n ][ 1 ]
    //   sharedArray[ n * sal + 5 ] = r[ n ][ 2 ]

    //   sharedArray[ n * sal + 6 ] = boidBox.getGridNum(
    //     sharedArray[ n * sal + 0 ],
    //     sharedArray[ n * sal + 1 ],
    //     sharedArray[ n * sal + 2 ],
    //   )

    // }

    // boids.geometry.attributes.position.needsUpdate = true

  }
  
  
}