import { type Predator } from '../items/predator'
import Boids, { type BoidBox } from '../items/boids'

export class Renderer {

  boids: Boids

  screen: {width:number, height: number}

  // the box
  boxGap = 200 // 
  width = 800
  depth = 500
  height = 500

  // grids
  // these affects fps
  gridCol = 40
  gridRow = 30
  gridDepth = 30
  
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
    exists:true,
    x: 0,
    y: 0,
    z: 0
  }
  
  calculators: Worker[] = []
  calcPerThread = 1000 //
  calculatorNum = 1
  boidNum = 500
  canvas: HTMLCanvasElement

  // arrLen per boid
  arrLen = 7

  constructor(
    canvas: HTMLCanvasElement,
    num: number,
    screen: { width:number, height: number },
    reportFps: (fps: number) => void
  ){

    if(!num) throw new Error('num is falsy')

    // let window size set boidNum
    // this.boidNum = Math.min(screen.width, screen.height) < 768 ? 1000 : 1500
    this.screen = screen // screen
    this.canvas = canvas

    this.calculatorNum = Math.max(Math.ceil(num / this.calcPerThread), 1)
    this.boidNum = num

    let calcNum = this.calculatorNum
    while(calcNum--){
      this.calculators.push(new Worker(new URL("./calculator.ts", import.meta.url),{
        type: 'module'
      }))
    }
    
    // boidbox
    this.boidBox = {
      top: -this.height/2,
      left: -this.width/2,
      bottom: this.height/2,
      right: this.width/2,
      front: this.depth/2,
      back: -this.depth/2,
    }
    
    // shared array buffer
    const sab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * this.boidNum * this.arrLen);
    const sharedArray = new Float32Array(sab)

    // position Counter
    const posCounter = new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * this.calculatorNum);
    new Int8Array(posCounter).fill(0)

    ;[...new Array(this.boidNum)].map((_,i) => {

      const position = [

        // outside screen
        Math.random() * this.width * (Math.random()<.5?-1:1),
        Math.random() * this.height * (Math.random()<.5?-1:1),
        Math.random() * this.depth * (Math.random()<.5?-1:1),

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
      sharedArray[ (i * this.arrLen) + 6 ] = this.getGridNum(
        position[0],
        position[1],  
        position[2],  
      )
      
      // return positions
      return { position: position as [number, number, number] }
      
    })

    this.boids = new Boids(
      new Float32Array(sab),
      this.arrLen,
      new Int8Array(posCounter),
      canvas,
      screen,
      this.boidBox,
      reportFps
    )

    this.calculators.forEach((calc, i) => {

      calc.postMessage({
        start: i * this.calcPerThread,
        end: Math.min(this.boidNum, ((i+1) * this.calcPerThread) - 1),
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

  // setPredator(x: number, y: number){
  //   this.predatorAttr = { 
  //     ...this.predatorAttr,
  //     x: (x - this.screen.width/2), 
  //     y: (y - this.screen.height/2) * -1
  //   }

  //   this.calculators.forEach((calc) => {
  //     calc.postMessage({
  //       predatorAttr: this.predatorAttr
  //     })
  //   })

  //   this.boids.setPredator(this.predatorAttr)
  // }

  // when resize happens
  changeScreenSize(screen: {width:number, height: number}){
    
    this.screen = screen
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