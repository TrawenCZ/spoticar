"use client";

import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { type Sketch } from "@p5-wrapper/react";
import p5 from "p5";
import { useEffect, useState } from "react";

window.p5 = p5;

const sketch: Sketch = (p5) => {
  let button;
  let song: p5.SoundFile;
  let mic: p5.AudioIn;

  p5.setup = () => {
    p5.createCanvas(600, 400);

    button = p5.createButton("Toggle audio");

    button.mousePressed(() => {
      if (!song) {
        const songPath =
          "https://vip.1.dl.wsfiles.cz/7211/7Crxn62T53/524288000/eJw1TrtOwzAU_Zc7MNmJff2KLVUMHRgqwgCoSxY7uCRScCon4VHEv+MisZ1zdF7f4MFBIyqUrNJYaQEERnCMwAqOG4ZKGa0kgfdCCWzgELUQtuDlTzmDW_MWCaRSdO_7YUyR3m2JHuI0fdHTSvd+WcZIKT36nMb0Sh+Hea3ezteplxJCYQPjMXjZqMCDMob5HpXkkklptLTaWhUEv9rLqbRNE4Fcgh8xLIPPseovXX0ap9jVZp8_k8YnJbr6NuY8591ze2gfju3NvCsFa_6_u1zANUwgGvbzC2jOSK8/16d56a5c7c0344b9c27907de6286809bff4b93c4/Machine-Gun-Kelly-ft-Cassie---Warning-Shot.mp3";

        song = window.p5.prototype.loadSound(
          songPath,
          () => {
            song.play();
          },
          () => {
            console.error(
              `Could not load the requested sound file ${songPath}`
            );
          }
        );
        return;
      }

      if (!song.isPlaying()) {
        song.play();
        return;
      }

      song.pause();
    });
  };

  p5.draw = () => {
    p5.background(55);
    p5.circle(p5.mouseX, p5.mouseY, 50);
  };
};

export default function TestingSketch() {
  const [importTrigger, setImportTrigger] = useState(false);
  useEffect(() => {
    import("p5/lib/addons/p5.sound").then(() => {
      setImportTrigger(true);
    });
  }, []);

  return <div>{importTrigger && <NextReactP5Wrapper sketch={sketch} />}</div>;
}
