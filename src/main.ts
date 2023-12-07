// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'

import { Renderer } from './renderer'
import { ui } from './ui'


(function(){
  
  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  
  if(!canvas) return;
  
  const renderer = new Renderer(
    canvas,
    {
      width: window.innerWidth,
      height: window.innerHeight
    }
  )
  
  // start the ui handler
  ui(renderer, canvas)
  
  window.addEventListener('resize', () => {
    renderer.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight
    })
  })

})()

  

