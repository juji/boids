// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'
import './styles/num-boids.css'
import './styles/fps-counter.css'
import './styles/method-select.css'

import { ui } from './ui'
import { Renderer } from './renderer'
import taichi from './renderer/webgpu-taichi/calculator?worker'
import threads from './renderer/threads/calculator?worker'
import {calculator as gpujs} from './renderer/webgl-gpujs/calculator'

import type { CalculatorPar } from './renderer/items/calculator-par' 

function detectWebGLContext () {
  // Create canvas element. The canvas is not added to the
  // document itself, so it is never displayed in the
  // browser window.
  var canvas = document.createElement("canvas");
  // Get WebGLRenderingContext from canvas element.
  var gl = canvas.getContext("webgl")
    || canvas.getContext("experimental-webgl");
  // Report the result.
  return !!(gl && gl instanceof WebGLRenderingContext)
}

(async function(){

  const canvas = document.querySelector('canvas') as HTMLCanvasElement
  if(!canvas) return;
  
  // check for webgpu support
  // @ts-ignore
  const webgpu = !!(navigator.gpu && await navigator.gpu.requestAdapter())

  // check for webgl
  const webgl = detectWebGLContext()
  
  // check params
  const urlParams = new URLSearchParams(window.location.search);
  const num = urlParams.get('num') ? Number(urlParams.get('num')) : 3000;
  const method = urlParams.get('method') || 'cpu'
  
  let Calculator: (new () => Worker) | ((c:CalculatorPar) => () => void) = threads;
  let calcPerThread = 1000

  if(method === 'webgl' && webgl){
    
    Calculator = gpujs;
    calcPerThread = 0 // basically use one thread

  }else if(method === 'webgl' && !webgl){

    location.href = `/?method=cpu&num=${num}`
    return;

  }else if(method === 'webgpu' && webgpu){
    
    Calculator = taichi
    calcPerThread = 99999999 // basically use one thread

  }else if(method === 'webgpu' && webgpu){

    location.href = `/?method=webgl&num=${num}`
    return;

  }

  
  
  // start the ui handler
  ui(method, num, webgpu, webgl)

  // 
  const renderer = new Renderer({
    canvas,
    boidNum: num,
    calcPerThread,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    Calculator,
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

  

