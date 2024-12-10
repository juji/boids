
uniform float uSize;
uniform float uPointDenom;
uniform sampler2D uPositionTexture;
attribute vec2 aParticlesUv;

void main(){
  vec4 particle = texture(uPositionTexture, aParticlesUv);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(particle.xyz, 1.0);
  
  // https://github.com/mrdoob/three.js/blob/master/examples/webgl_custom_attributes_points.html
  // 
  gl_PointSize = uSize * ( uPointDenom / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
