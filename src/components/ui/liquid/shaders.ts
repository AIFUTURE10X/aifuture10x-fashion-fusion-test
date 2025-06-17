
export const vertexShader = `
  varying vec2 vUv;
  uniform vec2 uMouse;
  uniform float uStrength;
  uniform float uHoverProgress;
  uniform float uSkewX;
  uniform float uSkewY;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Calculate distance from mouse position (inverted for bottom-left to top-right effect)
    vec2 mouseInverted = vec2(-uMouse.x, -uMouse.y);
    float dist = distance(uv, vec2(0.5) + mouseInverted * 0.5);

    // Create deformation - closer to mouse means more deformation
    float deformation = (1.0 - dist) * uStrength * uHoverProgress;

    // Apply deformation in opposite direction to mouse
    pos.x += mouseInverted.x * deformation * 0.3;
    pos.y += mouseInverted.y * deformation * 0.3;
    pos.z += deformation * 0.1;

    // Apply 3D depth transformation based on mouse position
    // Skew based on distance from center for more natural look
    vec2 centerOffset = uv - 0.5; // -0.5 to 0.5 range

    // Create 3D depth effect - parts of image push forward/backward
    // Mouse position determines the "tilt" direction
    float depthX = centerOffset.x * uSkewX * uHoverProgress;
    float depthY = centerOffset.y * uSkewY * uHoverProgress;

    // Combine depth effects on Z axis for true 3D feel
    pos.z += (depthX + depthY) * 0.5;

    // Add subtle perspective correction to X,Y for realistic 3D look
    pos.x += depthX * 0.1;
    pos.y += depthY * 0.1;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform bool uUseColor;
  varying vec2 vUv;

  void main() {
    if (uUseColor) {
      gl_FragColor = vec4(uColor, 1.0);
    } else {
      vec4 color = texture2D(uTexture, vUv);
      gl_FragColor = color;
    }
  }
`;
