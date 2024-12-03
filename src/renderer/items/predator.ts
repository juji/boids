

export default class Predator {
  size = 40
  exists = true
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

  }

  toObject(){
    return {
      size: this.size,
      exists: this.exists,
      x: this.x,
      y: this.y,
      z: this.z,
    }
  }

}