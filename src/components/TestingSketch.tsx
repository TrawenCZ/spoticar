"use client";

import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { type Sketch } from "@p5-wrapper/react";
import p5 from "p5";

(window as any).p5 = p5;
await import("p5/lib/addons/p5.sound");

const sketch: Sketch = (p5) => {
  let button;
  let song: p5.SoundFile;

  p5.setup = () => {
    p5.createCanvas(600, 400);

    button = p5.createButton("Toggle audio");

    button.mousePressed(() => {
      if (!song) {
        const songPath = "/piano.mp3";
        song = p5.loadSound(
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
  return <NextReactP5Wrapper sketch={sketch} />;
}
