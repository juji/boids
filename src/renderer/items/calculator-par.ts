import BoidBox from "./boidBox"
import Boids from "./boids"
import Predator from "./predator"

export type CalculatorPar = {
  sharedArray: Float32Array
  sal: number
  boidBox: BoidBox
  predator: Predator
  boids: Boids
}