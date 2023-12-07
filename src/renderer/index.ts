import Boid, { BoidBox } from './boid'

// https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html

export class Renderer {

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  boundingBox: {width:number, height: number}
  stopped = false

  anim: number = 0

  boids: Boid[];
  boidNum = 1500
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

  predator: ({x: number, y: number})|null = null

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

    const { width, height, depth } = this.calculateBoidBox()
    
    const velX = Math.random()<.5?1:-1
    const velY = Math.random()<.5?1:-1
    const velZ = Math.random()<.5?1:-1
    this.boids = [...new Array(this.boidNum)].map(() => {
      
      return new Boid({
        context: this.context,
        position: [
          Math.random() * width * (Math.random()<.5?-1:1),
          Math.random() * height * (Math.random()<.5?-1:1),
          Math.random() * depth * (Math.random()<.5?-1:1),
        ],

        // give them initial velocity
        velocity: [
          Math.random() * 1 * velX,
          Math.random() * 1 * velY,
          Math.random() * 1 * velZ,
        ]

      })

    })

    this.start()

  }

  setPredator(x: number, y: number){
    this.predator = { 
      x: x - this.boundingBox.width/2, 
      y: y - this.boundingBox.height/2
    }
  }

  removePredator(){
    this.predator = null
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

  start(){

    this.calculate()
    
    this.anim = requestAnimationFrame(() => {
      this.draw()
      this.anim = requestAnimationFrame(() => {
        this.start()
      })
    })

  }

  loop(){

    // visible range is a range
    const visibleRange = 40 + Math.random() * 40

    // Separation
    const avoidFactor = 0.05
    const protectedRange = 25

    // Alignment
    const matchingfactor = 0.05

    // Cohesion
    const centeringFactor = 0.0005

    // Predator
    const predatorturnfactor = 0.5
    const predatoryRange = 100

    let i = this.boids.length
    while(i--) {

      this.boids[i].accelleration[0] = 0
      this.boids[i].accelleration[1] = 0
      this.boids[i].accelleration[2] = 0

      // Separation
      let closeDx = 0
      let closeDy = 0
      let closeDz = 0

      let neighboringBoids = 0

      // Alignment
      let xVelAvg = 0
      let yVelAvg = 0
      let zVelAvg = 0

      // Cohesion
      let xPosAvg = 0
      let yPosAvg = 0
      let zPosAvg = 0
      

      let j = this.boids.length
      while(j--) {
        if(j===i) continue;

        const distance = Math.sqrt(
          (this.boids[j].position[0] - this.boids[i].position[0])**2 +
          (this.boids[j].position[1] - this.boids[i].position[1])**2 +
          (this.boids[j].position[2] - this.boids[i].position[2])**2
        )
        
        // Separation
        if(distance < protectedRange){
          closeDx += this.boids[i].position[0] - this.boids[j].position[0]
          closeDy += this.boids[i].position[1] - this.boids[j].position[1]
          closeDz += this.boids[i].position[2] - this.boids[j].position[2]
        }

        if(distance < visibleRange){

          // Alignment
          xVelAvg += this.boids[j].velocity[0] 
          yVelAvg += this.boids[j].velocity[1] 
          zVelAvg += this.boids[j].velocity[2] 

          // Cohesion
          xPosAvg += this.boids[j].position[0]
          yPosAvg += this.boids[j].position[1]
          zPosAvg += this.boids[j].position[2]

          neighboringBoids++

        }

      }

      // Separation
      this.boids[i].accelleration[0] += closeDx * avoidFactor
      this.boids[i].accelleration[1] += closeDy * avoidFactor
      this.boids[i].accelleration[2] += closeDz * avoidFactor
      
      if(neighboringBoids){
        
        // Alignment
        xVelAvg /= neighboringBoids
        yVelAvg /= neighboringBoids
        zVelAvg /= neighboringBoids
        this.boids[i].accelleration[0] += (xVelAvg - this.boids[i].velocity[0]) * matchingfactor
        this.boids[i].accelleration[1] += (yVelAvg - this.boids[i].velocity[1]) * matchingfactor
        this.boids[i].accelleration[2] += (zVelAvg - this.boids[i].velocity[2]) * matchingfactor

        // Cohesion
        xPosAvg /= neighboringBoids
        yPosAvg /= neighboringBoids
        zPosAvg /= neighboringBoids
        this.boids[i].accelleration[0] += (xPosAvg - this.boids[i].position[0]) * centeringFactor
        this.boids[i].accelleration[1] += (yPosAvg - this.boids[i].position[1]) * centeringFactor
        this.boids[i].accelleration[2] += (zPosAvg - this.boids[i].position[2]) * centeringFactor

      }

      if(this.predator){

        const predatorDx = this.boids[i].position[0] - this.predator.x
        const predatorDy = this.boids[i].position[1] - this.predator.y
        const predatorDz = this.boids[i].position[2] - 0 // predator z is always 0

        const predatorDistance = Math.sqrt(
          predatorDx**2 + predatorDy**2 + predatorDz**2
        )

        if(predatorDistance < predatoryRange){
          this.boids[i].accelleration[0] += predatorturnfactor * (predatorDx/Math.abs(predatorDx))
          this.boids[i].accelleration[1] += predatorturnfactor * (predatorDy/Math.abs(predatorDy))
          this.boids[i].accelleration[2] += predatorturnfactor * (predatorDz/Math.abs(predatorDz))
        }
        
      }

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
    
    if(!this.predator){

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
      20, 
      0, 
      2 * Math.PI
    );``

    this.context.fillStyle = "black";
    this.context.fill()

    this.context.strokeStyle = "red";
    this.context.stroke()

  }

}