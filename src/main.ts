// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'
import './styles/num-boids.css'
import './styles/fps-counter.css'
import './styles/method-select.css'

import { ui } from './ui'
import { Renderer } from './renderer'

(async function(){

  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  if(!canvas) return;
  
  // check for webgpu support
  // @ts-ignore
  const webgpu = !!(navigator.gpu && await navigator.gpu.requestAdapter())
  
  // check params
  const urlParams = new URLSearchParams(window.location.search);
  const num = urlParams.get('num') ? Number(urlParams.get('num')) : 3000;
  const method = urlParams.get('method') || (webgpu ? 'webgpu' : 'cpu')
  
  let script = './threads/calculator';
  let calcPerThread = 1000
  
  if(method === 'webgpu') {
    script = './webgpu-taichi/calculator'
    calcPerThread = 99999999 // basically use one thread
  }
  
  // start the ui handler
  ui(method, num)
  
  // const Renderer = await import(script).then(v => v.Renderer) 
  const renderer = new Renderer({
    canvas,
    boidNum: num,
    calcPerThread,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    calculator: script,
    reportFps: (fps: number) => {
      const fpsVisual = document.querySelector(`.fps-counter`) as HTMLElement
      if(fpsVisual) fpsVisual.innerText = fps + ' fps'
    }
  })
  
  window.addEventListener('resize', () => {
    renderer.changeScreenSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
  })

})()

  

