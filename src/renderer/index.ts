import { BoidBox } from './types'
import { type Predator } from './types'

export class Renderer {

  boundingBox: {width:number, height: number}

  boxGap = 200
  depth = 100
  
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
  
  worker: Worker
  calculators: Worker[] = []
  calculatorNum = 10
  boidNum = 100 * this.calculatorNum
  canvas: HTMLCanvasElement

  constructor(
    canvas: HTMLCanvasElement,
    num: number,
    boundingBox: {width:number, height: number}
  ){

    // let window size set boidNum
    // this.boidNum = Math.min(boundingBox.width, boundingBox.height) < 768 ? 1000 : 1500
    this.boundingBox = boundingBox // screen
    this.canvas = canvas

    if(num){
      this.calculatorNum = Math.round(num / 500)
      this.boidNum = 500 * this.calculatorNum
    }

    console.log('boidNum', this.boidNum)

    
    // worker
    this.worker = new Worker(new URL("./worker.ts", import.meta.url),{
      type: 'module'
    });

    let calcNum = this.calculatorNum
    while(calcNum--){
      this.calculators.push(new Worker(new URL("./calculator.ts", import.meta.url),{
        type: 'module'
      }))
    }
    
    // boidbox
    const { width, height, depth } = this.calculateBoidBox()
    const offscreenCanvas = canvas.transferControlToOffscreen();
    
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

    this.worker.postMessage({
      canvas: offscreenCanvas,
      boundingBox: boundingBox,
      sab: sab,
      accelCounter: accelCounter,
      posCounter: posCounter,
      boids: [...new Array(this.boidNum)].map((_,i) => {

        const position = [
          Math.random() * width * (Math.random()<.5?-1:1),
          Math.random() * height * (Math.random()<.5?-1:1),
          Math.random() * depth * (Math.random()<.5?-1:1),
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
        return { position }
        
      }),
      boidBox: this.boidBox,
      predator: this.predatorAttr
    },[ offscreenCanvas ]);


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

    this.worker.postMessage({
      predator: this.predatorAttr
    });
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

    if(this.worker) this.worker.postMessage({
      boundingBox: this.boundingBox
    });

  }

  calculateBoidBox(){
    const width = this.boundingBox.width/2
    const height = this.boundingBox.height/2
    const smaller = Math.min(width, height)

    this.boxGap = 3 * smaller / 10

    this.boidBox = {
      top: (-height/2) + this.boxGap,
      left: (-width) + this.boxGap,
      bottom: (height/2) - this.boxGap,
      right: (width) - this.boxGap,
      front: this.depth - this.boxGap,
      back: -this.depth + this.boxGap
    }

    return { width, height, depth: this.depth }
  }

}