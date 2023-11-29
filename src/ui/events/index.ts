
import MouseEvents from './mouse-events'
import TouchEvents from './touch-events'
import { Renderer } from '@/renderer'

export function registerEvents( 
  renderer: Renderer,
  elm: HTMLElement
){

  console.log(renderer) // comment this when used

  if(window.matchMedia("(any-hover: none)").matches) {
    
    const touch = new TouchEvents(elm)
    return () => touch.clear && touch.clear()

  }else{

    const mouse = new MouseEvents(elm)
    return () => mouse.clear && mouse.clear()

  }


}