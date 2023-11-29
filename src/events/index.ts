
import MouseEvents from './mouse-events'
import TouchEvents from './touch-events'
import Thing from '../thing'

export function registerEvents( 
  thing: Thing,
  elm: HTMLElement 
){

  if(window.matchMedia("(any-hover: none)").matches) {
    
    const touch = new TouchEvents(elm, {
      onTouchDown: (e:TouchEvent) => {
        
      },
      onTouchMove: (e:TouchEvent) => {
        
      },
      onTouchUp: () => {
        
      },
    })

    return () => touch.clear && touch.clear()

  }else{

    const mouse = new MouseEvents(elm, {
      onMouseDown: (e:MouseEvent) => {
        
      },
      onMouseMove: (e:MouseEvent) => {
        
      },
      onMouseUp: (e:MouseEvent) => {
        
      },
    })

    return () => mouse.clear && mouse.clear()

  }


}