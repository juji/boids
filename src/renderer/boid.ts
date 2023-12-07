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

  minRadius = 0.7
  maxRadius = 1.4
  maxVelocity: number = 4
  minVelocity: number = 3

  turnFactor: number = 0.2

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

    const turnFactor = Math.random() * this.turnFactor

    if(this.position[0] > boidBox.right){
      this.velocity[0] -= this.turnFactor * Math.random() * 0.9
    }

    if(this.position[0] < boidBox.left){
      this.velocity[0] += this.turnFactor * Math.random() * 0.9
    }

    if(this.position[1] > boidBox.bottom){
      this.velocity[1] -= this.turnFactor * Math.random() * 0.4
    }

    if(this.position[1] < boidBox.top){
      this.velocity[1] += this.turnFactor * Math.random() * 0.4
    }

    if(this.position[2] > boidBox.front){
      this.velocity[2] -= turnFactor
    }

    if(this.position[2] < boidBox.back){
      this.velocity[2] += turnFactor
    }

    // this is interesting
    // the forbidden tablet
    // THIS no longer exists
    // this.velocity[0] = this.velocity[0] * 0.9
    // this.velocity[1] = this.velocity[1] * 0.9

    // limit velocity
    const velocity = Math.sqrt(
      this.velocity[0]**2 + this.velocity[1]**2 + this.velocity[2]**2
    )

    if(velocity > this.maxVelocity){
      this.velocity[0] = this.velocity[0] / velocity * this.maxVelocity
      this.velocity[1] = this.velocity[1] / velocity * this.maxVelocity
      this.velocity[2] = this.velocity[2] / velocity * this.maxVelocity
    }

    if(velocity < this.minVelocity){
      this.velocity[0] = this.velocity[0] / velocity * this.minVelocity
      this.velocity[1] = this.velocity[1] / velocity * this.minVelocity
      this.velocity[2] = this.velocity[2] / velocity * this.minVelocity
    }

    //
    this.position[0] += this.velocity[0]
    this.position[1] += this.velocity[1]
    this.position[2] += this.velocity[2]

  }

  draw( boidBox: BoidBox ){

    if(!this.position[0] && !this.position[1]) return;

    this.context.beginPath();

    let radius = this.minRadius + (
      this.position[2] + boidBox.front
    ) / (
      boidBox.front*2
    ) * (this.maxRadius - this.minRadius)

    radius = Math.min(Math.max(this.minRadius, radius), this.maxRadius)*2
    
    this.context.rect(
      this.position[0],
      this.position[1],
      radius,
      radius
    )
    
    // this.context.arc(
    //   this.position[0], 
    //   this.position[1], 
    //   radius, 
    //   0, 
    //   2 * Math.PI
    // );
      
    this.context.fillStyle = "orange";
    this.context.fill()

  }

}