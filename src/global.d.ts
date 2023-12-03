// TODO Make this only apply to global sketch pages

import P5 from "p5";
import "p5/global";

declare global {
  interface Window extends P5 {
    p5: typeof P5;
    AudioIn: typeof P5.AudioIn;
  }
}

export as namespace p5;
