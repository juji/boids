

export type BoidBox = {
  top: number
  left: number
  bottom: number,
  right: number
  front: number
  back: number  
}

export type BoidInit = {
  position: [number, number, number]
  velocity: [number, number, number]
}

export default class Boid{

  position: [number, number, number] = [0,0,0]
  velocity: [number, number, number] = [0,0,0]
  accelleration: [number, number, number] = [0,0,0]

  minRadius = 0.7
  maxRadius = 1.4
  maxVelocity: number = 3
  minVelocity: number = 2

  turnFactor: number = 0.2

  constructor({
    position,
    velocity,
  }: BoidInit ){

    this.position = position
    this.velocity = velocity

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

  getPosition(){
    return this.position
  }

  setPosition(position: [number, number, number]){
    this.position = position
  }

}