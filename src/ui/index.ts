import { infoButton } from "./info-button";
import { registerCanvasEvents } from './canvas-events'
import { Renderer } from "@/renderer";

export function ui(
  renderer: Renderer, 
  canvas: HTMLCanvasElement
){

  registerCanvasEvents(renderer, canvas)
  infoButton()

}