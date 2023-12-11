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

  boids.calculate()
  boids.draw()

  // console.clear()
  // fps = 1 / ( (Date.now() - lastCalledTime)/1000 );
  // console.log(fps)
}



self.onmessage = (e: MessageEvent) => {

  const { data } = e

  if(data.boundingBox && boids){
    boids.setBoundingBox(data.boundingBox)
  }

  if(data.boids && data.canvas && data.boundingBox && data.sab && data.counter ){
    const sharedArray = new Float32Array(data.sab)
    boids = new Boids(
      sharedArray,
      new Int8Array(data.counter),
      data.boids,
      data.canvas,
      data.boundingBox
    )
  }


  if(data.predator){
    if(!boids) { throw new Error('Boids does not exists') }
    boids.setPredator( data.predator )
  }

  if(data.boidBox){
    if(!boids) { throw new Error('Boids does not exists') }
    boids.setBoidBox( data.boidBox )
  }


  if(!looping && boids){
    looping = true
    loop()
  }

}
