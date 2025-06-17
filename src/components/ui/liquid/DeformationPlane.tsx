
import { useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { DeformationImageProps, MousePosition } from "./types";
import { vertexShader, fragmentShader } from "./shaders";

export const DeformationPlane = ({ imageSrc, color }: DeformationImageProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const lastMousePosRef = useRef<MousePosition>({ x: 0, y: 0 });
  const lerpedMousePosRef = useRef<MousePosition>({ x: 0, y: 0 });
  const { viewport, gl } = useThree();

  const texture = imageSrc ? useTexture(imageSrc) : null;

  // Calculate dimensions for object-fit: cover behavior
  const planeAspect = viewport.width / viewport.height;
  const imageAspect = texture?.image
    ? texture.image.width / texture.image.height
    : 1;

  let planeWidth, planeHeight;

  if (imageAspect > planeAspect) {
    // Image is wider than viewport - fit height, crop width
    planeHeight = viewport.height;
    planeWidth = viewport.height * imageAspect;
  } else {
    // Image is taller than viewport - fit width, crop height
    planeWidth = viewport.width;
    planeHeight = viewport.width / imageAspect;
  }

  // Ensure minimum size to fill viewport
  if (planeWidth < viewport.width) {
    const scale = viewport.width / planeWidth;
    planeWidth *= scale;
    planeHeight *= scale;
  }
  if (planeHeight < viewport.height) {
    const scale = viewport.height / planeHeight;
    planeWidth *= scale;
    planeHeight *= scale;
  }

  // Make the image always bigger than parent by 20%
  const enlargeScale = 1.2;
  planeWidth *= enlargeScale;
  planeHeight *= enlargeScale;

  // Custom shader material for deformation effect
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uColor: { value: color ? new THREE.Color(color) : new THREE.Color(0x000000) },
        uUseColor: { value: !!color || !imageSrc },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uStrength: { value: 0.0 },
        uHoverProgress: { value: 0.0 },
        uSkewX: { value: 0.0 },
        uSkewY: { value: 0.0 },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });
  }, [texture, color, imageSrc]);

  useFrame((state) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;

      // Smooth hover transition
      const targetHoverProgress = isHovering ? 1.0 : 0.0;
      shaderMaterial.uniforms.uHoverProgress.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uHoverProgress.value,
        targetHoverProgress,
        0.02,
      );

      // Smooth interpolation of mouse position for delayed effect
      const targetMousePos = isHovering ? mousePos : lastMousePosRef.current;

      // Lerp the mouse position for smooth delayed tracking
      lerpedMousePosRef.current.x = THREE.MathUtils.lerp(
        lerpedMousePosRef.current.x,
        targetMousePos.x,
        0.08, // Adjust this value for more/less delay (lower = more delay)
      );
      lerpedMousePosRef.current.y = THREE.MathUtils.lerp(
        lerpedMousePosRef.current.y,
        targetMousePos.y,
        0.06,
      );

      // Use the lerped position for all calculations
      const currentMousePos = lerpedMousePosRef.current;

      // Update shader mouse position with lerped position
      shaderMaterial.uniforms.uMouse.value.set(
        currentMousePos.x,
        currentMousePos.y,
      );

      // Calculate skew for 3D perspective effect
      // Skew intensity based on mouse distance from center
      const skewIntensity = 0.4;
      const skewX = currentMousePos.x * skewIntensity;
      const skewY = currentMousePos.y * skewIntensity;

      // Apply skew with smooth interpolation
      shaderMaterial.uniforms.uSkewX.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uSkewX.value,
        skewX,
        0.05,
      );
      shaderMaterial.uniforms.uSkewY.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uSkewY.value,
        skewY,
        0.05,
      );

      // Find the opposite corner to current mouse position
      // Mouse position is in range -0.5 to 0.5
      const oppositeCorner = {
        x: currentMousePos.x > 0 ? -0.5 : 0.5, // If mouse is on right, opposite is left
        y: currentMousePos.y > 0 ? -0.5 : 0.5, // If mouse is on top, opposite is bottom
      };

      // Calculate distance from mouse to its opposite corner
      const distanceToOpposite = Math.sqrt(
        Math.pow(oppositeCorner.x - currentMousePos.x, 2) +
          Math.pow(oppositeCorner.y - currentMousePos.y, 2),
      );

      // Maximum possible distance is from corner to corner (diagonal)
      const maxDistance = Math.sqrt(2); // Distance from (-0.5,-0.5) to (0.5,0.5)

      // Normalize and apply highly non-linear transformation
      const normalizedDistance = distanceToOpposite / maxDistance;
      // Use exponential curve for more dramatic effect near opposite corner
      const exponentialStrength = Math.pow(normalizedDistance, 3.5) * 8.0;
      // Add additional curve for even more dramatic effect
      const additionalCurve = Math.pow(normalizedDistance, 2.0) * 1;
      const nonLinearStrength = exponentialStrength + additionalCurve;

      shaderMaterial.uniforms.uStrength.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uStrength.value,
        nonLinearStrength,
        0.01,
      );
    }
  });

  const handlePointerMove = (event: any) => {
    if (!meshRef.current) return;

    // Get mouse position relative to the plane (normalized from -0.5 to 0.5)
    const normalizedX = event.uv.x - 0.5;
    const normalizedY = event.uv.y - 0.5;

    const newMousePos = { x: normalizedX, y: normalizedY };
    setMousePos(newMousePos);
    lastMousePosRef.current = newMousePos;

    if (shaderMaterial) {
      shaderMaterial.uniforms.uMouse.value.set(normalizedX, normalizedY);
    }
  };

  const handlePointerEnter = () => {
    setIsHovering(true);
    gl.domElement.style.cursor = "pointer";
  };

  const handlePointerLeave = () => {
    setIsHovering(false);
    gl.domElement.style.cursor = "default";
    // Don't reset mouse position immediately - let it fade out smoothly
  };

  return (
    <mesh
      ref={meshRef}
      material={shaderMaterial}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <planeGeometry args={[planeWidth, planeHeight, 32, 32]} />
    </mesh>
  );
};
