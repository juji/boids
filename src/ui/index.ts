import { infoButton } from "./info-button";
import { registerEvents } from './events'
import { Renderer } from "@/renderer";

export function ui(
  renderer: Renderer, 
  canvas: HTMLCanvasElement
){

  registerEvents(renderer, canvas)
  infoButton()

}