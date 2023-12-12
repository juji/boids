// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'
// import './styles/num-boids.css'

import { Renderer } from './renderer'
import { ui } from './ui'


(function(){
  
  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  
  if(!canvas) return;
  const urlParams = new URLSearchParams(window.location.search);
  const num = urlParams.get('num') ? Number(urlParams.get('num')) : 1000;

  // const numLink = document.querySelector(`.num-boids-link>a[data-num="${num}"]`) as HTMLAnchorElement
  // if(numLink) numLink.classList.add('active')
  
  const renderer = new Renderer(
    canvas,
    num,
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

  

