

const INIT_SLINGSHOT = -99

const colors = [
  '#55efc4',
  '#81ecec',
  '#74b9ff',
  '#ff7675',
  '#ffeaa7',
  '#fd79a8',
  '#e17055',
  '#fdcb6e',
  '#00cec9',
]

export default class Ball {

  x: number = 0;
  y: number = 0;

  slingShotX: number = INIT_SLINGSHOT;
  slingShotY: number = INIT_SLINGSHOT;

  xAccel: number = 0;
  yAccel: number = 0;
  
  gravity: number = 0.42;
  elasticity: number = 0.98;
  radius: number = 21;
  friction: number = 0.995

  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  stopped: boolean = false
  anim: number = 0;

  top: number = 0;
  right: number = 0;
  bottom: number = 0;
  left: number = 0;
  color: string = colors.at(
    Math.round((colors.length-1)*Math.random())
  ) as string

  afterStop: null|(() => void) = null;
  boundingBox: {width:number, height: number};
  delta:{ x:number, y: number } = { 
    x: Number.MAX_VALUE, 
    y: Number.MAX_VALUE 
  };
  
  minDelta = 0.01

  onMove: (x:number, y:number) => void = () => {}


  constructor(
    canvas: HTMLCanvasElement, 
    boundingBox: {width:number, height: number}
  ){

    this.x = this.radius
    this.y = window.innerHeight/2
    this.canvas = canvas
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D

    // init accelleration
    this.xAccel = 50 + (Math.random() * 50) * (Math.random()>0.5 ? -1 : 1)
    this.yAccel = 10 + (Math.random() * 50) * (Math.random()>0.5 ? -1 : 1)
    
    this.boundingBox = boundingBox // screen

    // define bounding box for ball
    this.top = this.radius
    this.left = this.radius
    this.right = boundingBox.width - this.radius
    this.bottom = boundingBox.height - this.radius

    this.canvas.width = boundingBox.width
    this.canvas.height = boundingBox.height

    // some browser may need some time to resize
    setTimeout(() => {
      this.init()
    },100)

  }
  

  // when resize happens
  changeBoundingBox(boundingBox: {width:number, height: number}){
    this.boundingBox = boundingBox
    this.right = boundingBox.width - this.radius
    this.bottom = boundingBox.height - this.radius
    this.canvas.width = boundingBox.width
    this.canvas.height = boundingBox.height
    if(this.stopped) {
      this.stopped = false
      this.start()
    }
  }

  // set flag to stop animating
  setStop(){
    console.log('stopped')
    this.stopped = true
  }

  setColor(){
    this.color = colors.at(
      Math.round(
        (colors.length-1)*Math.random()
      )
    ) as string
  }

  init(){
    this.stopped = false
    this.setColor()

    this.start()
  }

  start(){

    if(this.stopped) {

      if(this.anim) cancelAnimationFrame(this.anim)

      // normalize delts
      this.delta = { 
        x: Number.MAX_VALUE, 
        y: Number.MAX_VALUE 
      };

      //
      if(this.afterStop) { 
        this.afterStop()
      }

      return;
    }

    this.calculate()
    this.draw()

    this.anim = requestAnimationFrame(() => {
      
      // when the ball stands still 
      // on the ground
      // we stop
      if( 
        
        // delta is essentially zero
        this.delta.x < this.minDelta && 
        this.delta.y < this.minDelta &&
        
        // on the ground
        Math.abs(this.y - this.bottom) < this.minDelta 

      ) {
        this.setStop() 
      }

      this.start()
    })

  }

  calculate(){

    // console.log('calculating', {
    //   x: this.x,
    //   y: this.y
    // })

    const last = {
      x: this.x,
      y: this.y
    }

    // when bouncing, elasticity should be counted
    // also, friction goes here
    const yAccel = ((
      (
        this.y >= this.bottom || 
        this.y <= this.top ? -this.elasticity : 1 
      ) * this.yAccel 
    ) + this.gravity ) * this.friction 
    
    const xAccel = (
      (
        this.x >= this.right || 
        this.x <= this.left ? -this.elasticity : 1
      ) * this.xAccel 
    ) * this.friction

    // set x and y
    this.y += yAccel
    this.x += xAccel
    
    // set for next itteration
    this.xAccel = xAccel
    this.yAccel = yAccel
    
    // limit for x and y
    this.y = Math.max(
      this.top, 
      Math.min(
        this.y, this.bottom
      )
    )

    this.x = Math.max(
      this.left, 
      Math.min(
        this.x, this.right
      )
    )
    
    // record delta
    this.delta = {
      x: Math.abs(this.x - last.x),
      y: Math.abs(this.y - last.y)
    }

    // move event
    this.onMove(this.x, this.y)

  }

  draw(){

    const ctx = this.context
    ctx.clearRect(
      0, 0, this.boundingBox.width, this.boundingBox.height
    )
    
    ctx.beginPath();
    ctx.arc(
      this.x, this.y,
      this.radius, 0, 2 * Math.PI
    );
    ctx.fillStyle = this.color;
    ctx.fill();

  }


  // sling shot functions
  //
  slingShotInit(x: number, y:number){
    if(!this.stopped){
      
      this.afterStop = () => {
        this.afterStop = null
        this.slingShotInit(x, y)
      }

      this.setStop()
      

    }else{
      this.xAccel = 0
      this.yAccel = 0
      this.x = x
      this.y = y
      this.slingShotX = x
      this.slingShotY = y
      this.setColor()
      this.drawSlingShot()
    }
  }

  slingShotPull(x: number, y:number){

    if(
      this.slingShotX === INIT_SLINGSHOT &&
      this.slingShotY === INIT_SLINGSHOT
    ) return;

    this.x = x
    this.y = y
    this.drawSlingShot()
  }

  slingShotRelease(x?: number, y?:number){

    if(
      this.slingShotX === INIT_SLINGSHOT &&
      this.slingShotY === INIT_SLINGSHOT
    ) return;

    this.x = typeof x === 'number'  ? x : this.x
    this.y = typeof y === 'number'  ? y : this.y

    const scale =  0.3 //
    this.xAccel = (this.x - this.slingShotX) * -1 * scale
    this.yAccel = (this.y - this.slingShotY) * -1 * scale

    // normalize slingShot positions
    this.slingShotX = INIT_SLINGSHOT
    this.slingShotY = INIT_SLINGSHOT
    this.stopped = false
    
    this.start()
  }

  drawSlingShot(){
    const ctx = this.context
    ctx.clearRect(
      0, 0, this.boundingBox.width, this.boundingBox.height
    )
    
    // draw initial circle
    ctx.beginPath();
    ctx.strokeStyle = 'grey'
    ctx.arc(
      this.slingShotX === INIT_SLINGSHOT ? this.x : this.slingShotX, 
      this.slingShotY === INIT_SLINGSHOT ? this.y : this.slingShotY, 
      this.radius, 0, 2 * Math.PI
    );
    ctx.stroke();
    
    // draw path
    ctx.beginPath();
    ctx.strokeStyle = 'grey';
    ctx.moveTo(
      this.slingShotX === INIT_SLINGSHOT ? this.x : this.slingShotX, 
      this.slingShotY === INIT_SLINGSHOT ? this.y : this.slingShotY, 
    );
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // draw ball
    ctx.beginPath();
    ctx.fillStyle = this.color
    ctx.arc(
      this.x, this.y,
      this.radius, 0, 2 * Math.PI
    );
    ctx.fill();
  }

}