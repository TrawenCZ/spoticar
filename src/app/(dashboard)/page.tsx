"use client";

import NavBar from "@/components/Navbar";
import { IsClientCtxProvider } from "@/components/providers/IsClientProvider";
import NextSessionProvider from "@/components/providers/SessionProvider";
import dynamic from "next/dynamic";
import { useState } from "react";

const SketchComponent = dynamic(() => import("@/components/TestingSketch"), {
  ssr: false,
});

export default function Home() {
  const [canShotSketch, setCanShotSketch] = useState(false);

  return (
    <main className="flex flex-col justify-center">
      <NextSessionProvider>
        <IsClientCtxProvider>
          <NavBar />
          <button
            className="btn btn-primary"
            onClick={() => setCanShotSketch(true)}
          >
            Trigger Sketch Component
          </button>
          {canShotSketch && <SketchComponent />}
        </IsClientCtxProvider>
      </NextSessionProvider>
    </main>
  );
}
