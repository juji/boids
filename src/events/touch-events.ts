

export default class TouchEvents {

  clear: null | (() => void) = null

  constructor(
    elm: HTMLElement, 
    events?: {
      onPointerUp?: (e:TouchEvent) => void
      onPointerDown?: (e:TouchEvent) => void
      onPointerMove?: (e:TouchEvent) => void
      onScale?: (scale: number) => void
    }
  ){

    const {
      onPointerUp,
      onPointerDown,
      onPointerMove,
      onScale,
    } = events || {}

    function pointerMoveListener(e:TouchEvent){
      if(e.touches.length > 1) return;
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      onPointerMove && onPointerMove(e)
      return false
    }

    function pointerDownListener(e:TouchEvent){
      if(e.touches.length > 1) return;
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      onPointerDown && onPointerDown(e)
      if(onPointerMove) elm.addEventListener('touchmove', pointerMoveListener)
      return false
    }

    function calcDistance(e: TouchEvent){
      return Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX, 
        e.touches[0].pageY - e.touches[1].pageY
      );
    }

    let distance = 0
    function onPinchStart(e: TouchEvent){
      if(e.touches.length < 2) return;
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      distance = calcDistance(e);
      elm.addEventListener('touchmove', onPinchMove)
    }

    function onPinchMove(e: TouchEvent){
      if(e.touches.length < 2) return;
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      const deltaDistance = calcDistance(e);
      onScale && onScale(deltaDistance / distance)
    }

    function pointerUpListener(e: TouchEvent){
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      
      if(onScale && distance) {
        elm.removeEventListener('touchmove', onPinchMove);
        distance = 0;
      }

      else if(!distance){
        onPointerUp && onPointerUp(e)
        if(onPointerMove) elm.removeEventListener('touchmove', pointerMoveListener)
      }
    
      return false
    }

    elm.addEventListener('touchstart', pointerDownListener)
    elm.addEventListener('touchend', pointerUpListener)
    elm.addEventListener('touchcancel', pointerUpListener)
    elm.addEventListener('touchstart', onPinchStart)

    this.clear = () => {
      elm.removeEventListener('touchstart', pointerDownListener)
      elm.removeEventListener('touchend', pointerUpListener)
      elm.removeEventListener('touchcancel', pointerUpListener)
      elm.removeEventListener('touchmove', pointerMoveListener)
      elm.removeEventListener('touchstart', onPinchStart)
    }

  }

}