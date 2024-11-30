import { BoidBox } from './types'
import { type Predator } from './types'
import Boids from './boids'

export class Renderer {

  boids: Boids

  boundingBox: {width:number, height: number}

  boxGap = 200
  depth = 500
  width = 500
  height = 500
  
  boidBox: BoidBox = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    front: 0,
    back: 0,
  }
  
  predatorAttr: Predator = {
    size: 40,
    x: 0,
    y: 0
  }
  
  calculators: Worker[] = []
  calcPerThread = 100 //
  calculatorNum = 1
  boidNum = 500
  canvas: HTMLCanvasElement

  constructor(
    canvas: HTMLCanvasElement,
    num: number,
    boundingBox: { width:number, height: number },
    reportFps: (fps: number) => void
  ){

    // let window size set boidNum
    // this.boidNum = Math.min(boundingBox.width, boundingBox.height) < 768 ? 1000 : 1500
    this.boundingBox = boundingBox // screen
    this.canvas = canvas

    if(num){
      this.calculatorNum = Math.max(Math.round(num / this.calcPerThread), 1)
      this.boidNum = Math.min(num, this.calcPerThread * this.calculatorNum)
    }

    let calcNum = this.calculatorNum
    while(calcNum--){
      this.calculators.push(new Worker(new URL("./calculator.ts", import.meta.url),{
        type: 'module'
      }))
    }
    
    // boidbox
    this.calculateBoidBox()
    
    // shared array buffer
    const sab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * this.boidNum * 3 * 3);
    const sharedArray = new Float32Array(sab)

    // acceleration counter
    const accelCounter = new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * this.calculatorNum);
    new Int8Array(accelCounter).fill(0)

    // position Counter
    const posCounter = new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * this.calculatorNum);
    new Int8Array(posCounter).fill(0)


    const velocityXYZ = [
      Math.random() < 0.5 ? -1 : 1,
      Math.random() < 0.5 ? -1 : 1,
      Math.random() < 0.5 ? -1 : 1,
    ]

    const boids = [...new Array(this.boidNum)].map((_,i) => {

      const position = [
        Math.random() * this.width * (Math.random()<.5?-1:1),
        Math.random() * this.height * (Math.random()<.5?-1:1),
        Math.random() * this.depth * (Math.random()<.5?-1:1),
      ]

      // give them initial velocity
      const velocity = [...velocityXYZ]
      const accelleration = [ 0, 0, 0 ]
      const arrLen = 9

      // set sharedArray
      sharedArray[ (i * arrLen) ] = position[0]
      sharedArray[ (i * arrLen) + 1 ] = position[1]
      sharedArray[ (i * arrLen) + 2 ] = position[2]

      sharedArray[ (i * arrLen) + 3 ] = velocity[0]
      sharedArray[ (i * arrLen) + 4 ] = velocity[1]
      sharedArray[ (i * arrLen) + 5 ] = velocity[2]

      sharedArray[ (i * arrLen) + 6 ] = accelleration[0]
      sharedArray[ (i * arrLen) + 7 ] = accelleration[1]
      sharedArray[ (i * arrLen) + 8 ] = accelleration[2]
      
      // return positions
      return { position: position as [number, number, number] }
      
    })

    this.boids = new Boids(
      new Float32Array(sab),
      new Int8Array(accelCounter),
      new Int8Array(posCounter),
      boids,
      canvas,
      boundingBox,
      this.boidBox,
      reportFps
    )

    this.calculators.forEach((calc, i) => {

      calc.postMessage({
        start: i * (this.boidNum / this.calculatorNum),
        end: (i+1) * (this.boidNum / this.calculatorNum) - 1,
        sab: sab,
        counterIndex: i,
        accelCounter: accelCounter,
        posCounter: posCounter,
        boidBox: this.boidBox,
        predatorAttr: this.predatorAttr
      })

    })

    this.loop()
  }

  setPredator(x: number, y: number){
    this.predatorAttr = { 
      ...this.predatorAttr,
      x: (x - this.boundingBox.width/2), 
      y: (y - this.boundingBox.height/2) * -1
    }

    this.calculators.forEach((calc) => {
      calc.postMessage({
        predatorAttr: this.predatorAttr
      })
    })

    this.boids.setPredator(this.predatorAttr)
  }

  // when resize happens
  changeBoundingBox(boundingBox: {width:number, height: number}){
    
    this.boundingBox = boundingBox
    this.calculateBoidBox()

    this.calculators.forEach((calc) => {

      calc.postMessage({
        boidBox: this.boidBox,
        boundingBox: this.boundingBox
      })

    })

    this.boids.setBoundingBox(boundingBox)

  }

  calculateBoidBox(){

    this.boxGap = 0

    this.boidBox = {
      top: (-this.height/2) + this.boxGap,
      left: (-this.width/2) + this.boxGap,
      bottom: (this.height/2) - this.boxGap,
      right: (this.width/2) - this.boxGap,
      front: (this.depth/2) - this.boxGap,
      back: (-this.depth/2) + this.boxGap
    }

  }

  loop(){
  
    if(!this.boids) {
      throw new Error('Boids does not exists')
    }
  
    requestAnimationFrame(() => this.loop())
  
    this.boids.setPositions()
    this.boids.draw()
  
  }

}