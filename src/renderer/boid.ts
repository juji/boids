export type BoidBox = {
  top: number
  left: number
  bottom: number,
  right: number
  front: number
  back: number  
}

export default class Boid{

  position: [number, number, number] = [0,0,0]
  velocity: [number, number, number] = [0,0,0]
  accelleration: [number, number, number] = [0,0,0]
  context: CanvasRenderingContext2D

  minRadius = 1
  maxRadius = 3
  maxVelocity: number = 5

  turnFactor: number = 0.05 + Math.random() * 0.2

  constructor({
    context,
    position,
    velocity,
  }:{
    context: CanvasRenderingContext2D
    position?: [number, number, number]
    velocity?: [number, number, number]
  }){

    this.context = context
    if(position) this.position = position
    if(velocity) this.velocity = velocity

  }

  calculate( boidBox: BoidBox ){

    this.velocity[0] += this.accelleration[0]
    this.velocity[1] += this.accelleration[1]
    this.velocity[2] += this.accelleration[2]

    // turn factor
    // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

    if(this.position[0] > boidBox.right){
      this.velocity[0] -= this.turnFactor
    }

    if(this.position[0] < boidBox.left){
      this.velocity[0] += this.turnFactor
    }

    if(this.position[1] > boidBox.bottom){
      this.velocity[1] -= this.turnFactor
    }

    if(this.position[1] < boidBox.top){
      this.velocity[1] += this.turnFactor
    }

    if(this.position[2] > boidBox.front){
      this.velocity[2] -= this.turnFactor
    }

    if(this.position[2] < boidBox.back){
      this.velocity[2] += this.turnFactor
    }

    // set max velocity
    this.velocity[0] = Math.max(Math.min(this.velocity[0], this.maxVelocity),-this.maxVelocity)
    this.velocity[1] = Math.max(Math.min(this.velocity[1], this.maxVelocity),-this.maxVelocity)
    this.velocity[2] = Math.max(Math.min(this.velocity[2], this.maxVelocity),-this.maxVelocity)

    this.position[0] += this.velocity[0]
    this.position[1] += this.velocity[1]
    this.position[2] += this.velocity[2]

  }

  draw( boidBox: BoidBox ){

    this.context.beginPath();

    const radius = this.minRadius + (
      this.position[2] + boidBox.front
    ) / (
      boidBox.front*2
    ) * (this.maxRadius - this.minRadius)
    
    this.context.arc(
      this.position[0], 
      this.position[1], 
      Math.min(Math.max(this.minRadius, radius), this.maxRadius), 
      0, 
      2 * Math.PI
    );

    this.context.fillStyle = "orange";
    this.context.fill()

  }

}