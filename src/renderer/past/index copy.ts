import Boid, { BoidBox } from '../boid'

export class Renderer {

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  boundingBox: {width:number, height: number}
  stopped = false

  anim: number = 0

  boids: Boid[];
  boidNum = 500
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
      top: (-boundingBox.height/2) + this.boxGap,
      left: (-boundingBox.width/2) + this.boxGap,
      bottom: (boundingBox.height/2) - this.boxGap,
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
          Math.random() * 7 * (Math.random()<.5?-1:1),
          Math.random() * 7 * (Math.random()<.5?-1:1),
          Math.random() * 7 * (Math.random()<.5?-1:1),
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

  loop(){

    const avoidFactor = 1
    const matchingFactor = 0.1

    let i = this.boids.length
    while(i--) {
      let j = this.boids.length
      this.boids[i].accelleration[0] = 0
      this.boids[i].accelleration[1] = 0
      this.boids[i].accelleration[2] = 0

      // separation 
      let distanceX = 0
      let distanceY = 0
      let distanceZ = 0

      // alignment
      let friends = 0
      let xVelAvg = 0
      let yVelAvg = 0
      let zVelAvg = 0

      while(j--) {
        if(j === i) continue; 
        
        const separation = this.separation(this.boids[i], this.boids[j])
        if(separation){
          const [ distanceDx, distanceDy, distanceDz ] = separation 
          distanceX += distanceDx
          distanceY += distanceDy
          distanceZ += distanceDz
        }

        const alignment = this.alignment(this.boids[i], this.boids[j])
        if(alignment){
          const [ xVelSun, yVelSum, zVelSum ] = alignment
          xVelAvg += xVelSun 
          yVelAvg += yVelSum 
          zVelAvg += zVelSum
          friends++
        }
        


      }

      // separation 
      this.boids[i].accelleration[0] = distanceX * avoidFactor
      this.boids[i].accelleration[1] = distanceY * avoidFactor
      this.boids[i].accelleration[2] = distanceZ * avoidFactor

      // alignment
      if(friends){
        xVelAvg /= friends
        yVelAvg /= friends
        zVelAvg /= friends
        this.boids[i].accelleration[0] += ( xVelAvg - this.boids[i].velocity[0] ) * matchingFactor
        this.boids[i].accelleration[1] += ( yVelAvg - this.boids[i].velocity[1] ) * matchingFactor
        this.boids[i].accelleration[2] += ( zVelAvg - this.boids[i].velocity[2] ) * matchingFactor
      }

    }
  }

  separation( boid: Boid, friend: Boid ){

    const protectedRange = 20
        
    if(Math.sqrt(
      (friend.position[0] - boid.position[0])**2 +
      (friend.position[1] - boid.position[1])**2 +
      (friend.position[2] - boid.position[2])**2
    ) > protectedRange) return null;
    
    return [
      boid.position[0] - friend.position[0],
      boid.position[1] - friend.position[1],
      boid.position[2] - friend.position[2],
    ]

  }

  alignment( boid: Boid, friend: Boid ){

    const visibleRange = 80

    if(Math.sqrt(
      (friend.position[0] - boid.position[0])**2 +
      (friend.position[1] - boid.position[1])**2 +
      (friend.position[2] - boid.position[2])**2
    ) > visibleRange) return null;
    
    return [
      friend.velocity[0],
      friend.velocity[1],
      friend.velocity[2],
    ]

  }

  cohesion(){
    const centeringfactor = 1
    const visibleRange = 80

  }

  calculate(){

    this.loop()

    let i = this.boids.length
    while(i--) this.boids[i].calculate( this.boidBox )

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

}