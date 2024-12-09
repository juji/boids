// import Predator from '../items/predator'
// import Boids from '../items/boids'
// import BoidBox from '../items/boidBox'
import Calculator from './calculator?worker'

// import boidVertexShader from './boidVertex.glsl'
// import boidFragmentShader from './boidFragment.glsl'
// import * as THREE from 'three';

export class Renderer {

  //
  reportFps: (fps: number) => void
  prevTime: number = performance.now()
  frames = 0

  calculator: Worker

  constructor(par: {
    canvas: HTMLCanvasElement,
    boidNum: number,
    screen: { width:number, height: number },
    reportFps: (fps: number) => void
  }){

    const {
      canvas,
      boidNum,
      screen,
      reportFps,
    } = par

    if(!boidNum) throw new Error('boidNum is falsy')

    const computationSize = Math.ceil(Math.sqrt(boidNum))
    const calcBoidNum = computationSize ** 2

    // canvas.width = screen.width
    // canvas.height = screen.height
    this.reportFps = reportFps

    this.calculator = new Calculator()

    canvas.addEventListener('pointerdown', e => this.sendEventToWorker(e));
    canvas.addEventListener('pointerup', e => this.sendEventToWorker(e));
    canvas.addEventListener('pointercancel', e => this.sendEventToWorker(e));
    canvas.addEventListener('pointermove', e => this.sendEventToWorker(e));
    canvas.addEventListener('contextmenu', e => this.sendEventToWorker(e));
    canvas.addEventListener('wheel', e => this.sendEventToWorker(e, true), { passive: true });
		document.addEventListener( 'keydown', e => this.sendEventToWorker(e, true), { passive: true, capture: true } );

    const offscreen = canvas.transferControlToOffscreen()
    this.calculator.postMessage({
      type: 'init',
      data: {
        canvas: offscreen,
        boidNum: calcBoidNum,
        screen,
        devicePixelRatio: window.devicePixelRatio
      }
    },[ offscreen ])

    // record fps
    this.prevTime = performance.now()
    this.calculator.onmessage = (e: MessageEvent) => {
      const { tick } = e.data
      if(tick){
        const time = performance.now();
        this.frames++;
        if (time > this.prevTime + 1000) {
          let fps = Math.round( ( this.frames * 1000 ) / ( time - this.prevTime ) );
          this.prevTime = time;
          this.frames = 0;
          this.reportFps(fps)
        }
      }
    }

  }

  sendEventToWorker(event: Event, isPassive?: boolean) {

    console.log(event)

    if(!isPassive) event.preventDefault()
    const message: { type: string, data: Record<string, unknown> } = { 
      type: 'event',
      data: {
        // ...event
        type: event.type
      }
    };

    // console.log('message', message)
  
    if (event instanceof PointerEvent) {
      // Pointer events (pointerdown, pointerup, pointermove, pointercancel)
      message.data.pointerId = event.pointerId;
      message.data.clientX = event.clientX;
      message.data.clientY = event.clientY;
      message.data.button = event.button;
      message.data.buttons = event.buttons;
      message.data.pointerType = event.pointerType;
    } else if (event instanceof WheelEvent) {
      // Wheel event
      message.data.deltaX = event.deltaX;
      message.data.deltaY = event.deltaY;
      message.data.deltaZ = event.deltaZ;
      message.data.clientX = event.clientX;
      message.data.clientY = event.clientY;
    } else if (event instanceof KeyboardEvent) {
      // Key events (keydown)
      message.data.key = event.key;
      message.data.code = event.code;
      message.data.altKey = event.altKey;
      message.data.ctrlKey = event.ctrlKey;
      message.data.shiftKey = event.shiftKey;
      message.data.metaKey = event.metaKey;
    } else if (event instanceof MouseEvent && event.type === 'contextmenu') {
      // Context menu event
      message.data.clientX = event.clientX;
      message.data.clientY = event.clientY;
      message.data.button = event.button;
    } else {
      console.warn('Unsupported event type:', event.type);
      return; // Skip unsupported events
    }
  
    // Send the serialized event to the worker
    this.calculator.postMessage(message);
  }

  // when resize happens
  changeScreenSize(screen: {width:number, height: number}){
    this.calculator.postMessage({
      type: 'screen',
      data: {
        screen,
        devicePixelRatio: window.devicePixelRatio 
      } 
    })
  }

}