

export default class MouseEvents {

  clear: null | (() => void) = null

  constructor(
    elm: HTMLElement, 
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
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      onMouseMove && onMouseMove(e)
      return false
    }

    let mouseDownListener = (e:MouseEvent) => {
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      onMouseDown && onMouseDown(e)
      if(onMouseMove) elm.addEventListener('mousemove', mouseMoveListener)
      return false
    }

    let mouseUpListener = (e: MouseEvent) => {
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== elm) return;
      e.preventDefault()
      onMouseUp && onMouseUp(e)
      if(onMouseMove) elm.removeEventListener('mousemove', mouseMoveListener)
      return false
    }

    elm.addEventListener('mousedown', mouseDownListener)
    elm.addEventListener('mouseup', mouseUpListener)

    this.clear = () => {
      elm.removeEventListener('mousedown', mouseDownListener)
      elm.removeEventListener('mouseup', mouseUpListener)
      elm.removeEventListener('mousemove', mouseMoveListener)
    }

  }

}