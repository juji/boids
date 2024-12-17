
// import { webGLBoid } from './boid.js'

import {
  maxVelocity,
  minVelocity,
  turnFactor,
  avoidFactor,
  protectedRange,
  matchingfactor,
  centeringFactor,
  predatorturnfactor,
  graveYardY,
} from '../items/constants'

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/Addons.js'

import positionComp from './positionComp.glsl?raw'
import velocityComp from './velocityComp.glsl?raw'

import BoidBox from '../items/boidBox.js';
import Predator from '../items/predator.js';
import Boids from '../items/boids.js';

type CalculatorParams = {
  boidArr: number[]
  arrLen: number
  boidBox: BoidBox
  predator: Predator
  boids: Boids,
  positionTextureName: string,
  velocityTextureName: string,
  reportStats: (obj: { remaining: number, eaten: number }) => void,
}

export function calculator({
  boidArr,
  arrLen,
  boidBox,
  predator,
  boids,
  positionTextureName,
  velocityTextureName,
  reportStats,
}: CalculatorParams){

  const visibleRange = 40 + Math.random() * 40
  const maxPartner = 30 // max is calcPerThread

  let boidLen = boidArr.length / arrLen

  const computationSize = Math.ceil(Math.sqrt(boidLen))
  boidLen = computationSize ** 2

  const computation = new GPUComputationRenderer(computationSize, computationSize, boids.renderer)
  
  const posTexture = computation.createTexture()
  const posVar = computation.addVariable(positionTextureName, positionComp, posTexture)
  
  posVar.material.uniforms.iWidth = { value: boidBox.width };
  posVar.material.uniforms.iHeight = { value: boidBox.height };
  posVar.material.uniforms.iDepth = { value: boidBox.depth };
  posVar.material.uniforms.iGridCol = { value: boidBox.gridCol };
  posVar.material.uniforms.iGridRow = { value: boidBox.gridRow };
  posVar.material.uniforms.iGridDepth = { value: boidBox.gridDepth };
  posVar.material.uniforms.fGraveYardY = { value: graveYardY }

  
  const velTexture = computation.createTexture()
  const velVar = computation.addVariable(velocityTextureName, velocityComp, velTexture)

  velVar.material.uniforms.fMaxVelocity = { value: maxVelocity}
  velVar.material.uniforms.fMinVelocity = { value: minVelocity }
  velVar.material.uniforms.fTurnFactor = { value: turnFactor }
  velVar.material.uniforms.fAvoidFactor = { value: avoidFactor }
  velVar.material.uniforms.fProtectedRange = { value: protectedRange }
  velVar.material.uniforms.fMatchingfactor = { value: matchingfactor }
  velVar.material.uniforms.fCenteringFactor = { value: centeringFactor }
  velVar.material.uniforms.fPredatorturnfactor = { value: predatorturnfactor }
  velVar.material.uniforms.fVisibleRange = { value: visibleRange }
  velVar.material.uniforms.iMaxPartner = { value: maxPartner }
  velVar.material.uniforms.iBoidLen = { value: boidLen }
  velVar.material.uniforms.iComputationSize = { value: computationSize }

  velVar.material.uniforms.bPredatorExists = { value: predator.exists }
  velVar.material.uniforms.fPredatorX = { value: predator.x }
  velVar.material.uniforms.fPredatorY = { value: predator.y }
  velVar.material.uniforms.fPredatorZ = { value: predator.z }
  velVar.material.uniforms.fPredatorRange = { value: predator.range }
  velVar.material.uniforms.fPredatorSize = { value: predator.size }

  velVar.material.uniforms.fBoidBoxLeft = { value: boidBox.left }
  velVar.material.uniforms.fBoidBoxRight = { value: boidBox.right }
  velVar.material.uniforms.fBoidBoxBottom = { value: boidBox.bottom }
  velVar.material.uniforms.fBoidBoxTop = { value: boidBox.top }
  velVar.material.uniforms.fBoidBoxFront = { value: boidBox.front }
  velVar.material.uniforms.fBoidBoxBack = { value: boidBox.back }

  computation.setVariableDependencies(posVar, [ posVar, velVar ])
  computation.setVariableDependencies(velVar, [ posVar, velVar ])

  for(let i = 0; i < boidLen; i++){

    const iArrLen = i * arrLen
    const i4 = i * 4

    // x, y ,z
    posTexture.image.data[ i4 + 0 ] = boidArr[ iArrLen + 0 ]
    posTexture.image.data[ i4 + 1 ] = boidArr[ iArrLen + 1 ]
    posTexture.image.data[ i4 + 2 ] = boidArr[ iArrLen + 2 ]

    // gridnum
    posTexture.image.data[ i4 + 3 ] = boidArr[ iArrLen + 6 ]

    // velocity
    velTexture.image.data[ i4 + 0 ] = boidArr[ iArrLen + 3 ]
    velTexture.image.data[ i4 + 1 ] = boidArr[ iArrLen + 4 ]
    velTexture.image.data[ i4 + 2 ] = boidArr[ iArrLen + 5 ]

    // is alive
    velTexture.image.data[ i4 + 3 ] = boidArr[ iArrLen + 7 ]

  }

  computation.init()

  const readVelocity = new Float32Array( boidArr.length / 2 );
  let drawReport = 0

  async function getReport(){

    drawReport++;
    if(drawReport < 60) return;
    drawReport = 0

    // get body count
    // @ts-ignore
    await boids.renderer.readRenderTargetPixelsAsync(
      computation.getCurrentRenderTarget(velVar), 
      0, 0, computationSize, computationSize, 
      readVelocity
    // @ts-ignore
    )

    let eaten = 0
    let len = readVelocity.length / 4
    while(len--){
      if(!readVelocity[ len * 4 + 3 ]){
        eaten += 1
      }
    }
    reportStats({ 
      remaining: (readVelocity.length / 4) - eaten, 
      eaten 
    })

  }

  return {
    compute: () => {


      // GPGPU Update
      computation.compute()

      ;(boids.boidPoints.material as THREE.ShaderMaterial).uniforms.uPositionTexture.value = 
      computation.getCurrentRenderTarget(posVar).texture;

      getReport()


    },
  }
  
  
}