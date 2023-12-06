

export default class Boid{

  x = 0
  y = 0
  z = 0

  minX = 0
  minY = 0
  minZ = 0
  maxX = 0
  maxY = 0
  maxZ = 0

  speedX = 1
  speedY = 1
  speedZ = 1

  deltaSpeedX = 0
  deltaSpeedY = 0
  deltaSpeedZ = 0

  // scale factor for Z
  scaleFactor = 5

  minDistance = 100
  centeringFactor = 100
  velocityFactor = 8

  constructor(
    x:number, 
    y:number, 
    z:number, 
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number
  ){
    this.x = x
    this.y = y
    this.z = z
    this.minX = minX
    this.minY = minY
    this.minZ = minZ
    this.maxX = maxX
    this.maxY = maxY
    this.maxZ = maxZ
  }

  averageVel(totalX: number, totalY:number, totalZ:number, totalBoids: number){
    this.speedX += (totalX - this.speedX) / (totalBoids-1) / this.velocityFactor
    this.speedY += (totalY - this.speedY) / (totalBoids-1) / this.velocityFactor
    this.speedZ += (totalZ - this.speedZ) / (totalBoids-1) / this.velocityFactor
  }

  center(totalX: number, totalY:number, totalZ:number, totalBoids: number){

    const centerX = (totalX - this.x) / totalBoids - 1
    const centerY = (totalY - this.y) / totalBoids - 1
    const centerZ = (totalZ - this.z) / totalBoids - 1

    this.speedX += (centerX - this.x) / this.centeringFactor
    this.speedY += (centerY - this.y) / this.centeringFactor
    this.speedZ += (centerZ - this.z) / this.centeringFactor

  }

  avoid(boid: Boid){

    const dist = Math.sqrt(
      ((this.x - boid.x)**2) +
      ((this.y - boid.y)**2) +
      ((this.z - boid.z)**2)
    )

    const distX = this.x - boid.x
    const distAbsX = Math.abs(distX)

    const distY = this.y - boid.y
    const distAbsY = Math.abs(distY)

    const distZ = this.z - boid.z
    const distAbsZ = Math.abs(distZ)
    
    if(dist < this.minDistance){
      if(distAbsX < this.minDistance)
        this.speedX += distX / distAbsX
  
      if(distAbsY < this.minDistance)
        this.speedY += distY / distAbsY
      
      if(distAbsZ < this.minDistance)
        this.speedZ += distZ / distAbsZ
    }
  }

  calculate(
    boids: Boid[], 
    idx:number, 
    totalPos: [number, number, number],
    totalVel: [number, number, number]
  ){

    this.speedX = 0
    this.speedY = 0
    this.speedZ = 0

    this.center(totalPos[0], totalPos[1], totalPos[2], boids.length)

    let i = 0
    while(i<boids.length){
      if(idx === i) {
        i++;
        continue;
      };
      this.avoid(boids[i])
      i++
    }

    this.averageVel(totalVel[0], totalVel[1], totalVel[2], boids.length)

    if(this.x > this.maxX) this.speedX -= 1
    if(this.x < this.minX) this.speedX += 1
    if(this.y > this.maxY) this.speedY -= 1
    if(this.y < this.minY) this.speedY += 1
    if(this.z > this.maxZ) this.speedZ -= 1
    if(this.z < this.minZ) this.speedZ += 1

    this.x += this.speedX
    this.y += this.speedY
    this.z += this.speedZ
  }

  draw(context: CanvasRenderingContext2D){

    context.beginPath()
    context.fillStyle = 'orange'
    context.fillRect(
      this.x, 
      this.y, 
      3, 
      3
      // this.scaleFactor * this.z/this.maxZ, 
      // this.scaleFactor * this.z/this.maxZ
    );

  }

}