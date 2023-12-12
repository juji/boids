import type { Predator, BoidBox } from './types'

let predatorAttr:Predator = {
  exists: true,
  size: 40,
  x: 0,
  y: 0
}

let boidBox: BoidBox = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  front: 0,
  back: 0,
}

let calculating = false
let sharedArray: Float32Array;
let start = 0
let end = 0

let accelCounter: Int8Array;
let posCounter: Int8Array;
let counterIndex: number;


const maxVelocity: number = 5
const minVelocity: number = 2

// on edges
const turnFactor: number = 0.5

// Separation
const avoidFactor = 0.05
const protectedRange = 18

// Alignment
const matchingfactor = 0.06

// Cohesion
const centeringFactor = 0.0001

// Predator
const predatorturnfactor = 0.7
const predatoryRange = (predatorAttr.size || 0) * 2

// visible range is a range
const getVisibleRange = () => 40 + Math.random() * 40

//
const maxPartner = 100 // as big as 100 in 100 * calculatorNum

function calculateAccelleration(){

  // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html

  const predator = predatorAttr
  const visibleRange = getVisibleRange()


  let i = end + 1
  while(i--) {

    if(i<start) break;
    // console.log(i)

    let partners = 0
    const accelleration = [0,0,0]

    const iPosition = [
      i * 9 + 0,
      i * 9 + 1,
      i * 9 + 2,
    ]

    const iVelocity = [
      i * 9 + 3 + 0,
      i * 9 + 3 + 1,
      i * 9 + 3 + 2,
    ]

    const iAccelleration = [
      i * 9 + 6 + 0,
      i * 9 + 6 + 1,
      i * 9 + 6 + 2,
    ]

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
    

    let j = sharedArray.length / 9
    while(j--) {
      if(j===i) continue;
      if(partners >= maxPartner) break;

      
      const jPosition = [
        j * 9 + 0,
        j * 9 + 1,
        j * 9 + 2,
      ]
      
      const jVelocity = [
        j * 9 + 3 + 0,
        j * 9 + 3 + 1,
        j * 9 + 3 + 2,
      ]
      
      const distance = Math.sqrt(
        (sharedArray[ jPosition[0] ] - sharedArray[ iPosition[0] ])**2 +
        (sharedArray[ jPosition[1] ] - sharedArray[ iPosition[1] ])**2 +
        (sharedArray[ jPosition[2] ] - sharedArray[ iPosition[2] ])**2
      )
      
      if(
        distance < protectedRange ||
        distance < visibleRange
      ) partners++;
      

      // Separation
      if(distance < protectedRange){
        closeDx += sharedArray[ iPosition[0] ] - sharedArray[ jPosition[0] ]
        closeDy += sharedArray[ iPosition[1] ] - sharedArray[ jPosition[1] ]
        closeDz += sharedArray[ iPosition[2] ] - sharedArray[ jPosition[2] ]
      }

      else if(distance < visibleRange){

        // Alignment
        xVelAvg += sharedArray[ jVelocity[0] ] 
        yVelAvg += sharedArray[ jVelocity[1] ] 
        zVelAvg += sharedArray[ jVelocity[2] ] 

        // Cohesion
        xPosAvg += sharedArray[ jPosition[0] ]
        yPosAvg += sharedArray[ jPosition[1] ]
        zPosAvg += sharedArray[ jPosition[2] ]

        neighboringBoids++

      }

    }

    // Separation
    accelleration[0] += closeDx * avoidFactor
    accelleration[1] += closeDy * avoidFactor
    accelleration[2] += closeDz * avoidFactor
    
    if(neighboringBoids){
      
      // Alignment
      xVelAvg /= neighboringBoids
      yVelAvg /= neighboringBoids
      zVelAvg /= neighboringBoids
      accelleration[0] += (xVelAvg - sharedArray[ iVelocity[0] ]) * matchingfactor
      accelleration[1] += (yVelAvg - sharedArray[ iVelocity[1] ]) * matchingfactor
      accelleration[2] += (zVelAvg - sharedArray[ iVelocity[2] ]) * matchingfactor

      // Cohesion
      xPosAvg /= neighboringBoids
      yPosAvg /= neighboringBoids
      zPosAvg /= neighboringBoids
      accelleration[0] += (xPosAvg - sharedArray[ iPosition[0] ]) * centeringFactor
      accelleration[1] += (yPosAvg - sharedArray[ iPosition[1] ]) * centeringFactor
      accelleration[2] += (zPosAvg - sharedArray[ iPosition[2] ]) * centeringFactor

    }

    if(predator.exists){

      const predatorDx = sharedArray[ iPosition[0] ] - predator.x
      const predatorDy = sharedArray[ iPosition[1] ] - predator.y
      const predatorDz = sharedArray[ iPosition[2] ] - 0 // predator z is always 0

      const predatorDistance = Math.sqrt(
        predatorDx**2 + predatorDy**2 + predatorDz**2
      )

      if(predatorDistance < predatoryRange){
        accelleration[0] += predatorturnfactor * (predatorDx < 0 ? -1 : 1)
        accelleration[1] += predatorturnfactor * (predatorDy < 0 ? -1 : 1)
        accelleration[2] += predatorturnfactor * (predatorDz < 0 ? -1 : 1)
      }
      
    }

    sharedArray[ iAccelleration[0] ] = accelleration[0]
    sharedArray[ iAccelleration[1] ] = accelleration[1]
    sharedArray[ iAccelleration[2] ] = accelleration[2]

  }

}

