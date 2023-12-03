import NavBar from "@/components/Navbar";
import TestingSketch from "@/components/TestingSketch";
import { IsClientCtxProvider } from "@/components/providers/IsClientProvider";
import NextSessionProvider from "@/components/providers/SessionProvider";

export default function Home() {
  return (
    <main className="flex flex-col justify-center">
      <NextSessionProvider>
        <IsClientCtxProvider>
          <NavBar />
          <TestingSketch />
        </IsClientCtxProvider>
      </NextSessionProvider>
    </main>
  );
}
