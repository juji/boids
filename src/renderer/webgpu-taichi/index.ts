import Predator from '../items/predator'
import Boids from '../items/boids'
import BoidBox from '../items/boidBox'
import Calculator from './calculator?worker'

export class Renderer {

  boids: Boids
  boidBox: BoidBox

  predator: Predator
  
  calculator: Worker
  boidNum = 500
  canvas: HTMLCanvasElement

  // arrLen per boid
  arrLen = 7

  //
  sharedArray: Float32Array
  boidsLength: number

  //
  reportFps: (fps: number) => void
  prevTime: number = performance.now()
  frames = 0
  setCounter = false

  // log
  log = true
  hasChange: Int8Array

  constructor(par: {
    canvas: HTMLCanvasElement,
    boidNum: number,
    screen: { width:number, height: number },
    reportFps: (fps: number) => void
  }){

    const {
      canvas,
      boidNum,
      screen,
      reportFps,
    } = par

    if(!boidNum) throw new Error('boidNum is falsy')

    this.canvas = canvas
    this.reportFps = reportFps
    this.predator = new Predator()
    this.boidNum = boidNum

    this.calculator = new Calculator()
    
    // boidbox
    this.boidBox = new BoidBox()
    
    // shared array buffer
    const sab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * this.boidNum * this.arrLen);
    const sharedArray = new Float32Array(sab)

    // boolean
    const hc = new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT)
    this.hasChange = new Int8Array(hc)
    this.hasChange[0] = 0

    ;[...new Array(this.boidNum)].map((_,i) => {

      const position = [

        // /* -> toggle
        // outside boidBox
        Math.random() * this.boidBox.width * (Math.random()<.5?-1:1),
        Math.random() * this.boidBox.height * (Math.random()<.5?-1:1),
        Math.random() * this.boidBox.depth * (Math.random()<.5?-1:1),

        /*/
        // inside boidBox
        Math.random() * (this.boidBox.width/2) * (Math.random()<.5?-1:1),
        Math.random() * (this.boidBox.height/2) * (Math.random()<.5?-1:1),
        Math.random() * (this.boidBox.depth/2) * (Math.random()<.5?-1:1),
        //*/
      ]

      // set sharedArray
      sharedArray[ (i * this.arrLen) + 0 ] = position[0]
      sharedArray[ (i * this.arrLen) + 1 ] = position[1]
      sharedArray[ (i * this.arrLen) + 2 ] = position[2]

      sharedArray[ (i * this.arrLen) + 3 ] = Math.random() < 0.5 ? -1 : 1
      sharedArray[ (i * this.arrLen) + 4 ] = Math.random() < 0.5 ? -1 : 1
      sharedArray[ (i * this.arrLen) + 5 ] = Math.random() < 0.5 ? -1 : 1

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

    this.calculator.postMessage({
      sab: sab,
      sal: this.arrLen,
      boidBox: this.boidBox.toObject(),
      predatorAttr: this.predator.toObject(),
      hc,
    })

    this.boidsLength = sharedArray.length / this.arrLen

    this.prevTime = performance.now()
    this.loop() 

  }

  // when resize happens
  changeScreenSize(screen: {width:number, height: number}){
    this.boids.setScreenSize(screen)
  }

  setPositions(){
    let end = this.boidsLength
    
    while(end--){
      this.boids.position.set([
        this.sharedArray[ end * this.arrLen + 0 ],
        this.sharedArray[ end * this.arrLen + 1 ],
        this.sharedArray[ end * this.arrLen + 2 ],  
      ], end*3)  
    }

    this.boids.geometry.attributes.position.needsUpdate = true

  }

  loop(){
  
    requestAnimationFrame(() => this.loop())
    
    this.setPositions()
    this.boids.draw()

    if(this.hasChange[0]){
      this.hasChange[0] = 0
      
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