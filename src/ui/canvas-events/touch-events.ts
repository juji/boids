

export default class TouchEvents {

  clear: null | (() => void) = null

  constructor(
    canvas: HTMLElement, 
    events?: {
      onPointerUp?: (e:TouchEvent) => void
      onPointerDown?: (e:TouchEvent) => void
      onPointerMove?: (e:TouchEvent) => void
    }
  ){

    const {
      onPointerUp,
      onPointerDown,
      onPointerMove,
    } = events || {}

    function pointerMoveListener(e:TouchEvent){
      if(e.touches.length > 1) return;
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      onPointerMove && onPointerMove(e)
      return false
    }

    function pointerDownListener(e:TouchEvent){
      if(e.touches.length > 1) return;
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      onPointerDown && onPointerDown(e)
      if(onPointerMove) canvas.addEventListener('touchmove', pointerMoveListener)
      return false
    }

    function pointerUpListener(e: TouchEvent){
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()

      onPointerUp && onPointerUp(e)
      if(onPointerMove) canvas.removeEventListener('touchmove', pointerMoveListener)
    
      return false
    }

    canvas.addEventListener('touchstart', pointerDownListener)
    canvas.addEventListener('touchend', pointerUpListener)
    canvas.addEventListener('touchcancel', pointerUpListener)

    this.clear = () => {
      canvas.removeEventListener('touchstart', pointerDownListener)
      canvas.removeEventListener('touchend', pointerUpListener)
      canvas.removeEventListener('touchcancel', pointerUpListener)
      canvas.removeEventListener('touchmove', pointerMoveListener)
    }

  }

}