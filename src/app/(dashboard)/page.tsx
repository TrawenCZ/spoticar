import NavBar from "@/components/Navbar";
import { IsClientCtxProvider } from "@/components/providers/IsClientProvider";
import NextSessionProvider from "@/components/providers/SessionProvider";

export default function Home() {
  return (
    <main className="flex flex-col justify-center">
      <NextSessionProvider>
        <IsClientCtxProvider>
          <NavBar />
        </IsClientCtxProvider>
      </NextSessionProvider>
      <iframe src="/sketch/test" width={600} height={600} />
    </main>
  );
}
