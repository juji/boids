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
  calcPerThread = 500 //
  calculatorNum = 5
  boidNum = 500
  canvas: HTMLCanvasElement

  // grids
  gridCol = 10
  gridRow = 10
  gridDepth = 10

  // arrLen per boid
  arrLen = 16

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
    const sab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * this.boidNum * this.arrLen);
    const sharedArray = new Float32Array(sab)

    // position Counter
    const posCounter = new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * this.calculatorNum);
    new Int8Array(posCounter).fill(0)

    const boids = [...new Array(this.boidNum)].map((_,i) => {

      const position = [

        // outside boundingBox
        Math.random() * this.width * (Math.random()<.5?-1:1),
        Math.random() * this.height * (Math.random()<.5?-1:1),
        Math.random() * this.depth * (Math.random()<.5?-1:1),

        // inside boundingBox
        // Math.random() * this.width - (this.width * .5),
        // Math.random() * this.height - (this.height * .5),
        // Math.random() * this.depth - (this.depth * .5),
      ]

      // give them initial velocity
      const velocity = [
        Math.random() < 0.5 ? -1 : 1,
        Math.random() < 0.5 ? -1 : 1,
        Math.random() < 0.5 ? -1 : 1,
      ]
      const accelleration = [ 0, 0, 0 ]

      // set sharedArray
      sharedArray[ (i * this.arrLen) + 0 ] = position[0]
      sharedArray[ (i * this.arrLen) + 1 ] = position[1]
      sharedArray[ (i * this.arrLen) + 2 ] = position[2]

      sharedArray[ (i * this.arrLen) + 3 ] = velocity[0]
      sharedArray[ (i * this.arrLen) + 4 ] = velocity[1]
      sharedArray[ (i * this.arrLen) + 5 ] = velocity[2]

      sharedArray[ (i * this.arrLen) + 6 ] = accelleration[0]
      sharedArray[ (i * this.arrLen) + 7 ] = accelleration[1]
      sharedArray[ (i * this.arrLen) + 8 ] = accelleration[2]

      // grid num
      sharedArray[ (i * this.arrLen) + 9 ] = this.getGridNum(
        position[0],
        position[1],  
        position[2],  
      )

      // position and velocity at t
      sharedArray[ (i * this.arrLen) + 10 ] = position[0]
      sharedArray[ (i * this.arrLen) + 11 ] = position[1]
      sharedArray[ (i * this.arrLen) + 12 ] = position[2]

      sharedArray[ (i * this.arrLen) + 13 ] = velocity[0]
      sharedArray[ (i * this.arrLen) + 14 ] = velocity[1]
      sharedArray[ (i * this.arrLen) + 15 ] = velocity[2]
      
      // return positions
      return { position: position as [number, number, number] }
      
    })

    this.boids = new Boids(
      new Float32Array(sab),
      this.arrLen,
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
        sal: this.arrLen,
        counterIndex: i,
        posCounter: posCounter,
        boidBox: this.boidBox,
        predatorAttr: this.predatorAttr,
        gridParams: {
          width: this.width,
          height: this.height,
          depth: this.depth,
          gridCol: this.gridCol,
          gridRow: this.gridRow,
          gridDepth: this.gridDepth,
        }
      })

    })

    this.loop()
  }

  getGridNum(x: number, y: number, z: number){
    return Math.floor((x + this.width * .5) / (this.width / this.gridCol)) +
      Math.floor((y + this.height * .5) / (this.height / this.gridRow)) +
      Math.floor((z + this.depth * .5) / (this.depth / this.gridDepth))
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