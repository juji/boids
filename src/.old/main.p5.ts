// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'

import { Renderer } from '../renderer/.old/index.p5'
// import { ui } from './ui'

import P5 from 'p5'



(function(){
  
  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  const footer = document.querySelector('footer') as HTMLElement
  
  if(
    !canvas || 
    !footer
  ) return;

  const footerDim = footer.getBoundingClientRect()

  new P5((p5: P5) => {
    
    let renderer:Renderer = new Renderer(
      p5,
      { 
        width: window.innerWidth,
        height: window.innerHeight - footerDim.height
      }
    )

    // ui(renderer, canvas)
    
    p5.setup = () => {
      p5.createCanvas(
        window.innerWidth,
        window.innerHeight - footerDim.height,
        canvas  
      )
      p5.background('rgba(0,0,0, 0)')
    }

    p5.draw = () => {
      p5.clear(0,0,0,0)
      renderer.draw()
    }

    p5.windowResized = () => {
      p5.resizeCanvas(
        window.innerWidth,
        window.innerHeight - footerDim.height,
      );

      renderer.resize({ 
        width: window.innerWidth,
        height: window.innerHeight - footerDim.height
      })
    }

  })

})()

  

