import * as P5 from "p5";
import "p5/global";

declare global {
  interface Window extends P5 {
    p5: typeof P5;
  }
}

export as namespace p5;
