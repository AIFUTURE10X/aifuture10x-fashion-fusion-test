
import { DeformationImage } from "@/components/ui/liquid-image";

const DemoOne = () => {
  return (
    <div className="h-screen w-screen relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-center items-center text-center z-10">
       <DeformationImage imageSrc="https://images.unsplash.com/photo-1697530210186-790a3eb8e55c?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
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

export { DemoOne };
