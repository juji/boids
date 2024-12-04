// import BoidBox from '../items/boidBox'
// import Predator from '../items/predator'
// import '/gpu-browser.min.js?url'

// type WebGLBoidPar = {
//   len: number
//   sal: number
//   predator: Predator
//   boidBox: BoidBox
//   maxVelocity: number
//   minVelocity: number
//   turnFactor: number
//   avoidFactor: number
//   protectedRange: number
//   matchingfactor: number
//   centeringFactor: number
//   predatorturnfactor: number
//   visibleRange: number
//   maxPartner: number
// }

function WebGLBoid({
  len,
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
}
// :WebGLBoidPar
){

  // @ts-ignore
  const GPUJS = GPU.GPU || GPU
  // const gpu = new GPUJS({ mode: 'cpu' })
  const gpu = new GPUJS()

  const boidLen = len / sal

  const kernel = gpu.createKernel(function(
    sharedArray,//: number[],
    sal,//: number,
    boidLen,//: number,
    
    // predatorSize: number,
    predatorExists,//: number,
    predatorRange,//: number,
    predatorX,//: number,
    predatorY,//: number,
    predatorZ,//: number,

    // boidBoxBoxGap: number,
    // boidBoxWidth: number,
    // boidBoxDepth: number,
    // boidBoxHeight: number,
    // boidBoxGridCol: number,
    // boidBoxGridRow: number,
    // boidBoxGridDepth: number,

    boidBoxTop,//: number,
    boidBoxLeft,//: number,
    boidBoxBottom,//: number,
    boidBoxRight,//: number,
    boidBoxFront,//: number,
    boidBoxBack,//: number,

    maxVelocity,//: number,
    minVelocity,//: number,
    turnFactor,//: number,
    avoidFactor,//: number,
    protectedRange,//: number,
    matchingfactor,//: number,
    centeringFactor,//: number,
    predatorturnfactor,//: number,
    visibleRange,//: number,
    maxPartner,//: number,
  ){

    
    // @ts-ignore
    let i = this.thread.x
    
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
    
    const velocity = [
      sharedArray[ iVelocity[0] ],
      sharedArray[ iVelocity[1] ],
      sharedArray[ iVelocity[2] ]
    ]
    
    // debugger; // <--NOTICE THIS, IMPORTANT!
    // 6 is for grid pos
    const iGridPos = i * sal + 6
    
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
    
    const iGridNum = sharedArray[ iGridPos ]
    
    // debugger;
    let j = boidLen
    while(j >= 0) {
    // for (let j = 0; j < boidLen; j++) {
      j -= 1
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
      partners = partners + 1;
      
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
        
        neighboringBoids = neighboringBoids + 1
        
      }
      
    }
    
    // // Separation
    acceleration[0] += closeDx * avoidFactor
    acceleration[1] += closeDy * avoidFactor
    acceleration[2] += closeDz * avoidFactor
    
    if(neighboringBoids > 0){
      
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
    
    if(predatorExists === 1){
      
      const predatorDx = sharedArray[ iPosition[0] ] - predatorX
      const predatorDy = sharedArray[ iPosition[1] ] - predatorY
      const predatorDz = sharedArray[ iPosition[2] ] - predatorZ
      
      const predatorDistance = Math.sqrt(
        predatorDx**2 + predatorDy**2 + predatorDz**2
      )
      
      if(predatorDistance < predatorRange){
        let turnFactor = 1
        if(predatorDx < 0) turnFactor = -1
        acceleration[0] += predatorturnfactor * turnFactor
        acceleration[1] += predatorturnfactor * turnFactor
        acceleration[2] += predatorturnfactor * turnFactor
      }
      
    }

    velocity[0] += acceleration[0]
    velocity[1] += acceleration[1]
    velocity[2] += acceleration[2]

    // turn factor
    // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

    if(sharedArray[ iPosition[0] ] > boidBoxRight){
      velocity[0] -= turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[0] ] < boidBoxLeft){
      velocity[0] += turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[1] ] > boidBoxBottom){
      velocity[1] -= turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[1] ] < boidBoxTop){
      velocity[1] += turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[2] ] > boidBoxFront){
      velocity[2] -= turnFactor * Math.random() * 0.6
    }

    if(sharedArray[ iPosition[2] ] < boidBoxBack){
      velocity[2] += turnFactor * Math.random() * 0.6
    }

    // limit velocity
    const vel = Math.sqrt(
      velocity[0]**2 + 
      velocity[1]**2 + 
      velocity[2]**2
    )

    if(vel > maxVelocity){
      velocity[0] = velocity[0] / vel * maxVelocity
      velocity[1] = velocity[1] / vel * maxVelocity
      velocity[2] = velocity[2] / vel * maxVelocity
    }

    if(vel < minVelocity){
      velocity[0] = velocity[0] / vel * minVelocity
      velocity[1] = velocity[1] / vel * minVelocity
      velocity[2] = velocity[2] / vel * minVelocity
    }

    return velocity

  }).setOutput([boidLen]);

  return ( sharedArray
    // : Float32Array 
  ) => {
    return kernel(
      sharedArray,
      sal,
      boidLen,

      // predator.size,
      predator.exists ? 1 : 0,
      predator.range,
      predator.x,
      predator.y,
      predator.z,

      // boidBox.boxGap,
      // boidBox.width,
      // boidBox.depth,
      // boidBox.height,
      // boidBox.gridCol,
      // boidBox.gridRow,
      // boidBox.gridDepth,
      boidBox.top,
      boidBox.left,
      boidBox.bottom,
      boidBox.right,
      boidBox.front,
      boidBox.back,
      
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
    )
  }

}