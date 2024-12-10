
uniform float uSize;
uniform sampler2D uPositionTexture;
attribute vec2 aParticlesUv;

void main(){
  vec4 particle = texture(uPositionTexture, aParticlesUv);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(particle.xyz, 1.0);
  
  gl_PointSize = uSize * ( 300.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
