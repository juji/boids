import Boids from './boids'

let boids: Boids
let calculating = false

// let lastCalledTime: number
// let fps: number

function calculate(){

  // lastCalledTime = Date.now();

  if(!boids) {
    throw new Error('Boids does not exists')
  }

  requestAnimationFrame(() => calculate())

  boids.calculate()
  boids.draw()

  // console.clear()
  // fps = 1 / ( (Date.now() - lastCalledTime)/1000 );
  // console.log(fps)
}



self.onmessage = (e: MessageEvent) => {

  const { data } = e

  if(data.sab){
    console.log(data.sab)
  }

  if(data.boundingBox && boids){
    boids.setBoundingBox(data.boundingBox)
  }

  if(data.boids && data.canvas && data.boundingBox){
    boids = new Boids(
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


  if(!calculating && boids){
    calculating = true
    calculate()
  }

}
