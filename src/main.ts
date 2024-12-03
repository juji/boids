// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'
import './styles/num-boids.css'
import './styles/fps-counter.css'

import { ui } from './ui'

(async function(){

  // start the ui handler
  ui()
  
  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  if(!canvas) return;
  const urlParams = new URLSearchParams(window.location.search);
  const num = urlParams.get('num') ? Number(urlParams.get('num')) : 3000;

  const numLink = document.querySelector(`.num-boids-link>a[data-num="${num}"]`) as HTMLAnchorElement
  if(numLink) numLink.classList.add('active')

  const fpsVisual = document.querySelector(`.fps-counter`) as HTMLElement

  // check for webgpu support
  // @ts-ignore
  const webgpu = navigator.gpu && await navigator.gpu.requestAdapter()
  console.log('webgpu', webgpu)

  const Renderer = await import('./renderer/threads').then(v => v.Renderer) 
  const renderer = new Renderer(
    canvas,
    num,
    {
      width: window.innerWidth,
      height: window.innerHeight
    },
    (fps: number) => {
      if(fpsVisual) fpsVisual.innerText = fps + ' fps'
    }
  )
  
  window.addEventListener('resize', () => {
    renderer.changeBoundingBox({
      width: window.innerWidth,
      height: window.innerHeight
    })
  })

})()

  

