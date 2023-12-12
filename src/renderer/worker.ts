import Boids from './boids'

let boids: Boids
let looping = false

// let lastCalledTime: number
// let fps: number

function loop(){

  // lastCalledTime = Date.now();

  if(!boids) {
    throw new Error('Boids does not exists')
  }

  requestAnimationFrame(() => loop())

  boids.setPositions()
  boids.draw()

  // console.clear()
  // fps = 1 / ( (Date.now() - lastCalledTime)/1000 );
  // console.log(fps)
}



self.onmessage = (e: MessageEvent) => {

  const { data } = e

  if(
    data.boids && data.canvas && 
    data.boundingBox && data.sab && 
    data.accelCounter && data.posCounter 
  ){

    boids = new Boids(
      new Float32Array(data.sab),
      new Int8Array(data.accelCounter),
      new Int8Array(data.posCounter),
      data.boids,
      data.canvas,
      data.boundingBox,
      (fps: number) => self.postMessage({ fps })
    )
  }

  if(data.boundingBox){
    if(!boids) { throw new Error('BOUNDINGBOX ERROR: Boids does not exists') }
    boids.setBoundingBox(data.boundingBox)
  }

  if(data.predator){
    if(!boids) { throw new Error('PREDATOR ERROR: Boids does not exists') }
    boids.setPredator( data.predator )
  }


  if(!looping && boids){
    looping = true
    loop()
  }

}
