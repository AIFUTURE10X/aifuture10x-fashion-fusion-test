
"use client";

// Re-export everything from the refactored components
export { DeformationImage } from "./liquid/DeformationImage";
export { DeformationPlane } from "./liquid/DeformationPlane";
export type { DeformationImageProps, MousePosition } from "./liquid/types";

// Import DeformationImage to use as default export
import { DeformationImage } from "./liquid/DeformationImage";
export default DeformationImage;
