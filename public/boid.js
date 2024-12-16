
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
  maxPartner
}){

  // @ts-ignore
  const GPUJS = GPU.GPU || GPU
  // const gpu = new GPUJS({ mode: 'cpu' })
  const gpu = new GPUJS()

  const boidLen = len / sal

  const kernel = gpu.createKernel(function(
    sharedArray,
  ){

    const {
      sal,
      boidLen,
      
      predatorExists,
      predatorRange,
      predatorX,
      predatorY,
      predatorZ,
  
      boidBoxTop,
      boidBoxLeft,
      boidBoxBottom,
      boidBoxRight,
      boidBoxFront,
      boidBoxBack,
  
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
    } = this.constants
    
    let i = this.thread.x
    
    let partners = 0
    const acceleration = [0,0,0]
    const iPos = i * sal
    
    const iPosition = [
      iPos + 0,
      iPos + 1,
      iPos + 2,
    ]
    
    const iVelocity = [
      iPos + 3,
      iPos + 4,
      iPos + 5,
    ]
    
    const velocity = [
      sharedArray[ iVelocity[0] ],
      sharedArray[ iVelocity[1] ],
      sharedArray[ iVelocity[2] ]
    ]
    
    // debugger; // <--NOTICE THIS, IMPORTANT!
    // 6 is for grid pos
    const iGridPos = iPos + 6
    
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
    
    let j = boidLen
    while(j > 0) {
      j = j - 1
      if(j===i) continue;

      const jPos = j * sal
      
      // grid based neighbour
      // https://ercang.github.io/boids-js/
      if(sharedArray[ jPos + 6 ] !== iGridNum) continue;
      
      // 
      if(partners >= maxPartner) break;
      
      const jPosition = [
        jPos + 0,
        jPos + 1,
        jPos + 2,
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
        
        // Alignment
        xVelAvg += sharedArray[ (j * sal) + 3 ] 
        yVelAvg += sharedArray[ (j * sal) + 4 ] 
        zVelAvg += sharedArray[ (j * sal) + 5 ] 
        
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

        let turnFactorX = 1.0
        if(predatorDx < 0) turnFactorX = -1.0
        acceleration[0] += predatorturnfactor * turnFactorX

        let turnFactorY = 1.0
        if(predatorDy < 0) turnFactorY = -1.0
        acceleration[1] += predatorturnfactor * turnFactorY

        let turnFactorZ = 1.0
        if(predatorDz < 0) turnFactorZ = -1.0
        acceleration[2] += predatorturnfactor * turnFactorZ
        
      }
      
    }

    velocity[0] += acceleration[0]
    velocity[1] += acceleration[1]
    velocity[2] += acceleration[2]

    // turn factor
    // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

    let isTurning = false
    if(sharedArray[ iPosition[0] ] > boidBoxRight){
      velocity[0] -= turnFactor
      isTurning = true
    }

    if(sharedArray[ iPosition[0] ] < boidBoxLeft){
      velocity[0] += turnFactor
      isTurning = true
    }

    if(sharedArray[ iPosition[1] ] > boidBoxBottom){
      velocity[1] -= turnFactor
      isTurning = true
    }

    if(sharedArray[ iPosition[1] ] < boidBoxTop){
      velocity[1] += turnFactor
      isTurning = true
    }

    if(sharedArray[ iPosition[2] ] > boidBoxFront){
      velocity[2] -= turnFactor
      isTurning = true
    }

    if(sharedArray[ iPosition[2] ] < boidBoxBack){
      velocity[2] += turnFactor
      isTurning = true
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

    if(vel < minVelocity && !isTurning){
      velocity[0] = velocity[0] / vel * minVelocity
      velocity[1] = velocity[1] / vel * minVelocity
      velocity[2] = velocity[2] / vel * minVelocity
    }

    return velocity

  }).setConstants({
    sal: sal,
    boidLen: boidLen,

    predatorExists: predator.exists ? 1 : 0,
    predatorRange: predator.range,
    predatorX: predator.x,
    predatorY: predator.y,
    predatorZ: predator.z,

    boidBoxTop: boidBox.top,
    boidBoxLeft: boidBox.left,
    boidBoxBottom: boidBox.bottom,
    boidBoxRight: boidBox.right,
    boidBoxFront: boidBox.front,
    boidBoxBack: boidBox.back,

    maxVelocity: maxVelocity,
    minVelocity: minVelocity,
    turnFactor: turnFactor,
    avoidFactor: avoidFactor,
    protectedRange: protectedRange,
    matchingfactor: matchingfactor,
    centeringFactor: centeringFactor,
    predatorturnfactor: predatorturnfactor,
    visibleRange: visibleRange,
    maxPartner: maxPartner,
  }).setPrecision('single').setOutput([boidLen])

  return (sharedArray) => {
    return kernel(sharedArray)
  }

}