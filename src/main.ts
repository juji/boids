// create something awesome!!

import './index.css'
import './button.css'
import './info-button.css'

import Thing from './thing'
import { registerEvents } from './events'
import { ui } from './ui'

const canvas = document.querySelector('canvas')


if(canvas) {
  
  ui()
  const footer = document.querySelector('footer') as HTMLElement
  const footerDim = footer.getBoundingClientRect()

  const thing = new Thing(canvas,{
    width: window.innerWidth,
    height: window.innerHeight - footerDim.height
  })

  // const clear = 
  registerEvents(
    thing,
    canvas
  )

  window.addEventListener('resize', () => {
    thing.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight - footerDim.height
    })
  })

}