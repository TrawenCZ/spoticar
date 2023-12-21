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

class SketchBody extends React.Component<{ url: string }> {
  myRef: React.RefObject<HTMLDivElement>;
  myP5: p5 | undefined;
  url: string;

  constructor({ url }: { url: string }) {
    super({ url });
    this.url = url;
    this.myRef = React.createRef();
  }
  Sketch = (p: p5) => audioRacingP5Sketch(p, this.url);

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
