
import { Canvas } from "@react-three/fiber";
import { DeformationImageProps } from "./types";
import { DeformationPlane } from "./DeformationPlane";

export const DeformationImage = ({ imageSrc, color }: DeformationImageProps) => {
  return (
    <div className="w-full h-full absolute">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={1} />
        <DeformationPlane imageSrc={imageSrc} color={color} />
      </Canvas>
    </div>
  );
};
