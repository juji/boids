import Predator from '../items/predator'
import Boids from '../items/boids'
import BoidBox from '../items/boidBox'

export class Renderer {

  boids: Boids
  boidBox: BoidBox

  predator: Predator
  
  calculators: Worker[] = []
  calcPerThread = 1000 //
  calculatorNum = 1
  boidNum = 500
  canvas: HTMLCanvasElement

  // arrLen per boid
  arrLen = 7

  constructor(
    canvas: HTMLCanvasElement,
    boidNum: number,
    screen: { width:number, height: number },
    reportFps: (fps: number) => void
  ){

    if(!boidNum) throw new Error('boidNum is falsy')

    this.canvas = canvas

    this.predator = new Predator()
    this.calculatorNum = Math.max(Math.ceil(boidNum / this.calcPerThread), 1)
    this.boidNum = boidNum

    let calcNum = this.calculatorNum
    while(calcNum--){
      this.calculators.push(new Worker(new URL("./calculator.ts", import.meta.url),{
        type: 'module'
      }))
    }
    
    // boidbox
    this.boidBox = new BoidBox()
    
    // shared array buffer
    const sab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * this.boidNum * this.arrLen);
    const sharedArray = new Float32Array(sab)

    // position Counter
    const posCounter = new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * this.calculatorNum);
    new Int8Array(posCounter).fill(0)

    ;[...new Array(this.boidNum)].map((_,i) => {

      const position = [

        // outside screen
        Math.random() * this.boidBox.width * (Math.random()<.5?-1:1),
        Math.random() * this.boidBox.height * (Math.random()<.5?-1:1),
        Math.random() * this.boidBox.depth * (Math.random()<.5?-1:1),

        // inside screen
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

      // set sharedArray
      sharedArray[ (i * this.arrLen) + 0 ] = position[0]
      sharedArray[ (i * this.arrLen) + 1 ] = position[1]
      sharedArray[ (i * this.arrLen) + 2 ] = position[2]

      sharedArray[ (i * this.arrLen) + 3 ] = velocity[0]
      sharedArray[ (i * this.arrLen) + 4 ] = velocity[1]
      sharedArray[ (i * this.arrLen) + 5 ] = velocity[2]

      // grid num
      sharedArray[ (i * this.arrLen) + 6 ] = this.boidBox.getGridNum(
        position[0],
        position[1],  
        position[2],  
      )
      
      // return positions
      return { position: position as [number, number, number] }
      
    })

    this.boids = new Boids({
      sharedArray: new Float32Array(sab),
      arrLen: this.arrLen,
      posCounter: new Int8Array(posCounter),
      canvas: canvas,
      boundingBox: screen,
      boidBox: this.boidBox,
      predator: this.predator,
      sendFps: reportFps
    })

    this.calculators.forEach((calc, i) => {

      calc.postMessage({
        start: i * this.calcPerThread,
        end: Math.min(this.boidNum, ((i+1) * this.calcPerThread) - 1),
        sab: sab,
        sal: this.arrLen,
        counterIndex: i,
        posCounter: posCounter,
        boidBox: this.boidBox.toObject(),
        predatorAttr: this.predator.toObject(),
      })

    })

    this.loop()
  }

  // when resize happens
  changeScreenSize(screen: {width:number, height: number}){
    this.boids.setScreenSize(screen)
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