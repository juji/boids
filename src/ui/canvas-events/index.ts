
import MouseEvents from './mouse-events'
import TouchEvents from './touch-events'
import { Renderer } from '@/renderer'

export function registerCanvasEvents( 
  renderer: Renderer,
  canvas: HTMLCanvasElement
){

  // console.log(renderer) // comment this when used

  if(window.matchMedia("(any-hover: none)").matches) {
    
    let removePredator: boolean;
    const touch = new TouchEvents(canvas,{
      onPointerDown(e:TouchEvent){
        
        removePredator = false
        if(renderer.intersectPredator(
          e.touches[0].pageX,
          e.touches[0].pageY
        )) removePredator = true

        renderer.setPredator(
          e.touches[0].pageX,
          e.touches[0].pageY
        )
      },
      onPointerMove(e:TouchEvent){
        removePredator = false
        renderer.setPredator(
          e.touches[0].pageX,
          e.touches[0].pageY
        )
      },
      onPointerUp(){
        if(removePredator) renderer.removePredator()
        removePredator = false
      }
    })
    return () => touch.clear && touch.clear()

  }else{

    const mouse = new MouseEvents(canvas,{
      onMouseLeave(){
        renderer.removePredator()
      },
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