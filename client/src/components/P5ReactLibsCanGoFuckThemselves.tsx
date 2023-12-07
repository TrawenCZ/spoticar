// prettier-ignore
import "../utils/p5-window-definer";
// prettier-ignore
import * as p5 from "p5";
// prettier-ignore
import "p5/lib/addons/p5.sound";
// prettier-ignore
import React from "react";

class SketchBody extends React.Component {
  myRef: React.RefObject<HTMLDivElement>;
  myP5: p5 | undefined;
  constructor() {
    super({});
    this.myRef = React.createRef();
  }

  Sketch = (p: p5) => {
    // Initialize global variables and constants
    let bands = 1024;
    let times = [0, 0, 0, 0, 0, 0, 0];

    let beatThreshold = 0.16;
    let beatCutoff = 0;
    let beatDecayRate = 0.9995;
    let beatState = 0;
    let selectedPalette = 0;

    let NUM_PALETTES = 4;
    let NUM_DOTS = 560;
    let NUM_RINGS = 7;
    let RING_GROWTH_RATE = 20;

    // Loads the music file into p5.js to play on click
    p.preload = () => {
      p.soundFormats("mp3");
    };

    // Initial setup to create canvas and audio analyzers
    p.setup = () => {
      p.createCanvas(p.windowWidth / 1.5, p.windowHeight / 1.5);

      const mic = new p5.AudioIn();
      mic.start();
    };

    p.draw = () => {
      p.background(0);
      p.square(0, 0, 400);
      p.text("FUNGUJE DIVEJ !!!!!!!!!!!!!!", 10, 20);
    };

    p.windowResized = () => {};

    // Cycles color palette on Space Bar press
    p.keyPressed = () => {
      if (p.keyCode === 32) {
        // 32 is the keycode for SPACE_BAR
        selectedPalette = (selectedPalette + 1) % NUM_PALETTES;
      }
      return false; // prevent default
    };
  };

  // React things to make p5.js work properly and not lag when leaving the current page below
  componentDidMount() {
    this.myP5 = new p5.default(this.Sketch, this.myRef.current!);
  }

  componentDidUpdate() {
    if (this.myP5) this.myP5.remove();
    this.myP5 = new p5.default(this.Sketch, this.myRef.current!);
  }

  componentWillUnmount() {
    if (this.myP5) this.myP5.remove();
  }

  render() {
    return <div></div>;
  }
}

export default SketchBody;
