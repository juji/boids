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

let posCounter: Int8Array;
let counterIndex: number;


const maxVelocity: number = 5
const minVelocity: number = 2

// on edges
const turnFactor: number = 0.5

// Separation
const avoidFactor = 0.075
const protectedRange = 16

// Alignment
const matchingfactor = 0.1

// Cohesion
const centeringFactor = 0.0001

// Predator
const predatorturnfactor = 0.9
const predatoryRange = (predatorAttr.size || 0) * 3

// visible range is a range
// and visible range should always be > protectedRange
const getVisibleRange = () => 40 + Math.random() * 40

// greatly  affects fps
// but, setting these to low, we will start to see kernels of boid
// ( group of boids on the same space )
const maxPartner = 10 // max is calcPerThread
//

// share array length per boid
let sal = 0

let gridParams: {
  width: 0,
  height: 0,
  depth: 0,
  gridCol: 0,
  gridRow: 0,
  gridDepth: 0,
}

function calculatePosition(){

  // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html

  const predator = predatorAttr
  const visibleRange = getVisibleRange()


  let i = end + 1
  while(i--) {

    if(i<start) break;

    let partners = 0
    const acceleration = [0,0,0]

    const iPosition = [
      i * sal + 0,
      i * sal + 1,
      i * sal + 2,
    ]

    const iVelocity = [
      i * sal + 3,
      i * sal + 4,
      i * sal + 5,
    ]

    // 6 is for grid pos

    // separating between 0 and t results in higher fps?
    const iPositionT = [
      i * sal + 7,
      i * sal + 8,
      i * sal + 9,
    ]

    const iVelocityT = [
      i * sal + 10,
      i * sal + 11,
      i * sal + 12,
    ]

    // this should be first
    // so that the result will show before and after
    sharedArray[ iVelocity[0] ] = sharedArray[ iVelocityT[0] ]
    sharedArray[ iVelocity[1] ] = sharedArray[ iVelocityT[1] ]
    sharedArray[ iVelocity[2] ] = sharedArray[ iVelocityT[2] ]

    sharedArray[ iPosition[0] ] = sharedArray[ iPositionT[0] ]
    sharedArray[ iPosition[1] ] = sharedArray[ iPositionT[1] ]
    sharedArray[ iPosition[2] ] = sharedArray[ iPositionT[2] ]

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

    const iGridNum = sharedArray[ i * sal + 6 ]
    
    // calculate neighbour effect
    let j = sharedArray.length / sal
    while(j--) {
      if(j===i) continue;

      // grid based neighbour
      // https://ercang.github.io/boids-js/
      if(sharedArray[ j * sal + 6 ] !== iGridNum) continue;

      // 
      if(partners >= maxPartner) break;

      const jPosition = [
        j * sal + 0,
        j * sal + 1,
        j * sal + 2,
      ]
      
      const distance = Math.sqrt(
        (sharedArray[ jPosition[0] ] - sharedArray[ iPosition[0] ]) ** 2 +
        (sharedArray[ jPosition[1] ] - sharedArray[ iPosition[1] ]) ** 2 +
        (sharedArray[ jPosition[2] ] - sharedArray[ iPosition[2] ]) ** 2
      )

      if(distance >= visibleRange) continue;
      partners++;

      // Separation
      if(distance < protectedRange){
        closeDx += sharedArray[ iPosition[0] ] - sharedArray[ jPosition[0] ]
        closeDy += sharedArray[ iPosition[1] ] - sharedArray[ jPosition[1] ]
        closeDz += sharedArray[ iPosition[2] ] - sharedArray[ jPosition[2] ]
      }

      else if(distance < visibleRange){

        const jVelocity = [
          j * sal + 3,
          j * sal + 4,
          j * sal + 5,
        ]

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
    acceleration[0] += closeDx * avoidFactor
    acceleration[1] += closeDy * avoidFactor
    acceleration[2] += closeDz * avoidFactor
    
    if(neighboringBoids){
      
      // Alignment
      xVelAvg /= neighboringBoids
      yVelAvg /= neighboringBoids
      zVelAvg /= neighboringBoids
      acceleration[0] += (xVelAvg - sharedArray[ iVelocity[0] ]) * matchingfactor
      acceleration[1] += (yVelAvg - sharedArray[ iVelocity[1] ]) * matchingfactor
      acceleration[2] += (zVelAvg - sharedArray[ iVelocity[2] ]) * matchingfactor

      // Cohesion
      xPosAvg /= neighboringBoids
      yPosAvg /= neighboringBoids
      zPosAvg /= neighboringBoids
      acceleration[0] += (xPosAvg - sharedArray[ iPosition[0] ]) * centeringFactor
      acceleration[1] += (yPosAvg - sharedArray[ iPosition[1] ]) * centeringFactor
      acceleration[2] += (zPosAvg - sharedArray[ iPosition[2] ]) * centeringFactor

    }

    if(predator.exists){

      const predatorDx = sharedArray[ iPosition[0] ] - predator.x
      const predatorDy = sharedArray[ iPosition[1] ] - predator.y
      const predatorDz = sharedArray[ iPosition[2] ] - 0 // predator z is always 0

      const predatorDistance = Math.sqrt(
        predatorDx**2 + predatorDy**2 + predatorDz**2
      )

      if(predatorDistance < predatoryRange){
        acceleration[0] += predatorturnfactor * (predatorDx < 0 ? -1 : 1)
        acceleration[1] += predatorturnfactor * (predatorDy < 0 ? -1 : 1)
        acceleration[2] += predatorturnfactor * (predatorDz < 0 ? -1 : 1)
      }
      
    }

    // calculate position
    sharedArray[ iVelocityT[0] ] += acceleration[0]
    sharedArray[ iVelocityT[1] ] += acceleration[1]
    sharedArray[ iVelocityT[2] ] += acceleration[2]

    // turn factor
    // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

    if(sharedArray[ iPosition[0] ] > boidBox.right){
      sharedArray[ iVelocityT[0] ] -= turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[0] ] < boidBox.left){
      sharedArray[ iVelocityT[0] ] += turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[1] ] > boidBox.bottom){
      sharedArray[ iVelocityT[1] ] -= turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[1] ] < boidBox.top){
      sharedArray[ iVelocityT[1] ] += turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[2] ] > boidBox.front){
      sharedArray[ iVelocityT[2] ] -= turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[2] ] < boidBox.back){
      sharedArray[ iVelocityT[2] ] += turnFactor * Math.random() * 0.6
    }

    // limit velocity
    const velocity = Math.sqrt(
      sharedArray[ iVelocityT[0] ]**2 + 
      sharedArray[ iVelocityT[1] ]**2 + 
      sharedArray[ iVelocityT[2] ]**2
    )

    if(velocity > maxVelocity){
      sharedArray[ iVelocityT[0] ] = sharedArray[ iVelocityT[0] ] / velocity * maxVelocity
      sharedArray[ iVelocityT[1] ] = sharedArray[ iVelocityT[1] ] / velocity * maxVelocity
      sharedArray[ iVelocityT[2] ] = sharedArray[ iVelocityT[2] ] / velocity * maxVelocity
    }

    if(velocity < minVelocity){
      sharedArray[ iVelocityT[0] ] = sharedArray[ iVelocityT[0] ] / velocity * minVelocity
      sharedArray[ iVelocityT[1] ] = sharedArray[ iVelocityT[1] ] / velocity * minVelocity
      sharedArray[ iVelocityT[2] ] = sharedArray[ iVelocityT[2] ] / velocity * minVelocity
    }

    //
    sharedArray[ iPositionT[0] ] += sharedArray[ iVelocityT[0] ]
    sharedArray[ iPositionT[1] ] += sharedArray[ iVelocityT[1] ]
    sharedArray[ iPositionT[2] ] += sharedArray[ iVelocityT[2] ]

    // grid pos
    sharedArray[ i * sal + 6 ] = getGridNum(
      sharedArray[ iPositionT[0] ],
      sharedArray[ iPositionT[1] ],
      sharedArray[ iPositionT[2] ]
    )

  }

}

function getGridNum(x: number, y: number, z: number){
  return Math.floor((x + gridParams.width * .5) / (gridParams.width / gridParams.gridCol)) +
      Math.floor((y + gridParams.height * .5) / (gridParams.height / gridParams.gridRow)) +
      Math.floor((z + gridParams.depth * .5) / (gridParams.depth / gridParams.gridDepth))
}

function calculate(){
  if(!sharedArray) {
    throw new Error('sharedArray does not exists')
  }

  requestAnimationFrame(() => calculate())

  // loop: calculate acceleration
  if( !posCounter[ counterIndex ] ){
    posCounter[ counterIndex ] = 1
    calculatePosition()
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

  if(data.gridParams)
    gridParams = data.gridParams

  if(
    data.sab && data.posCounter && data.sal &&
    typeof data.start !== 'undefined' &&
    typeof data.end !== 'undefined'
  ){

    sal = data.sal
    start = data.start
    end = data.end
    counterIndex = data.counterIndex

    sharedArray = new Float32Array(data.sab)
    posCounter = new Int8Array(data.posCounter)
    
    if(!calculating){
      calculating = true
      calculate()
    }
  }

}