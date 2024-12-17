// create something awesome!!

import './styles/index.css'
import './styles/button.css'
import './styles/info-button.css'
import './styles/num-boids.css'
import './styles/fps-counter.css'
import './styles/method-select.css'
import './styles/predator-stats.css'

import { ui } from './ui'


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
  

  let Renderer: any;
  // let Calculator: (new () => Worker) | ((c:CalculatorPar) => () => void) = threads;
  // let calcPerThread = 1000

  if(method === 'cpu'){

    Renderer = await import('./renderer/threads').then(v => v.Renderer)

  }

  else if( method === 'webgpu' && !webgpu){
    location.href = `/?method=webgl&num=${num}`
    return;  
  }

  else if( method === 'webgpu' && webgpu){
    Renderer = await import('./renderer/webgpu-taichi').then(v => v.Renderer)
  }

  else if( method === 'webgl' && !webgl){
    location.href = `/?method=cpu&num=${num}`
    return;  
  }

  else if( method === 'webgl' && webgl){
    Renderer = await import('./renderer/webgl').then(v => v.Renderer)
  }

  else if( method === 'webgl-worker' && !webgl){
    location.href = `/?method=cpu&num=${num}`
    return;  
  }

  else if( method === 'webgl-worker' && webgl){
    Renderer = await import('./renderer/webgl-worker').then(v => v.Renderer)
  }
  
  // start the ui handler
  ui(method, num, webgpu, webgl)

  // 
  const renderer = new Renderer({
    canvas,
    boidNum: num,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    reportFps: (fps: number) => {
      const fpsVisual = document.querySelector(`.fps-counter`) as HTMLElement
      if(fpsVisual) fpsVisual.innerText = fps + ' fps'
    },
    reportStats: ( par: {
      remaining: number
      eaten: number
    }) => {
      const remainingSpan = document.querySelector(`.predator-stats .remaining span`) as HTMLElement
      if(remainingSpan) remainingSpan.innerText = par.remaining + ''
      const eatenSpan = document.querySelector(`.predator-stats .eaten span`) as HTMLElement
      if(eatenSpan) eatenSpan.innerText = par.eaten + ''
    }
  })
  
  window.addEventListener('resize', () => {
    renderer.changeScreenSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
  })

})()

  

