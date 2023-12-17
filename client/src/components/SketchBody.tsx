// prettier-ignore
import "../utils/p5-window-definer";
// prettier-ignore
import * as p5 from "p5";
// prettier-ignore
import "p5/lib/addons/p5.sound";
// prettier-ignore
import React from "react";
// prettier-ignore
import { audioRacingP5Sketch } from "../visualizers/audio-racing-p5";

class SketchBody extends React.Component {
  myRef: React.RefObject<HTMLDivElement>;
  myP5: p5 | undefined;

  constructor() {
    super({});
    console.log("sem tu????????????");
    this.myRef = React.createRef();
  }
  Sketch = (p: p5) =>
    audioRacingP5Sketch(p, "http://localhost:3000/assets/album_cover.jpg");

  // Sketch = (p: p5) => {
  //   let audioInput: p5.AudioIn;

  //   p.preload = () => {
  //     p.soundFormats("mp3");
  //   };

  //   // Initial setup to create canvas and audio analyzers
  //   p.setup = async () => {
  //     audioInput = new p5.AudioIn();
  //     const virtualInputIndex: number = await audioInput
  //       .getSources()
  //       .then((devices: InputDeviceInfo[]) =>
  //         devices.findIndex((dev) => dev.label.includes("VoiceMeeter Output"))
  //       );

  //     if (!virtualInputIndex || isNaN(virtualInputIndex)) {
  //       alert("Virtual input for Spotify couldn't be found!");
  //       return;
  //     }
  //     audioInput.setSource(virtualInputIndex);

  //     p.createCanvas(p.windowWidth, p.windowHeight);
  //   };

  //   p.draw = () => {
  //     p.background(0);
  //     p.square(0, 0, 400);
  //     p.text("FUNGUJE DIVEJ !!!!!!!!!!!!!!", 10, 20);
  //   };

  //   p.windowResized = () => {};
  // };

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
