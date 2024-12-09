
uniform float uSize;
uniform sampler2D uPositionTexture;
attribute vec2 aParticlesUv;

void main(){
  gl_PointSize = uSize;
  // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0);
  vec4 particle = texture(uPositionTexture, aParticlesUv);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(particle.xyz, 1.0);
}
