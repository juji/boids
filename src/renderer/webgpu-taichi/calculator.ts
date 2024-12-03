import Predator from '../items/predator'
import BoidBox from '../items/boidBox'
import { main } from './boid'

let predator:Predator

let boidBox: BoidBox

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
const avoidFactor = 0.05
const protectedRange = 16

// Alignment
const matchingfactor = 0.15

// Cohesion
const centeringFactor = 0.0005

// Predator
const predatorturnfactor = 0.9
let predatoryRange = 0

// visible range is a range
// and visible range should always be > protectedRange
const getVisibleRange = () => 40 + Math.random() * 40

// greatly  affects fps
// but, setting these to low, 
// we will start to see group of boids on the same space
const maxPartner = 30 // max is calcPerThread
//

// shares array length per boid
let sal = 0
let calculatePosition: () => Promise<number[]>

let log = 1

function calculate(){
  if(!sharedArray) {
    throw new Error('sharedArray does not exists')
  }

  requestAnimationFrame(() => calculate())

  // loop: calculate acceleration
  if( !posCounter[ counterIndex ] ){
    posCounter[ counterIndex ] = 1
    

    calculatePosition().then(res => {
      if(log && start){
        log++
        if(log === 20) log = 0
        console.log('sal', sal)
        console.log('start at', start, sal * start)
        console.log('ends at', end, sal * (end + 1))
        console.log(start ? 'END': 'START')
        console.log(res.slice(sal * start, sal * (end + 1)))
      }
      const s = sal * start
      const e = sal * (end + 1)
      for(let i = s; i < e; i++)
        sharedArray[i] = res[i]  
      // sharedArray.set(res)
    })

  }

}


self.onmessage = (e: MessageEvent) => {

  const { data } = e

  if(data.predatorAttr){
    predator = data.predatorAttr
    predatoryRange = (predator.size || 0) * 3
  }

  if(data.boidBox)
    boidBox = new BoidBox(data.boidBox)

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

    console.log(start ? 'END': 'START', [...sharedArray].slice(sal * start, sal * (end + 1)))
    
    if(!calculating){

      const visibleRange = getVisibleRange()
      main({
        sharedArray,
        sal,
        predatoryRange,
        predator,
        boidBox: boidBox.toObject(),
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
      }).then(v => {
        calculatePosition = v
        calculating = true
        calculate()
      })

    }
  }

}