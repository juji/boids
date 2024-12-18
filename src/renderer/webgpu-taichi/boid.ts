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
  graveYardY: number
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
    graveYardY
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
    graveYardY
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
        let iPos = i * sal

        let iPosition = [
          iPos + 0,
          iPos + 1,
          iPos + 2,
        ]

        const iIsAlive = iPos + 7;
        if(boids[ iIsAlive ] === 1.0){

          let iVelocity = [
            iPos + 3,
            iPos + 4,
            iPos + 5,
          ]

          // 6 is for grid pos
          let iGridPos = iPos + 6

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
          while(j > 0 ) {
            j = j - 1
            if(j===i) continue;
            let jPos = j * sal 

            if(boids[ jPos + 7 ] === 0) continue;


            // grid based neighbour
            // https://ercang.github.io/boids-js/
            if(boids[ jPos + 6 ] !== iGridNum) continue;

            // 
            if(partners >= maxPartner) break;

            let jPosition = [
              jPos + 0,
              jPos + 1,
              jPos + 2,
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

              // let jVelocity = [
              //   jPos + 3,
              //   jPos + 4,
              //   jPos + 5,
              // ]

              // Alignment
              xVelAvg += boids[ jPos + 3 ] 
              yVelAvg += boids[ jPos + 4 ] 
              zVelAvg += boids[ jPos + 5 ] 

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

          // calculate position
          boids[ iVelocity[0] ] += acceleration[0]
          boids[ iVelocity[1] ] += acceleration[1]
          boids[ iVelocity[2] ] += acceleration[2]

          if(predator.exists){

            let predatorDx = boids[ iPosition[0] ] - predator.x
            let predatorDy = boids[ iPosition[1] ] - predator.y
            let predatorDz = boids[ iPosition[2] ] - predator.z

            let predatorDistance = ti.sqrt(
              predatorDx**2 + predatorDy**2 + predatorDz**2
            )

            if(predatorDistance <= predator.size){
              boids[ iIsAlive ] = 0.0
            } else if(predatorDistance < predator.range){

              const velX = Math.abs(boids[ iVelocity[0] ])
              const velY = Math.abs(boids[ iVelocity[1] ])
              const velZ = Math.abs(boids[ iVelocity[2] ])
              const sumVel = velX + velY + velZ

              let tFactorX = 1.0
              if(predatorDx < 0) tFactorX = -1.0
              let tFactorY = 1.0
              if(predatorDy < 0) tFactorY = -1.0
              let tFactorZ = 1.0
              if(predatorDz < 0) tFactorZ = -1.0

              boids[ iVelocity[0] ] += predatorturnfactor * tFactorX * (1 - (velX/sumVel))
              boids[ iVelocity[1] ] += predatorturnfactor * tFactorY * (1 - (velY/sumVel))
              boids[ iVelocity[2] ] += predatorturnfactor * tFactorZ * (1 - (velZ/sumVel))
              
            }
            
          }

          if(boids[ iIsAlive ] === 1.0){

            // turn factor
            // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

            let isTurning = false
            if(boids[ iPosition[0] ] > boidBox.right){
              boids[ iVelocity[0] ] -= turnFactor
              isTurning = true
            }

            if(boids[ iPosition[0] ] < boidBox.left){
              boids[ iVelocity[0] ] += turnFactor
              isTurning = true
            }

            if(boids[ iPosition[1] ] > boidBox.bottom){
              boids[ iVelocity[1] ] -= turnFactor
              isTurning = true
            }

            if(boids[ iPosition[1] ] < boidBox.top){
              boids[ iVelocity[1] ] += turnFactor
              isTurning = true
            }

            if(boids[ iPosition[2] ] > boidBox.front){
              boids[ iVelocity[2] ] -= turnFactor
              isTurning = true
            }

            if(boids[ iPosition[2] ] < boidBox.back){
              boids[ iVelocity[2] ] += turnFactor
              isTurning = true
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

            if(velocity < minVelocity && !isTurning){
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

        }else{

          if(boids[ iPosition[1] ] > graveYardY){
            boids[ iPosition[1] ] -= 5.0
          }

        }

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
