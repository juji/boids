
import MouseEvents from './mouse-events'
import TouchEvents from './touch-events'
import { Renderer } from '@/renderer'

export function registerCanvasEvents( 
  renderer: Renderer,
  canvas: HTMLElement
){

  // console.log(renderer) // comment this when used

  if(window.matchMedia("(any-hover: none)").matches) {
    
    const touch = new TouchEvents(canvas,{
      onPointerDown(e:TouchEvent){
        renderer.setPredator(
          e.touches[0].pageX,
          e.touches[0].pageY
        )
      },
      onPointerMove(e:TouchEvent){
        renderer.setPredator(
          e.touches[0].pageX,
          e.touches[0].pageY
        )
      }
    })
    return () => touch.clear && touch.clear()

  }else{

    const mouse = new MouseEvents(canvas,{
      onMouseMove(e: MouseEvent){
        renderer.setPredator(
          e.pageX,
          e.pageY
        )
      }
    })
    return () => mouse.clear && mouse.clear()

  }


}