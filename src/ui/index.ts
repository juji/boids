import { infoButton } from "./info-button";
import { methodSelectButton } from "./method-select-button";
import { numBoidsSelectButton } from "./num-boids-select";

export function ui(method: string, num: number){

  infoButton()
  methodSelectButton(method,num)
  numBoidsSelectButton(method,num)

}