// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'

import Thing from './thing'
import { registerEvents } from './events'
import { ui } from './ui'

const canvas = document.querySelector('canvas')


if(canvas) {
  
  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()
  
  const thing = new Thing(canvas,{
    width: window.innerWidth,
    height: window.innerHeight - footerDim.height
  })
  

  // start the ui handler
  ui()

  // events for input
  registerEvents( thing, canvas )

  window.addEventListener('resize', () => {
    thing.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight - footerDim.height
    })
  })

}