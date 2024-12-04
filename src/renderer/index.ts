import Predator from './items/predator'
import Boids from './items/boids'
import BoidBox from './items/boidBox'
import type { CalculatorPar } from './items/calculator-par'

export class Renderer {

  boids: Boids
  boidBox: BoidBox

  predator: Predator
  
  calculators: Worker[] = []
  calculator: null | (() => void) = null
  calcPerThread = 0
  calculatorNum = 1
  boidNum = 500
  canvas: HTMLCanvasElement

  // arrLen per boid
  arrLen = 7

  //
  posCounter: Int8Array
  sharedArray: Float32Array
  hasChanged: number[]
  boidsLength: number

  //
  reportFps: (fps: number) => void
  prevTime: number = performance.now()
  frames = 0
  fps: number = 0
  setCounter = false

  // log
  log = true

  constructor(par: {
    canvas: HTMLCanvasElement,
    boidNum: number,
    screen: { width:number, height: number },
    calcPerThread: number,
    Calculator: (new () => Worker) | ((c: CalculatorPar) => () => void),
    reportFps: (fps: number) => void
  }){

    const {
      canvas,
      boidNum,
      screen,
      calcPerThread,
      Calculator,
      reportFps,
    } = par

    if(!boidNum) throw new Error('boidNum is falsy')

    this.canvas = canvas
    this.reportFps = reportFps
    this.predator = new Predator()
    this.boidNum = boidNum

    this.calcPerThread = calcPerThread
    this.calculatorNum = calcPerThread ? Math.max(Math.ceil(boidNum / this.calcPerThread), 1) : 0

    let calcNum = this.calculatorNum
    while(calcNum--){
      // @ts-ignore
      this.calculators.push(new Calculator())
    }
    
    // boidbox
    this.boidBox = new BoidBox()
    
    // shared array buffer
    const sab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * this.boidNum * this.arrLen);
    const sharedArray = new Float32Array(sab)

    // position Counter
    const counter = new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * this.calculatorNum);
    this.posCounter = new Int8Array(counter).fill(0)
    this.hasChanged = new Array(this.posCounter.length).fill(0)

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
      
    })

    this.sharedArray = sharedArray

    this.boids = new Boids({
      canvas: canvas,
      boundingBox: screen,
      boidBox: this.boidBox,
      predator: this.predator,
      initialPos: sharedArray.reduce((a,b,i)=> {
        if(
          !(i % this.arrLen) ||
          !((i-1) % this.arrLen) ||
          !((i-2) % this.arrLen)
        ) a.push(b); 
        return a
      },[] as number[])
    })

    this.calculators.forEach((calc, i) => {

      calc.postMessage({
        start: i * this.calcPerThread,
        end: Math.min(this.boidNum, ((i+1) * this.calcPerThread) - 1),
        sab: sab,
        sal: this.arrLen,
        counterIndex: i,
        posCounter: counter,
        boidBox: this.boidBox.toObject(),
        predatorAttr: this.predator.toObject(),
      })

    })

    this.boidsLength = sharedArray.length / this.arrLen

    if(!calcPerThread){
      try{

        const f = Calculator as ((c: CalculatorPar) => () => void)
        this.calculator = f({
          sharedArray,
          sal: this.arrLen,
          boidBox: this.boidBox,
          predator: this.predator,
          boids: this.boids
        })
        this.loop() 
      }catch(e){
        console.error(e)
      }

    }else{
      this.loop()
    }

  }

  // when resize happens
  changeScreenSize(screen: {width:number, height: number}){
    this.boids.setScreenSize(screen)
  }

  setPositions(){

    let counter = this.posCounter.length
    let counterLen = Math.ceil(this.boidsLength / counter)
    while(counter--) {

      if(!this.posCounter[counter]) continue;
      if(this.hasChanged[counter]) continue;
      
      this.hasChanged[counter] = 1
      let start = counter * counterLen
      let end = Math.min(start + counterLen, this.boidsLength)
      
      while(end--) {
        if(end<start) break;
        this.boids.position.set([
          this.sharedArray[ end * this.arrLen + 0 ],
          this.sharedArray[ end * this.arrLen + 1 ],
          this.sharedArray[ end * this.arrLen + 2 ],  
        ], end*3)
      }
      
      this.boids.geometry.attributes.position.needsUpdate = true
    }
    
    if( this.hasChanged.findIndex(v => !v) === -1 ){
      
      this.posCounter.fill(0)
      this.hasChanged.fill(0)
      this.setCounter = true

    }

  }

  loop(){
  
    if(!this.boids) {
      throw new Error('Boids does not exists')
    }
  
    requestAnimationFrame(() => this.loop())
    
    if(this.calculator) {
      this.calculator()
    }
    else this.setPositions()
    
    this.boids.draw()

    if(this.setCounter || this.calculator){
      this.setCounter = false
      
      // fps counter
      const time = performance.now();
      this.frames++;
      if (time > this.prevTime + 1000) {
        let fps = Math.round( ( this.frames * 1000 ) / ( time - this.prevTime ) );
        this.prevTime = time;
        this.frames = 0;
        this.reportFps(fps)
      }
    }
  
  }

}