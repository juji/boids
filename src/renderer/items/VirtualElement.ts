import { EventDispatcher, Event } from 'three';

interface VirtualEvent extends Event {
  type: string;
  bubbles?: boolean;
  cancelable?: boolean;
  [key: string]: unknown;
}

export class VirtualElement extends EventDispatcher {
  private boundingRect: { left: number; top: number; width: number; height: number };
  
  style = {
    touchAction: 'asdf'
  }

  ownerDocument: VirtualElement
 
  getRootNode(){
    return {
      addEventListener(){}
    }
  }
  
  constructor() {
    super();
    this.boundingRect = { left: 0, top: 0, width: 0, height: 0 };
    this.ownerDocument = this
  }

  // Getter for bounding rectangle
  getBoundingClientRect() {
    return this.boundingRect;
  }

  // Setter for bounding rectangle
  setBoundingRect(left: number, top: number, width: number, height: number) {
    this.boundingRect = { left, top, width, height };
  }

  setPointerCapture(){}
  releasePointerCapture(){}
  setAttribute(){}

  removeEventListener(){}

  // Dispatch event with optional propagation
  dispatchVirtualEvent(event: VirtualEvent) {
    // Dispatch the event to the current element
    // @ts-ignore

    this.dispatchEvent({
      ...event,
      preventDefault(){}
    });

    // Check for propagation (if needed, based on bubbles or custom logic)
    // if (event.bubbles && typeof event.propagate === 'function') {
    //   event.propagate(event);
    // }
  }
}
