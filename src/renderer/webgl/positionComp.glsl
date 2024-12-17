
uniform float iWidth;
uniform float iHeight;
uniform float iDepth;
uniform float iGridCol;
uniform float iGridRow;
uniform float iGridDepth;
uniform float fGraveYardY;

void main(){

  vec2 index = gl_FragCoord.xy / resolution.xy;

  vec4 position = texture(uPositionTexture, index);
  vec4 velocity = texture(uVelocityTexture, index);

  // position

  if(velocity.w == 0.0){
    
    if(position.y > fGraveYardY){
      position.y -= 5.0;
    }

  }else{

    position.x += velocity.x;
    position.y += velocity.y;
    position.z += velocity.z;

    // grid num
    position.w = floor((position.x + iWidth * .5) / (iWidth / iGridCol)) +
        floor((position.y + iHeight * .5) / (iHeight / iGridRow)) +
        floor((position.z + iDepth * .5) / (iDepth / iGridDepth));
        
  }

  
  gl_FragColor = position;

}
