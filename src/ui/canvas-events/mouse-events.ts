

export default class MouseEvents {

  clear: null | (() => void) = null

  constructor(
    canvas: HTMLCanvasElement,
    events?:{
      onMouseUp?: (e:MouseEvent) => void
      onMouseDown?: (e:MouseEvent) => void
      onMouseMove?: (e:MouseEvent) => void
    }
  ){

    const {
      onMouseUp,
      onMouseDown,
      onMouseMove,
    } = events || {}

    let mouseMoveListener = (e:MouseEvent) => {
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      onMouseMove && onMouseMove(e)
      return false
    }

    let mouseDownListener = (e:MouseEvent) => {
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      onMouseDown && onMouseDown(e)
      if(onMouseMove) canvas.addEventListener('mousemove', mouseMoveListener)
      return false
    }

    let mouseUpListener = (e: MouseEvent) => {
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      onMouseUp && onMouseUp(e)
      if(onMouseMove) canvas.removeEventListener('mousemove', mouseMoveListener)
      return false
    }

    canvas.addEventListener('mousedown', mouseDownListener)
    canvas.addEventListener('mouseup', mouseUpListener)

    this.clear = () => {
      canvas.removeEventListener('mousedown', mouseDownListener)
      canvas.removeEventListener('mouseup', mouseUpListener)
      canvas.removeEventListener('mousemove', mouseMoveListener)
    }

  }

}