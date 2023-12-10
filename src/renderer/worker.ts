import Boids from './boids'

let boids: Boids
let calculating = false

function calculate(){

  if(!boids) {
    throw new Error('Boids does not exists')
  }

  requestAnimationFrame(() => calculate())

  boids.calculate()
  boids.draw()
  // self.postMessage({ positions: boids.getPositions() })
  
}



self.onmessage = (e: MessageEvent) => {

  const { data } = e

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
