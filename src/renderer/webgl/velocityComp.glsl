// uniform float iWidth;
// uniform float iHeight;
// uniform float iDepth;
// uniform float iGridCol;
// uniform float iGridRow;
// uniform float iGridDepth;

uniform float fMaxVelocity;
uniform float fMinVelocity;
uniform float fTurnFactor;
uniform float fAvoidFactor;
uniform float fProtectedRange;
uniform float fMatchingfactor;
uniform float fCenteringFactor;
uniform float fPredatorturnfactor;
uniform float fVisibleRange;

uniform int iMaxPartner;
uniform int iBoidLen;
uniform int iComputationSize;

uniform bool bPredatorExists;
uniform float fPredatorX;
uniform float fPredatorY;
uniform float fPredatorZ;
uniform float fPredatorRange;

uniform float fBoidBoxLeft;
uniform float fBoidBoxRight;
uniform float fBoidBoxBottom;
uniform float fBoidBoxTop;
uniform float fBoidBoxFront;
uniform float fBoidBoxBack;

// highp float rand(vec2 co){
//   highp float a = 12.9898;
//   highp float b = 78.233;
//   highp float c = 43758.5453;
//   highp float dt= dot(co.xy ,vec2(a,b));
//   highp float sn= mod(dt,3.14);
//   return fract(sin(sn) * c);
// }


void main(){

  vec2 index = gl_FragCoord.xy / resolution.xy;

  vec4 position = texture(uPositionTexture, index);
  vec4 velocity = texture(uVelocityTexture, index);

  vec3 fAcceleration = vec3(0.0, 0.0, 0.0);
  int iGridNum = int(position.w);

  //
  float fCloseDx = 0.0;
  float fCloseDy = 0.0;
  float fCloseDz = 0.0;

  float fXVelAvg = 0.0;
  float fYVelAvg = 0.0;
  float fZVelAvg = 0.0;

  float fXPosAvg = 0.0;
  float fYPosAvg = 0.0;
  float fZPosAvg = 0.0;

  float iNeighboringBoids = 0.0;
  //

  int j = iBoidLen;
  int r = 0;
  int l = 0;
  int iPartners = 0;
  while(j > 0){
    j -= 1;
    vec2 jIndex = vec2( r, l ) / resolution.xy;
    vec4 jPosition = texture(uPositionTexture, jIndex);
    vec4 jVelocity = texture(uVelocityTexture, jIndex);

    r += 1;
    if(r == iComputationSize){
      r = 0;
      l += 1;
    }

    if(jIndex == index) continue;

    int jGridNum = int(jPosition.w);
    if(jGridNum != iGridNum) continue;

    if(iPartners >= iMaxPartner) continue;

    float fDistance = sqrt(
      pow(jPosition.x - position.x, 2.0) +
      pow(jPosition.y - position.y, 2.0) +
      pow(jPosition.z - position.z, 2.0) 
    );

    if(fDistance >= fVisibleRange) continue;

    iPartners += 1;

    // Separation
    if(fDistance < fProtectedRange){
      fCloseDx += position.x - jPosition.x;
      fCloseDy += position.y - jPosition.y;
      fCloseDz += position.z - jPosition.z;
    }

    else if(fDistance < fVisibleRange){

      // Alignment
      fXVelAvg += jVelocity.x;
      fYVelAvg += jVelocity.y;
      fZVelAvg += jVelocity.z;

      // Cohesion
      fXPosAvg += jPosition.x;
      fYPosAvg += jPosition.y;
      fZPosAvg += jPosition.z;

      iNeighboringBoids += 1.0;

    }


  }


  // Separation
  fAcceleration.x += fCloseDx * fAvoidFactor;
  fAcceleration.y += fCloseDy * fAvoidFactor;
  fAcceleration.z += fCloseDz * fAvoidFactor;

  if(iNeighboringBoids > 0.0){

    // Alignment
    fXVelAvg /= iNeighboringBoids;
    fYVelAvg /= iNeighboringBoids;
    fZVelAvg /= iNeighboringBoids;
    fAcceleration.x += (fXVelAvg - velocity.x) * fMatchingfactor;
    fAcceleration.y += (fYVelAvg - velocity.y) * fMatchingfactor;
    fAcceleration.z += (fZVelAvg - velocity.z) * fMatchingfactor;

    // Cohesion
    fXPosAvg /= iNeighboringBoids;
    fYPosAvg /= iNeighboringBoids;
    fZPosAvg /= iNeighboringBoids;
    fAcceleration.x += (fXPosAvg - position.x) * fCenteringFactor;
    fAcceleration.y += (fYPosAvg - position.y) * fCenteringFactor;
    fAcceleration.z += (fZPosAvg - position.z) * fCenteringFactor;

  }

  if(bPredatorExists){

    float predatorDx = position.x - fPredatorX;
    float predatorDy = position.y - fPredatorY;
    float predatorDz = position.z - fPredatorZ;

    float predatorDistance = sqrt(
      pow(predatorDx,2.0) + 
      pow(predatorDy,2.0) + 
      pow(predatorDz,2.0)
    );

    if(predatorDistance < fPredatorRange){
      
      float fTurnX = 1.0; 
      float fTurnY = 1.0; 
      float fTurnZ = 1.0; 

      if(predatorDx < 0.0){ fTurnX = -1.0; }
      if(predatorDy < 0.0){ fTurnY = -1.0; }
      if(predatorDz < 0.0){ fTurnZ = -1.0; }

      fAcceleration.x += fPredatorturnfactor * fTurnX;
      fAcceleration.y += fPredatorturnfactor * fTurnY;
      fAcceleration.z += fPredatorturnfactor * fTurnZ;

    }

  }
  
  // calculate position
  velocity.x += fAcceleration.x;
  velocity.y += fAcceleration.y;
  velocity.z += fAcceleration.z;

  // turn factor
  // https://vanhunteradams.com/Pico/Animal_Movement/Boids-algorithm.html#Screen-edges

  bool bIsTurning = false;
  if(position.x > fBoidBoxRight){
    velocity.x -= fTurnFactor;
    bIsTurning = true;
  }

  if(position.x < fBoidBoxLeft){
    velocity.x += fTurnFactor;
    bIsTurning = true;
  }

  if(position.y > fBoidBoxBottom){
    velocity.y -= fTurnFactor;
    bIsTurning = true;
  }

  if(position.y < fBoidBoxTop){
    velocity.y += fTurnFactor;
    bIsTurning = true;
  }

  if(position.z > fBoidBoxFront){
    velocity.z -= fTurnFactor;
    bIsTurning = true;
  }

  if(position.z < fBoidBoxBack){
    velocity.z += fTurnFactor;
    bIsTurning = true;
  }

  // limit velocity
  float fVelocitySqrt = sqrt(
    pow( velocity.x, 2.0 ) + 
    pow( velocity.y, 2.0 ) + 
    pow( velocity.z, 2.0 )
  );

  if(fVelocitySqrt > fMaxVelocity){
    velocity.x = velocity.x / fVelocitySqrt * fMaxVelocity;
    velocity.y = velocity.y / fVelocitySqrt * fMaxVelocity;
    velocity.z = velocity.z / fVelocitySqrt * fMaxVelocity;
  }

  // limit min vel, only do this when not turning
  if(fVelocitySqrt < fMinVelocity && !bIsTurning){
    velocity.x = velocity.x / fVelocitySqrt * fMinVelocity;
    velocity.y = velocity.y / fVelocitySqrt * fMinVelocity;
    velocity.z = velocity.z / fVelocitySqrt * fMinVelocity;
  }
  
  gl_FragColor = velocity;

}
