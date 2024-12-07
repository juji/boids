import Predator from '../items/predator'
import BoidBox from '../items/boidBox'
import { main } from './boid'

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

let predator:Predator
let boidBox: BoidBox
let sharedArray: Float32Array;
let calculating = false
let hasChange = new Int8Array()

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

function calculate(){
  if(!sharedArray) {
    throw new Error('sharedArray does not exists')
  }

  calculatePosition().then(res => {
    hasChange[0] = 1
    sharedArray.set(res)
    requestAnimationFrame(() => calculate())
  })

}


self.onmessage = (e: MessageEvent) => {

  const { data } = e

  if(data.predatorAttr){
    predator = data.predatorAttr
  }

  if(data.boidBox){
    boidBox = new BoidBox(data.boidBox)
  }

  if(data.hc){
    hasChange = new Int8Array(data.hc)
  }

  if(
    data.sab && data.sal &&
    typeof data.hc !== 'undefined'
  ){

    sal = data.sal
    sharedArray = new Float32Array(data.sab)
    
    if(!calculating){
      calculating = true
      const visibleRange = getVisibleRange()
      main({
        sharedArray,
        sal,
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
      }).then(v => {
        calculatePosition = v.calculate
        calculate()
      })

    }
  }

}