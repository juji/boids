
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
} from '../items/constants'

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/Addons.js'

import positionComp from './positionComp.glsl'
import velocityComp from './velocityComp.glsl'

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
  velocityTextureName: string
}

export function calculator({
  boidArr,
  arrLen,
  boidBox,
  predator,
  boids,
  positionTextureName,
  velocityTextureName
}: CalculatorParams){

  const visibleRange = 40 + Math.random() * 40
  const maxPartner = 20 // max is calcPerThread

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

  
  const velTexture = computation.createTexture()
  const velVar = computation.addVariable(velocityTextureName, velocityComp, velTexture)

  velVar.material.uniforms.fMaxVelocity = { value: maxVelocity * 1.0}
  velVar.material.uniforms.fMinVelocity = { value: minVelocity * 1.0 }
  velVar.material.uniforms.fTurnFactor = { value: turnFactor * 1.0 }
  velVar.material.uniforms.fAvoidFactor = { value: avoidFactor * 1.0 }
  velVar.material.uniforms.fProtectedRange = { value: protectedRange * 1.0 }
  velVar.material.uniforms.fMatchingfactor = { value: matchingfactor * 1.0 }
  velVar.material.uniforms.fCenteringFactor = { value: centeringFactor * 1.0 }
  velVar.material.uniforms.fPredatorturnfactor = { value: predatorturnfactor * 1.0 }
  velVar.material.uniforms.fVisibleRange = { value: visibleRange * 1.0 }
  velVar.material.uniforms.iMaxPartner = { value: maxPartner }
  velVar.material.uniforms.iBoidLen = { value: boidLen }
  velVar.material.uniforms.iComputationSize = { value: computationSize }

  velVar.material.uniforms.bPredatorExists = { value: predator.exists }
  velVar.material.uniforms.fPredatorX = { value: predator.x * 1.0 }
  velVar.material.uniforms.fPredatorY = { value: predator.y * 1.0 }
  velVar.material.uniforms.fPredatorZ = { value: predator.z * 1.0 }
  velVar.material.uniforms.fPredatorRange = { value: predator.range * 1.0 }

  velVar.material.uniforms.fBoidBoxLeft = { value: boidBox.left * 1.0 }
  velVar.material.uniforms.fBoidBoxRight = { value: boidBox.right * 1.0 }
  velVar.material.uniforms.fBoidBoxBottom = { value: boidBox.bottom * 1.0 }
  velVar.material.uniforms.fBoidBoxTop = { value: boidBox.top * 1.0 }
  velVar.material.uniforms.fBoidBoxFront = { value: boidBox.front * 1.0 }
  velVar.material.uniforms.fBoidBoxBack = { value: boidBox.back * 1.0 }


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
    velTexture.image.data[ i4 + 3 ] = 0

  }

  computation.init()

  return () => {


    // GPGPU Update
    computation.compute()

    ;(boids.boidPoints.material as THREE.ShaderMaterial).uniforms.uPositionTexture.value = 
    computation.getCurrentRenderTarget(posVar).texture;

  }
  
  
}