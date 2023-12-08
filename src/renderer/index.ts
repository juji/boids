import Boid, { BoidBox } from './boid'
import { type Predator } from './predator'

export class Renderer {

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  boundingBox: {width:number, height: number}
  stopped = false

  anim: number = 0

  boids: Boid[];
  boidNum = 2500
  boxGap = 200
  depth = 200
  boidBox: BoidBox = {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    front: 0,
    back: 0,
  }

  predator: Predator = {
    size: 40,
    x: -1000,
    y: -1000,
    exists: false
  }
  worker: Worker

  constructor(
    canvas: HTMLCanvasElement, 
    boundingBox: {width:number, height: number}
  ){

    // let window size set boidNum
    this.boidNum = Math.min(boundingBox.width, boundingBox.height) < 768 ? 
      1000 : 2000

    this.canvas = canvas
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
    this.boundingBox = boundingBox // screen
    this.canvas.width = boundingBox.width
    this.canvas.height = boundingBox.height
    this.canvas.style.width = `${boundingBox.width}px`
    this.canvas.style.height = `${boundingBox.height}px`

    this.context.translate(
      boundingBox.width/2,
      boundingBox.height/2
    )

    const { width, height, depth } = this.calculateBoidBox()
    
    this.boids = [...new Array(this.boidNum)].map(() => {
      
      return new Boid({
        context: this.context,
        position: [
          Math.random() * width * (Math.random()<.5?-1:1),
          Math.random() * height * (Math.random()<.5?-1:1),
          Math.random() * depth * (Math.random()<.5?-1:1),
        ],

        // give them initial velocity
        velocity: [1,1,1]

      })

    })
    
    this.worker = new Worker(new URL("./worker.ts", import.meta.url),{
      type: 'module'
    });

    this.worker.onmessage = (e: MessageEvent) => {
      const data = JSON.parse(e.data)
      if(data.positions){
        let i = this.boids.length
        while(i--) this.boids[i].setPosition(data.positions[i])
        this.draw()
      }
    }

    this.worker.postMessage(JSON.stringify({
      boids: this.boids,
      boidBox: this.boidBox,
      predator: this.predator
    }));

  }

  intersectPredator(x: number, y: number){
    return (
      ((this.predator.x + this.boundingBox.width/2) - x)**2 +
      ((this.predator.y + this.boundingBox.height/2) - y)**2
    ) < (this.predator.size**2)
  }

  setPredator(x: number, y: number){
    this.predator = { 
      size: this.predator.size,
      exists: true,
      x: x - this.boundingBox.width/2, 
      y: y - this.boundingBox.height/2
    }

    this.worker.postMessage(JSON.stringify({
      predator: this.predator
    }));
  }

  removePredator(){
    this.predator.exists = false
    this.predator.x = -1000
    this.predator.y = -1000
    this.worker.postMessage(JSON.stringify({
      predator: this.predator
    }));
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

    if(this.worker) this.worker.postMessage(JSON.stringify({
      boidBox: this.boidBox
    }));

    return { width, height, depth: this.depth }
  }
  

  // when resize happens
  changeBoundingBox(boundingBox: {width:number, height: number}){
    this.context.translate(
      -boundingBox.width/2,
      -boundingBox.height/2
    )
    this.boundingBox = boundingBox
    this.canvas.width = boundingBox.width
    this.canvas.height = boundingBox.height
    this.canvas.style.width = `${boundingBox.width}px`
    this.canvas.style.height = `${boundingBox.height}px`
    this.context.translate(
      boundingBox.width/2,
      boundingBox.height/2
    )

    this.calculateBoidBox()
  }

  drawBox(){
    // draw boidBox
    this.context.beginPath()
    this.context.moveTo(this.boidBox.left, this.boidBox.top)
    this.context.lineTo(this.boidBox.right, this.boidBox.top)
    this.context.lineTo(this.boidBox.right, this.boidBox.bottom)
    this.context.lineTo(this.boidBox.left, this.boidBox.bottom)
    this.context.lineTo(this.boidBox.left, this.boidBox.top)
    this.context.strokeStyle = "red";
    this.context.stroke();
  }

  draw(){

    this.context.clearRect(
      -this.boundingBox.width/2, 
      -this.boundingBox.height/2, 
      this.boundingBox.width, 
      this.boundingBox.height
    )
    
    if(!this.predator.exists){

      let i = this.boids.length
      while(i--) this.boids[i].draw( this.boidBox )

    }else{

      let i = this.boids.length
      while(i--) {
        if(this.boids[i].position[2]<=0) this.boids[i].draw( this.boidBox )
      }

      this.drawPredator()

      i = this.boids.length
      while(i--) {
        if(this.boids[i].position[2]>0) this.boids[i].draw( this.boidBox )
      }

    }

    // this.drawBox()

  }

  drawPredator(){

    if(!this.predator) return;

    this.context.beginPath();
    this.context.arc(
      this.predator.x, 
      this.predator.y, 
      this.predator.size,
      0, 
      2 * Math.PI
    );``
    
    this.context.shadowColor = "red";
    this.context.shadowBlur = 10
    this.context.fillStyle = "#212121";
    this.context.fill()
    this.context.shadowBlur = 0

    // this.context.stroke()

  }

}