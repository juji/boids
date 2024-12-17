

export default class Predator {
  size = 40
  exists = true
  range = 60
  x = 0
  y = 0
  z = 0

  constructor( obj? : {
    size: number,
    exists: boolean,
    x: number,
    y: number,
    z: number
  } ){

    if(obj){
      this.size = obj.size
      this.exists = obj.exists
      this.x = obj.x
      this.y = obj.y
      this.z = obj.z
    }

    this.range = (this.size || 0) * 3

  }

  toObject(){
    return {
      size: this.size,
      exists: this.exists,
      range: this.range,
      x: this.x,
      y: this.y,
      z: this.z,
    }
  }

}