function calculatePosition(){

  let i = end + 1
  while(i--) {

    if(i<start) break;

    const iPosition = [
      i * 9 + 0,
      i * 9 + 1,
      i * 9 + 2,
    ]

    const iVelocity = [
      i * 9 + 3 + 0,
      i * 9 + 3 + 1,
      i * 9 + 3 + 2,
    ]

    const iAccelleration = [
      i * 9 + 6 + 0,
      i * 9 + 6 + 1,
      i * 9 + 6 + 2,
    ]

    sharedArray[ iVelocity[0] ] += sharedArray[ iAccelleration[0] ]
    sharedArray[ iVelocity[1] ] += sharedArray[ iAccelleration[1] ]
    sharedArray[ iVelocity[2] ] += sharedArray[ iAccelleration[2] ]

    // turn factor
    // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

    if(sharedArray[ iPosition[0] ] > boidBox.right){
      sharedArray[ iVelocity[0] ] -= turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[0] ] < boidBox.left){
      sharedArray[ iVelocity[0] ] += turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[1] ] > boidBox.bottom){
      sharedArray[ iVelocity[1] ] -= turnFactor * Math.random() * 0.4
    }

    if(sharedArray[ iPosition[1] ] < boidBox.top){
      sharedArray[ iVelocity[1] ] += turnFactor * Math.random() * 0.4
    }

    if(sharedArray[ iPosition[2] ] > boidBox.front){
      sharedArray[ iVelocity[2] ] -= turnFactor * Math.random()
    }

    if(sharedArray[ iPosition[2] ] < boidBox.back){
      sharedArray[ iVelocity[2] ] += turnFactor * Math.random()
    }

    // limit velocity
    const velocity = Math.sqrt(
      sharedArray[ iVelocity[0] ]**2 + sharedArray[ iVelocity[1] ]**2 + sharedArray[ iVelocity[2] ]**2
    )

    if(velocity > maxVelocity){
      sharedArray[ iVelocity[0] ] = sharedArray[ iVelocity[0] ] / velocity * maxVelocity
      sharedArray[ iVelocity[1] ] = sharedArray[ iVelocity[1] ] / velocity * maxVelocity
      sharedArray[ iVelocity[2] ] = sharedArray[ iVelocity[2] ] / velocity * maxVelocity
    }

    if(velocity < minVelocity){
      sharedArray[ iVelocity[0] ] = sharedArray[ iVelocity[0] ] / velocity * minVelocity
      sharedArray[ iVelocity[1] ] = sharedArray[ iVelocity[1] ] / velocity * minVelocity
      sharedArray[ iVelocity[2] ] = sharedArray[ iVelocity[2] ] / velocity * minVelocity
    }

    //
    sharedArray[ iPosition[0] ] += sharedArray[ iVelocity[0] ]
    sharedArray[ iPosition[1] ] += sharedArray[ iVelocity[1] ]
    sharedArray[ iPosition[2] ] += sharedArray[ iVelocity[2] ]

  }

}

function calculate(){
  if(!sharedArray) {
    throw new Error('sharedArray does not exists')
  }

  requestAnimationFrame(() => calculate())

  // loop: calculate accellearation
  if( !accelCounter[ counterIndex ] ){
    accelCounter[ counterIndex ] = 1
    calculateAccelleration()
    return;
  }

  // if all accel is done, calculate position
  let counter = accelCounter.length
  while(counter--) if(!accelCounter[counter]) return;

  if( !posCounter[ counterIndex ] ){
    posCounter[ counterIndex ] = 1
    calculatePosition()
    return;
  }

}


self.onmessage = (e: MessageEvent) => {

  const { data } = e

  if(data.predatorAttr)
    predatorAttr = {
      ...predatorAttr,
      ...data.predatorAttr
    }

  if(data.boidBox)
    boidBox = data.boidBox

  if(
    data.sab && data.accelCounter && data.posCounter &&
    typeof data.start !== 'undefined' &&
    typeof data.end !== 'undefined'
  ){

    
    start = data.start
    end = data.end
    counterIndex = data.counterIndex
    // console.log({ counterIndex, start, end })

    sharedArray = new Float32Array(data.sab)
    accelCounter = new Int8Array(data.accelCounter)
    posCounter = new Int8Array(data.posCounter)
    
    if(!calculating){
      calculating = true
      calculate()
    }
  }

}