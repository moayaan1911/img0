import type { ReactNode } from "react";
import Footer from "@/src/components/layout/Footer";
import Navbar from "@/src/components/layout/Navbar";
import { TOOLS_REGISTRY } from "@/src/lib/tools-registry";

type ToolPageFrameProps = {
  children: ReactNode;
};

export default function ToolPageFrame({ children }: ToolPageFrameProps) {
  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <Navbar totalTools={TOOLS_REGISTRY.length} />
        <main className="flex flex-col gap-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

