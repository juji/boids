
import MouseEvents from './mouse-events'
import TouchEvents from './touch-events'
import { Thing } from '@/thing'

export function registerEvents( 
  thing: Thing,
  elm: HTMLElement
){

  console.log(thing) // comment this when used

  if(window.matchMedia("(any-hover: none)").matches) {
    
    const touch = new TouchEvents(elm)
    return () => touch.clear && touch.clear()

  }else{

    const mouse = new MouseEvents(elm)
    return () => mouse.clear && mouse.clear()

  }


}