
export type BoidBoxObject = {
  boxGap: number
  width: number
  depth: number
  height: number
  gridCol: number
  gridRow: number
  gridDepth: number
  top: number
  left: number
  bottom: number
  right: number
  front: number
  back: number
}

export default class BoidBox {
  
  // boundaries
  top = 0
  left = 0
  bottom = 0
  right = 0
  front = 0
  back = 0

  // the box
  boxGap = 200 // 
  width = 800
  depth = 500
  height = 500

  // grids
  // these affects fps
  gridCol = 40
  gridRow = 30
  gridDepth = 30

  constructor( par?: {
    boxGap: number
    width: number
    depth: number
    height: number
    gridCol: number
    gridRow: number
    gridDepth: number
  } ){

    if(par){
      this.boxGap  = par.boxGap
      this.width  = par.width
      this.depth  = par.depth
      this.height  = par.height
      this.gridCol  = par.gridCol
      this.gridRow  = par.gridRow
      this.gridDepth  = par.gridDepth
    }

    this.top = -this.height/2
    this.left = -this.width/2
    this.bottom = this.height/2
    this.right = this.width/2
    this.front = this.depth/2
    this.back = -this.depth/2

  }

  toObject(){
    return {
      boxGap: this.boxGap,
      width: this.width,
      depth: this.depth,
      height: this.height,
      gridCol: this.gridCol,
      gridRow: this.gridRow,
      gridDepth: this.gridDepth,
      top: this.top,
      left: this.left,
      bottom: this.bottom,
      right: this.right,
      front: this.front,
      back: this.back,
    }
  }

  getGridNum(x: number, y: number, z: number){
    return Math.floor((x + this.width * .5) / (this.width / this.gridCol)) +
      Math.floor((y + this.height * .5) / (this.height / this.gridRow)) +
      Math.floor((z + this.depth * .5) / (this.depth / this.gridDepth))
  }



}