

export default class TouchEvents {

  clear: null | (() => void) = null

  constructor(
    canvas: HTMLCanvasElement, 
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
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      distance = calcDistance(e);
      canvas.addEventListener('touchmove', onPinchMove)
    }

    function onPinchMove(e: TouchEvent){
      if(e.touches.length < 2) return;
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      const deltaDistance = calcDistance(e);
      onScale && onScale(deltaDistance / distance)
    }

    function pointerUpListener(e: TouchEvent){
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      
      if(onScale && distance) {
        canvas.removeEventListener('touchmove', onPinchMove);
        distance = 0;
      }

      else if(!distance){
        onPointerUp && onPointerUp(e)
        if(onPointerMove) canvas.removeEventListener('touchmove', pointerMoveListener)
      }
    
      return false
    }

    canvas.addEventListener('touchstart', pointerDownListener)
    canvas.addEventListener('touchend', pointerUpListener)
    canvas.addEventListener('touchcancel', pointerUpListener)
    canvas.addEventListener('touchstart', onPinchStart)

    this.clear = () => {
      canvas.removeEventListener('touchstart', pointerDownListener)
      canvas.removeEventListener('touchend', pointerUpListener)
      canvas.removeEventListener('touchcancel', pointerUpListener)
      canvas.removeEventListener('touchmove', pointerMoveListener)
      canvas.removeEventListener('touchstart', onPinchStart)
    }

  }

}