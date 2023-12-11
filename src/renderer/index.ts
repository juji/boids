import { BoidBox } from './boid'
import { type Predator } from './predator'

export class Renderer {

  boundingBox: {width:number, height: number}

  boidNum = 1000
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
    x: 0,
    y: 0
  }

  worker: Worker
  canvas: HTMLCanvasElement

  constructor(
    canvas: HTMLCanvasElement, 
    boundingBox: {width:number, height: number}
  ){

    // let window size set boidNum
    // this.boidNum = Math.min(boundingBox.width, boundingBox.height) < 768 ? 1000 : 1500
    this.boundingBox = boundingBox // screen
    this.canvas = canvas
    
    // worker
    this.worker = new Worker(new URL("./worker.ts", import.meta.url),{
      type: 'module'
    });

    // boidbox
    const { width, height, depth } = this.calculateBoidBox()
    const offscreenCanvas = canvas.transferControlToOffscreen();


    this.worker.postMessage({
      canvas: offscreenCanvas,
      boundingBox: boundingBox,
      boids: [...new Array(this.boidNum)].map(() => {
        return {
          position: [
            Math.random() * width * (Math.random()<.5?-1:1),
            Math.random() * height * (Math.random()<.5?-1:1),
            Math.random() * depth * (Math.random()<.5?-1:1),
          ],
          // give them initial velocity
          velocity: [1,1,1]
        }
        
      }),
      boidBox: this.boidBox,
      predator: this.predatorAttr
    },[ offscreenCanvas ]);

  }

  setPredator(x: number, y: number){
    this.predatorAttr = { 
      ...this.predatorAttr,
      x: (x - this.boundingBox.width/2), 
      y: (y - this.boundingBox.height/2) * -1
    }

    this.worker.postMessage({
      predator: this.predatorAttr
    });
  }

  // when resize happens
  changeBoundingBox(boundingBox: {width:number, height: number}){
    
    this.boundingBox = boundingBox
    this.calculateBoidBox()

    if(this.worker) this.worker.postMessage({
      boidBox: this.boidBox,
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