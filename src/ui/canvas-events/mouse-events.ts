

export default class MouseEvents {

  clear: null | (() => void) = null

  constructor(
    canvas: HTMLElement,
    events?:{
      onMouseMove?: (e:MouseEvent) => void
      onMouseLeave?: (e:MouseEvent) => void
    }
  ){

    const {
      onMouseMove,
      onMouseLeave,
    } = events || {}

    let mouseLeaveListener = (e:MouseEvent) => {
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      onMouseLeave && onMouseLeave(e)
      return false
    }

    let mouseMoveListener = (e:MouseEvent) => {
      if(e.currentTarget !== e.target) return;
      if(e.currentTarget !== canvas) return;
      e.preventDefault()
      onMouseMove && onMouseMove(e)
      return false
    }

    canvas.addEventListener('mouseleave', mouseLeaveListener)
    canvas.addEventListener('mousemove', mouseMoveListener)

    this.clear = () => {
      canvas.removeEventListener('mouseleave', mouseLeaveListener)
      canvas.removeEventListener('mousemove', mouseMoveListener)
    }

  }

}