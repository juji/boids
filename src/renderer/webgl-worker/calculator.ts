import { BoidRenderer } from "./boid/renderer"
import { VirtualElement } from "../items/VirtualElement"


let renderer: BoidRenderer | null = null
let virtualElement: VirtualElement

self.onmessage = (e: MessageEvent) => {

  const { type, data } = e.data

  if(type === 'screen'){

    const {
      screen,
      devicePixelRatio
    } = data

    if(renderer) {
      renderer.onScreenChange(screen, devicePixelRatio)
    }

    if(virtualElement){
      virtualElement.setBoundingRect(0, 0, screen.width, screen.width)  
    }

  }
  
  if(type === 'init'){

    const {
      canvas,
      boidNum,
      screen,
      devicePixelRatio
    } = data

    canvas.width = screen.width
    canvas.height = screen.height

    virtualElement = new VirtualElement()
    virtualElement.setBoundingRect(0, 0, screen.width, screen.height)

    renderer = new BoidRenderer({
      canvas,
      virtualElement,
      devicePixelRatio,
      screen,
      boidNum,
      reportTick: () => { self.postMessage({ tick: true }) }
    })

    renderer.loop()

  }

  if(type === 'event'){
    // @ts-ignore
    virtualElement.dispatchVirtualEvent(data)
  }

}