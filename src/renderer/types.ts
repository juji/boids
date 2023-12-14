export type Predator = {
  size?: number
  exists?: boolean
  x: number
  y: number
}

export type BoidBox = {
  top: number
  left: number
  bottom: number,
  right: number
  front: number
  back: number  
}

export type BoidInit = {
  position: [number, number, number]
  // velocity: [number, number, number]
}