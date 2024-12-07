// iSal
// iBoidLen

// bPredatorExists
// fPredatorRange
// fPredatorX
// fPredatorY
// fPredatorZ

// fBoidBoxTop
// fBoidBoxLeft
// fBoidBoxBottom
// fBoidBoxRight
// fBoidBoxFront
// fBoidBoxBack

// fMaxVelocity
// fMinVelocity
// fTurnFactor
// fAvoidFactor
// fProtectedRange
// fMatchingfactor
// fCenteringFactor
// fPredatorturnfactor
// fVisibleRange
// fMaxPartner

void main(){

  vec2 index = gl_FragCoord.xy / resolution.xy;

  // this the current x,y,z
  // [-1.0, 1.0]
  vec4 particle = texture(uParticles, index);
  
  // go crazy with it
  // particle.y -= 0.01;

  // 1. check initial position
  // you have to convert from original to [-1.0, 1.0]
  // they should be in position
  gl_FragColor = particle;

}
