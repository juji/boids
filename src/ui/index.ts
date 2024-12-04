import { infoButton } from "./info-button";
import { methodSelectButton } from "./method-select-button";
import { numBoidsSelectButton } from "./num-boids-select";

export function ui(method: string, num: number, webgpu: boolean, webgl: boolean){

  infoButton()
  methodSelectButton(method, num, webgpu, webgl)
  numBoidsSelectButton(method, num)

}