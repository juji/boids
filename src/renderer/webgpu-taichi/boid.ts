import Predator from '../items/predator'
import { type BoidBoxObject } from '../items/boidBox'

// @ts-ignore
import * as ti from "taichi.js"

export async function main(par:{
  sharedArray: Float32Array
  sal: number
  predator: Predator
  boidBox: BoidBoxObject
  maxVelocity: number
  minVelocity: number
  turnFactor: number
  avoidFactor: number
  protectedRange: number
  matchingfactor: number
  centeringFactor: number
  predatorturnfactor: number
  visibleRange: number
  maxPartner: number
  start: number
  end: number
}){

  const {
    sharedArray,
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
    start,
    end
  } = par

  await ti.init();

  const N = sharedArray.length / sal
  let boids = ti.field(ti.f32, sharedArray.length)
  
  // writing
  await boids.fromArray([...sharedArray])

  ti.addToKernelScope({ 
    boids, 
    N,
    sal,
    maxVelocity,
    minVelocity,
    turnFactor,
    avoidFactor,
    protectedRange,
    matchingfactor,
    centeringFactor,
    predatorturnfactor,
    visibleRange,
    predator,
    boidBox,
    maxPartner,
    start,
    end
  })

  let calculate = ti.kernel(
    `() => {

      let getGridNum = (x: number, y: number, z: number) => {
        return Math.floor((x + boidBox.width * .5) / (boidBox.width / boidBox.gridCol)) +
          Math.floor((y + boidBox.height * .5) / (boidBox.height / boidBox.gridRow)) +
          Math.floor((z + boidBox.depth * .5) / (boidBox.depth / boidBox.gridDepth))
      }

      for(let i of ti.range(N)){

        let partners = 0
        const acceleration = [ 0.0, 0.0, 0.0 ]

        let iPosition = [
          (i * sal) + 0 + (start * sal),
          (i * sal) + 1 + (start * sal),
          (i * sal) + 2 + (start * sal),
        ]

        let iVelocity = [
          (i * sal) + 3 + (start * sal),
          (i * sal) + 4 + (start * sal),
          (i * sal) + 5 + (start * sal),
        ]

        // 6 is for grid pos
        let iGridPos = (i * sal) + 6 + (start * sal)

        // Separation
        let closeDx = 0.0
        let closeDy = 0.0
        let closeDz = 0.0

        let neighboringBoids = 0

        // Alignment
        let xVelAvg = 0.0
        let yVelAvg = 0.0
        let zVelAvg = 0.0

        // Cohesion
        let xPosAvg = 0.0
        let yPosAvg = 0.0
        let zPosAvg = 0.0

        let iGridNum = boids[ iGridPos ]
        
        // calculate neighbour effect
        let j = N
        while(j) {
          j = j - 1
          if(j===i) continue;

          // grid based neighbour
          // https://ercang.github.io/boids-js/
          if(boids[ j * sal + 6 ] !== iGridNum) continue;

          // 
          if(partners >= maxPartner) break;

          let jPosition = [
            (j * sal) + 0,
            (j * sal) + 1,
            (j * sal) + 2,
          ]
          
          let distance = ti.sqrt(
            (boids[ jPosition[0] ] - boids[ iPosition[0] ]) ** 2 +
            (boids[ jPosition[1] ] - boids[ iPosition[1] ]) ** 2 +
            (boids[ jPosition[2] ] - boids[ iPosition[2] ]) ** 2
          )

          if(distance >= visibleRange) continue;
          partners = partners + 1;

          // Separation
          if(distance < protectedRange){
            closeDx += boids[ iPosition[0] ] - boids[ jPosition[0] ]
            closeDy += boids[ iPosition[1] ] - boids[ jPosition[1] ]
            closeDz += boids[ iPosition[2] ] - boids[ jPosition[2] ]
          }

          else if(distance < visibleRange){

            let jVelocity = [
              (j * sal) + 3,
              (j * sal) + 4,
              (j * sal) + 5,
            ]

            // Alignment
            xVelAvg += boids[ jVelocity[0] ] 
            yVelAvg += boids[ jVelocity[1] ] 
            zVelAvg += boids[ jVelocity[2] ] 

            // Cohesion
            xPosAvg += boids[ jPosition[0] ]
            yPosAvg += boids[ jPosition[1] ]
            zPosAvg += boids[ jPosition[2] ]

            neighboringBoids = neighboringBoids + 1

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
          acceleration[0] += (xVelAvg - boids[ iVelocity[0] ]) * matchingfactor
          acceleration[1] += (yVelAvg - boids[ iVelocity[1] ]) * matchingfactor
          acceleration[2] += (zVelAvg - boids[ iVelocity[2] ]) * matchingfactor

          // Cohesion
          xPosAvg /= neighboringBoids
          yPosAvg /= neighboringBoids
          zPosAvg /= neighboringBoids
          acceleration[0] += (xPosAvg - boids[ iPosition[0] ]) * centeringFactor
          acceleration[1] += (yPosAvg - boids[ iPosition[1] ]) * centeringFactor
          acceleration[2] += (zPosAvg - boids[ iPosition[2] ]) * centeringFactor

        }

        if(predator.exists){

          let predatorDx = boids[ iPosition[0] ] - predator.x
          let predatorDy = boids[ iPosition[1] ] - predator.y
          let predatorDz = boids[ iPosition[2] ] - predator.z

          let predatorDistance = ti.sqrt(
            predatorDx**2 + predatorDy**2 + predatorDz**2
          )

          if(predatorDistance < predator.range){
            let n = 1.0
            if(predatorDx < 0) n = -1.0
            acceleration[0] += predatorturnfactor * n
            acceleration[1] += predatorturnfactor * n
            acceleration[2] += predatorturnfactor * n
          }
          
        }

        // calculate position
        boids[ iVelocity[0] ] += acceleration[0]
        boids[ iVelocity[1] ] += acceleration[1]
        boids[ iVelocity[2] ] += acceleration[2]

        // turn factor
        // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

        if(boids[ iPosition[0] ] > boidBox.right){
          boids[ iVelocity[0] ] -= turnFactor * Math.random() * 0.6
        }

        if(boids[ iPosition[0] ] < boidBox.left){
          boids[ iVelocity[0] ] += turnFactor * Math.random() * 0.6
        }

        if(boids[ iPosition[1] ] > boidBox.bottom){
          boids[ iVelocity[1] ] -= turnFactor * Math.random() * 0.6
        }

        if(boids[ iPosition[1] ] < boidBox.top){
          boids[ iVelocity[1] ] += turnFactor * Math.random() * 0.6
        }

        if(boids[ iPosition[2] ] > boidBox.front){
          boids[ iVelocity[2] ] -= turnFactor * Math.random() * 0.6
        }

        if(boids[ iPosition[2] ] < boidBox.back){
          boids[ iVelocity[2] ] += turnFactor * Math.random() * 0.6
        }

        // limit velocity
        let velocity = ti.sqrt(
          boids[ iVelocity[0] ]**2 + 
          boids[ iVelocity[1] ]**2 + 
          boids[ iVelocity[2] ]**2
        )

        if(velocity > maxVelocity){
          boids[ iVelocity[0] ] = boids[ iVelocity[0] ] / velocity * maxVelocity
          boids[ iVelocity[1] ] = boids[ iVelocity[1] ] / velocity * maxVelocity
          boids[ iVelocity[2] ] = boids[ iVelocity[2] ] / velocity * maxVelocity
        }

        if(velocity < minVelocity){
          boids[ iVelocity[0] ] = boids[ iVelocity[0] ] / velocity * minVelocity
          boids[ iVelocity[1] ] = boids[ iVelocity[1] ] / velocity * minVelocity
          boids[ iVelocity[2] ] = boids[ iVelocity[2] ] / velocity * minVelocity
        }

        //
        boids[ iPosition[0] ] += boids[ iVelocity[0] ]
        boids[ iPosition[1] ] += boids[ iVelocity[1] ]
        boids[ iPosition[2] ] += boids[ iVelocity[2] ]

        // grid pos
        boids[ iGridPos ] = getGridNum(
          boids[ iPosition[0] ],
          boids[ iPosition[1] ],
          boids[ iPosition[2] ]
        )

      }
    }`
  )

  // const n = performance.now();
  return {
    calculate: async (): Promise<number[]> => {
      await calculate()
      return await boids.toArray()
    }
  }
  // const ms = performance.now() - n
  // console.log('N',N)
  // console.log('ms', ms)
  // console.log('fps', 1000/ms)

}
