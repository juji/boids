import Boid, { BoidBox } from './boid'
import { type Predator } from './predator'

let boids:Boid[] = []
let boidBox: BoidBox = {
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  front: 0,
  back: 0,
}

let calculating = false

let predator:Predator = {
  exists: false,
  size: 0,
  x: 0,
  y: 0
}

function loop(){

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
  const predatoryRange = predator.size * 2

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


function calculate( postMessage: typeof self.postMessage){

  loop()
  let i = boids.length
  while(i--) boids[i].calculate( boidBox )
  postMessage(JSON.stringify({
    positions: boids.map(boid => boid.getPosition())
  }))
  requestAnimationFrame(() => calculate( postMessage ))
  
}



self.onmessage = (e: MessageEvent<string>) => {

  const data = JSON.parse(e.data)
  // console.log(data)

  if(data.predator){
    console.log(data.predator)
    predator = data.predator
  }

  if(data.boidBox){
    boidBox = data.boidBox
  }

  if(data.boids){
    boids = data.boids.map((boid : any) => {
      
      return new Boid({
        position: boid.position,
        velocity: boid.velicity
      })

    });
  }

  if(!calculating){
    calculating = true
    calculate( self.postMessage )
  }

  // self.postMessage({ ok: true });

}
