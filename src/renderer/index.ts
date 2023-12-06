import Boid, { BoidBox } from './boid'

export class Renderer {

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  boundingBox: {width:number, height: number}
  stopped = false

  anim: number = 0

  boids: Boid[];
  boidNum = 1000
  boxGap = 200
  boidBox: BoidBox

  constructor(
    canvas: HTMLCanvasElement, 
    boundingBox: {width:number, height: number}
  ){

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
    
    const width = boundingBox.width/2
    const height = boundingBox.height/2
    const smaller = Math.min(boundingBox.width/2, boundingBox.height/2)
    this.boxGap = 3 * smaller / 10
    this.boidBox = {
      top: (-boundingBox.height/4) + this.boxGap,
      left: (-boundingBox.width/2) + this.boxGap,
      bottom: (boundingBox.height/4) - this.boxGap,
      right: (boundingBox.width/2) - this.boxGap,
      front: smaller - this.boxGap,
      back: -smaller + this.boxGap
    }

    this.boids = [...new Array(this.boidNum)].map(() => {

      return new Boid({
        context: this.context,
        position: [
          Math.random() * width * (Math.random()<.5?-1:1),
          Math.random() * height * (Math.random()<.5?-1:1),
          Math.random() * smaller * (Math.random()<.5?-1:1),
        ],

        // give them initial velocity
        velocity: [
          Math.random() * 2 * (Math.random()<.5?-1:1),
          Math.random() * 2 * (Math.random()<.5?-1:1),
          Math.random() * 2 * (Math.random()<.5?-1:1),
        ]

      })

    })

    this.start()

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

    const smaller = Math.min(boundingBox.width/2, boundingBox.height/2)
    this.boxGap = 3 * smaller / 10
    this.boidBox = {
      top: (-boundingBox.height/2) + this.boxGap,
      left: (-boundingBox.width/2) + this.boxGap,
      bottom: (boundingBox.height/2) - this.boxGap,
      right: (boundingBox.width/2) - this.boxGap,
      front: smaller - this.boxGap,
      back: -smaller + this.boxGap
    }
  }

  start(){

    this.calculate()
    
    this.anim = requestAnimationFrame(() => {
      this.draw()
      this.anim = requestAnimationFrame(() => {
        this.start()
      })
    })

  }

  separation(){
    const avoidFactor = 0.1
    const protectedRange = 20
    let i = this.boids.length
    while(i--) {
      let j = this.boids.length
      let closeDx = 0
      let closeDy = 0
      let closeDz = 0
      while(j--) {

        if(j === i) continue; 
        if(Math.sqrt(
          (this.boids[j].position[0] - this.boids[i].position[0])**2 +
          (this.boids[j].position[1] - this.boids[i].position[1])**2 +
          (this.boids[j].position[2] - this.boids[i].position[2])**2
        ) > protectedRange) continue;

        closeDx += this.boids[j].position[0] - this.boids[i].position[0]
        closeDy += this.boids[j].position[1] - this.boids[i].position[1]
        closeDz += this.boids[j].position[2] - this.boids[i].position[2]

      }

      this.boids[i].accelleration[0] += closeDx * avoidFactor
      this.boids[i].accelleration[1] += closeDy * avoidFactor
      this.boids[i].accelleration[2] += closeDz * avoidFactor
    }
  }

  alignment(){

    const matchingFactor = 0.1
    const visibleRange = 70

    let i = this.boids.length
    while(i--){
      let j = this.boids.length
      let xVelAvg = 0
      let yVelAvg = 0
      let zVelAvg = 0
      let neighbour = 0
      
      while(j--){
        if(j === i) continue;
        if(Math.sqrt(
          (this.boids[j].position[0] - this.boids[i].position[0])**2 +
          (this.boids[j].position[1] - this.boids[i].position[1])**2 +
          (this.boids[j].position[2] - this.boids[i].position[2])**2
        ) > visibleRange) continue;

        xVelAvg = this.boids[j].velocity[0]
        yVelAvg = this.boids[j].velocity[1]
        zVelAvg = this.boids[j].velocity[2]
        neighbour += 1
      }

      if(!neighbour) continue;
      xVelAvg /= neighbour
      yVelAvg /= neighbour
      zVelAvg /= neighbour
      this.boids[i].accelleration[0] += ( xVelAvg - this.boids[i].velocity[0] ) * matchingFactor
      this.boids[i].accelleration[1] += ( yVelAvg - this.boids[i].velocity[1] ) * matchingFactor
      this.boids[i].accelleration[2] += ( zVelAvg - this.boids[i].velocity[2] ) * matchingFactor
    }

  }

  cohesion(){
    // const centeringfactor = 1
    // const visibleRange = 80
  }

  loop(){

    let i = this.boids.length
    while(i--) {
      this.boids[i].accelleration[0] = 0
      this.boids[i].accelleration[1] = 0
      this.boids[i].accelleration[2] = 0
      


    }

  }

  calculate(){

    this.loop()

    let i = this.boids.length
    while(i--) this.boids[i].calculate( this.boidBox )

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
    
    let i = this.boids.length
    while(i--) this.boids[i].draw( this.boidBox )

    this.drawBox()

  }

}