"use client";

export default function Filler() {
  return <div>Filler</div>;
}

/*
"use client";

import { useSketch } from "@/lib/p5";

export type Props = {
  params: { id: string };
};

export default function SketchPage({ params }: Props) {
  console.log("render", JSON.stringify(params));

  useSketch(params.id);

  return <body />;
}
*/
