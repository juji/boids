
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

// visible range is a range
// and visible range should always be > protectedRange
const getVisibleRange = () => 40 + Math.random() * 40

// greatly  affects fps
// but, setting these to low, 
// we will start to see group of boids on the same space
const maxPartner = 20 // max is calcPerThread
//

export function calculator({
  sharedArray,
  sal,
  boidBox,
  predator,
  boids
}:CalculatorPar){

  const visibleRange = getVisibleRange()

  const len = sharedArray.length
  const boidLen = len / sal

  // @ts-ignore
  const calc = WebGLBoid({
    len: sharedArray.length,
    sal,
    predator,
    boidBox,
    maxVelocity,
    minVelocity,
    turnFactor,
    avoidFactor,
    protectedRange,
    matchingfactor,
    centeringFactor,
    predatorturnfactor,
    visibleRange,
    maxPartner,
  })

  return () => {

    const r = calc(sharedArray)
    // console.log({ startIndex, endIndex })

    let n = boidLen
    while(n--){
      
      sharedArray[ n * sal + 0 ] += r[ n ][ 0 ]
      sharedArray[ n * sal + 1 ] += r[ n ][ 1 ]
      sharedArray[ n * sal + 2 ] += r[ n ][ 2 ]

      boids.position.set([
        sharedArray[ n * sal + 0 ],
        sharedArray[ n * sal + 1 ],
        sharedArray[ n * sal + 2],  
      ], n * 3)

      sharedArray[ n * sal + 3 ] = r[ n ][ 0 ]
      sharedArray[ n * sal + 4 ] = r[ n ][ 1 ]
      sharedArray[ n * sal + 5 ] = r[ n ][ 2 ]

      sharedArray[ n * sal + 6 ] = boidBox.getGridNum(
        sharedArray[ n * sal + 0 ],
        sharedArray[ n * sal + 1 ],
        sharedArray[ n * sal + 2 ],
      )

    }

    boids.geometry.attributes.position.needsUpdate = true

  }
  
  
}