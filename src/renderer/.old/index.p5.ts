import Boid from './boid.p5'
import type P5 from 'p5'

export class Renderer {

  p5: P5;
  boundingBox: {width:number, height: number}
  boidNum = 300
  boids: Boid[] = []

  constructor(
    p5: P5,
    boundingBox: {width:number, height: number}
  ){
    
    this.p5 = p5
    this.boundingBox = boundingBox // screen

    for(let i=0;i<this.boidNum;i++){
      this.boids.push(new Boid( this.p5, boundingBox ))
    }

  }
  

  // when resize happens
  resize(boundingBox: {width:number, height: number}){
    this.boundingBox = boundingBox
  }

  draw(){

    for(let i=0;i<this.boidNum;i++){
      this.boids[i].edges()
      this.boids[i].flock(this.boids)
      this.boids[i].calculate()
      this.boids[i].draw()
    }

  }

}