

export default class Thing {

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  boundingBox: {width:number, height: number}
  stopped = false

  anim: number = 0

  constructor(
    canvas: HTMLCanvasElement, 
    boundingBox: {width:number, height: number}
  ){

    this.canvas = canvas
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D
    this.boundingBox = boundingBox // screen
    this.canvas.width = boundingBox.width
    this.canvas.height = boundingBox.height

    this.start()

  }
  

  // when resize happens
  changeBoundingBox(boundingBox: {width:number, height: number}){
    this.boundingBox = boundingBox
    this.canvas.width = boundingBox.width
    this.canvas.height = boundingBox.height
  }

  start(){

    this.calculate()
    
    this.anim = requestAnimationFrame(() => {
      this.draw()
      this.start()
    })

  }

  calculate(){

  }

  draw(){

    const ctx = this.context
    ctx.clearRect(
      0, 0, this.boundingBox.width, this.boundingBox.height
    )

  }

}