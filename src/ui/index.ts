import { infoButton } from "./info-button";
import { registerEvents } from './events'
import { Thing } from "@/thing";

export function ui(
  thing: Thing, 
  canvas: HTMLCanvasElement
){

  registerEvents(thing, canvas)
  infoButton()

}