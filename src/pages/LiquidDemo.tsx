
import { DeformationImage } from "@/components/ui/liquid-image";

const LiquidDemo = () => {
  return (
    <div className="h-screen w-screen relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-center items-center text-center z-10">
       <DeformationImage color="#000000" />
      <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tight mix-blend-exclusion text-white">
        Liquid Reality
      </h1>
      <p className="text-lg md:text-xl text-white mix-blend-exclusion max-w-2xl px-6 leading-relaxed">
         Experience the fluid boundary between digital and physical realms. Move your cursor to reshape reality itself.
      </p>
      </div>
    </div>
  );
};

export default LiquidDemo;
