// https://www.youtube.com/watch?v=mhjuuHl6qHM&t=2220s

import P5 from 'p5'

export default class Boid {

  p5: P5;
  position: P5.Vector;
  velocity: P5.Vector;
  accelleration: P5.Vector;
  boundingBox: {width:number, height: number}
  maxSpeed = 4
  maxForce = 0.2
  perceptionRadius = 100
  width = 2

  constructor(
    p5: P5,
    bb: {width:number, height: number}
  ){

    this.boundingBox = bb
    this.p5 = p5
    this.position = p5.createVector(p5.random(bb.width), p5.random(bb.height))
    this.velocity = P5.Vector.random2D();
    this.velocity.setMag(p5.random(2,4))
    this.accelleration = p5.createVector()

  }

  edges(){

    // if(
    //   this.position.x >= this.boundingBox.width ||
    //   this.position.x <= 0
    // ){
    //   this.velocity.x *= -1
    //   this.accelleration.x *= -1
    // }

    // if(
    //   this.position.y >= this.boundingBox.height ||
    //   this.position.y <= 0
    // ){
    //   this.velocity.y *= -1
    //   this.accelleration.y *= -1
    // }

    if(this.position.x > this.boundingBox.width)
      this.position.x = 0
    if(this.position.x < 0)
      this.position.x = this.boundingBox.width

    if(this.position.y > this.boundingBox.height)
      this.position.y = 0
    if(this.position.y < 0)
      this.position.y = this.boundingBox.height
  }

  alignment(boids: Boid[]){

    const p5 = this.p5
    let avg = p5.createVector()
    let total = 0

    for(let boid of boids){

      if(
        boid === this || 
        p5.dist(
          this.position.x, this.position.y,
          boid.position.x, boid.position.y
        ) >= this.perceptionRadius
      ) continue;
      
      avg.add(boid.velocity)
      total++

    }
    
    if(total > 0) {
      avg.div(total)
      avg.setMag(this.maxSpeed)
      avg.sub(this.velocity)
      avg.limit(this.maxForce)
    }
    return avg
  }

  cohesion(boids: Boid[]){

    const p5 = this.p5
    let avg = p5.createVector()
    let total = 0

    for(let boid of boids){

      if(
        boid === this || 
        p5.dist(
          this.position.x, this.position.y,
          boid.position.x, boid.position.y
        ) >= this.perceptionRadius
      ) continue;
      
      avg.add(boid.position)
      total++

    }
    
    if(total > 0) {
      avg.div(total)
      avg.sub(this.position)
      avg.setMag(this.maxSpeed)
      avg.sub(this.velocity)
      avg.limit(this.maxForce)
    }
    return avg
  }

  separation(boids: Boid[]){

    const p5 = this.p5
    let avg = p5.createVector()
    let total = 0

    for(let boid of boids){

      const d = p5.dist(
        this.position.x, this.position.y,
        boid.position.x, boid.position.y
      )
      if(
        boid === this || 
        d >= this.perceptionRadius
      ) continue;
      
      let diff = P5.Vector.sub(this.position, boid.position)
      diff.div(d)
      avg.add(diff)
      total++

    }
    
    if(total > 0) {
      avg.div(total)
      // avg.sub(this.position)
      avg.setMag(this.maxSpeed)
      avg.sub(this.velocity)
      avg.limit(this.maxForce)
    }
    return avg
  }

  flock(boids: Boid[]){
    this.accelleration.mult(0)
    const alignment = this.alignment(boids)
    const cohesion = this.cohesion(boids)
    const separation = this.separation(boids)
    this.accelleration.add(separation)
    this.accelleration.add(alignment)
    this.accelleration.add(cohesion)
  }

  calculate(){
    this.position.add(this.velocity)
    this.velocity.add(this.accelleration)
  }

  draw(){
    this.p5.strokeWeight(this.width)
    this.p5.stroke(255)
    this.p5.point(
      this.position.x,
      this.position.y
    )
  }

}