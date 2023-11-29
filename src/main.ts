// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'

import { Renderer } from './renderer'
import { ui } from './ui'


(function(){
  
  const canvas = document.querySelector('canvas')
  if(!canvas) return;

  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()
  
  const thing = new Renderer(
    canvas,
    {
      width: window.innerWidth,
      height: window.innerHeight - footerDim.height
    }
  )
  
  // start the ui handler
  ui(thing, canvas)
  
  window.addEventListener('resize', () => {
    thing.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight - footerDim.height
    })
  })

})()

  

