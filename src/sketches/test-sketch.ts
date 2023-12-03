let angle = 0;
let hue = 0;

export async function setup() {
  console.log("setup");
  createCanvas(600, 600);
  frameRate(60);

  if (typeof window !== "undefined") {
    console.log("AudioIn", p5.constructor);
    const soundLib = await import("p5/lib/addons/p5.sound");
    (p5.constructor.getAudioContext() as AudioContext).suspend();
    console.log("soundLib", soundLib);
    console.log("p5audi", p5.constructor.prototype.AudioIn);
    console.log("soundliAudi", soundLib.constructor.prototype.AudioIn);
    const mic = new soundLib.constructor.prototype.AudioIn();
    mic.start();
  }
}

export function draw() {
  // console.count("draw");
  background(0, 0.05);
  colorMode(HSB);
  fill(hue, 100, 100);

  circle(200, 200, 50 + random(-5, 5));

  push();
  translate(300, 200);
  rotate(angle);
  rect(0, 0, 50, 50);
  pop();

  angle += 0.05;
  angle %= 2 * PI;
  hue += 4;
  hue %= 360;
}
