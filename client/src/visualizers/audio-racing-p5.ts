import interpolate from "b-spline";
import hull from "hull.js";
import * as p5 from "p5";
// prettier-ignore
import "p5/lib/addons/p5.sound";

type Point = {
  x: number;
  y: number;
};

export const audioRacingP5Sketch = (p: p5, albumCoverUri: string) => {
  const trackPartsNeededToRerender: { point: Point; indexInTrack: number }[] =
    [];
  let estimatedNumberOfPointsInContainedInWidthValue: number = 0;
  let trackPoints: Point[];

  type CarStats = {
    alteredColor: number[];
    energyGain: number;
    energyStatus: number;
    boosted: number;
    drawIndex: number;
    car: Car;
  }[];

  const carColors = [
    p.color("#a2448d"),
    p.color("#44a259"),
    p.color("#33768c"),
  ];

  let carRaceStats: CarStats;
  let audioInput: p5.AudioIn;
  const fft = new p5.FFT();

  let audioRacingIcon: p5.Image;
  let albumCover: p5.Image;
  let backgroundBuffer: p5.Graphics;

  const predefinedFrequencyRanges = [
    "lowMid",
    "mid",
    "highMid",
    "treble",
    "bass",
  ];
  const bassFreqIndex = predefinedFrequencyRanges.indexOf("bass");

  let trackBuffer: p5.Graphics;
  let trackObjects: ((
    | { type: "car"; car: Car }
    | {
        type: "trackOverlap";
        overLapIndexes: {
          firstIndexOfOverlap: number;
          lastIndexOfOverlap: number;
        };
      }
  ) & { indexInTrack: number })[];

  let raceStartTimestamp: number;

  const findClosestTrackPoint = (
    trackPoints: p5.Vector[],
    position: p5.Vector,
    prevClosestPointIndex: number
  ): {
    closestPt: p5.Vector;
    closestPtIndexInTrack: number;
    closestPtDistance: number;
    trackHeading: p5.Vector;
  } => {
    let closestPoint = { vector: trackPoints[0], indexInTrack: 0 };
    let minDistance = Infinity;
    for (let i = prevClosestPointIndex; i < prevClosestPointIndex + 25; i++) {
      const modulatedIndex = i % trackPoints.length;
      const distance = position.dist(trackPoints[modulatedIndex]);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = {
          vector: trackPoints[modulatedIndex],
          indexInTrack: modulatedIndex,
        };
      }
    }
    return {
      closestPt: closestPoint.vector.copy(),
      closestPtIndexInTrack: closestPoint.indexInTrack,
      closestPtDistance: minDistance,
      trackHeading: trackPoints[
        (closestPoint.indexInTrack + 1) % trackPoints.length
      ]
        .copy()
        .sub(closestPoint.vector)
        .normalize(),
    };
  };

  const CAR_SIZE = { width: 7, height: 15 };
  const createCarImage = (color: p5.Color) => {
    const tireColor = p.color(0, 0, 0);
    const darkenedInputColor = p.color(
      color
        .toString()
        .replace("rgba(", "")
        .replace(")", "")
        .split(",")
        .map((x, index) => (index === 3 ? +x : +x - 40))
    );
    const carImage = p.createGraphics(CAR_SIZE.width, CAR_SIZE.height);
    carImage.noStroke();

    // draw tires
    carImage.fill(tireColor);
    carImage.rect(0, 2, 2, 2);
    carImage.rect(4, 2, 2, 2);
    carImage.rect(0, 11, 2, 2);
    carImage.rect(4, 11, 2, 2);

    // draw car body
    carImage.fill(color);
    carImage.rect(0, 0, CAR_SIZE.width, 1);
    carImage.rect(3, 1, 1, 4);
    carImage.rect(1, 5, 5, 1);
    carImage.rect(0, 6, CAR_SIZE.width, 5);
    carImage.rect(2, 11, 3, 2);
    carImage.rect(1, 13, 5, 1);

    // draw spoiler
    carImage.fill(darkenedInputColor);
    carImage.rect(1, 14, 5, 1);

    // draw cockpit
    carImage.square(3, 6, 1);
    carImage.rect(2, 7, 3, 2);

    return carImage;
  };

  class Car {
    acceleration: p5.Vector = p.createVector(0, 0);
    position: p5.Vector;
    heading: p5.Vector;
    audioFrequencyIntervalAssign: { low: number; high: number };
    audioIntervalSize: number;
    carImage: p5.Graphics;

    velocityNum: number;
    prevClosestPointIndex: number = 0;

    lapCount: number = 0;
    private lastLapTotalTime: number = 0;
    bestLapTime: number = Infinity;

    color: p5.Color;
    currBoost: number = 0;

    constructor(
      position: p5.Vector,
      heading: p5.Vector,
      audioFrequencyIntervalAssign: { low: number; high: number },
      color: p5.Color,
      initVelocity: number
    ) {
      this.position = position;
      this.heading = heading.normalize();
      this.audioFrequencyIntervalAssign = audioFrequencyIntervalAssign;
      this.audioIntervalSize =
        this.audioFrequencyIntervalAssign.high -
        this.audioFrequencyIntervalAssign.low;
      this.carImage = createCarImage(color);
      this.color = color;
      this.velocityNum = initVelocity;
    }

    move(audioValue: number, trackPoints: p5.Vector[], bassBoost: number) {
      this.currBoost = bassBoost > this.currBoost ? bassBoost : this.currBoost;
      const {
        closestPt,
        closestPtIndexInTrack,
        closestPtDistance,
        trackHeading,
      } = findClosestTrackPoint(
        trackPoints,
        this.position,
        this.prevClosestPointIndex
      );
      if (this.prevClosestPointIndex > closestPtIndexInTrack) {
        this.lapCount++;
        const lapTime = p.millis() - raceStartTimestamp - this.lastLapTotalTime;
        if (lapTime < this.bestLapTime) {
          this.bestLapTime = lapTime;
        }
        this.lastLapTotalTime += lapTime;
      }

      this.prevClosestPointIndex = closestPtIndexInTrack;

      // 1 is left, -1 is right
      const trackSidePosition =
        trackHeading.angleBetween(
          p.createVector(
            closestPt.x - this.position.x,
            closestPt.y - this.position.y
          )
        ) > 0
          ? 1
          : -1;

      const diffBetweenHeadings = p.abs(
        this.heading.angleBetween(trackHeading)
      );

      this.heading
        .add(trackHeading.mult(1.7))
        .normalize()
        .rotate(
          (closestPtDistance / (TRACK_WIDTH / 2)) * 3.2 * trackSidePosition
        );

      const indexOfThisCar = CARS.indexOf(this);
      const carInFront: Car | null =
        indexOfThisCar < CARS.length - 1 ? CARS[indexOfThisCar + 1] : null;
      if (carInFront) {
        const angleBetweenHeadingAndCarInFront = this.heading.angleBetween(
          p.createVector(
            carInFront.position.x - this.position.x,
            carInFront.position.y - this.position.y
          )
        );
        const absAngleBetweenHeadingAndCarInFront = p.abs(
          angleBetweenHeadingAndCarInFront
        );
        const distanceBetweenCars = this.position.dist(carInFront.position);
        if (distanceBetweenCars < CAR_SIZE.height * 1.1) {
          //this.velocityNum /= 1.08;
        }
        if (
          distanceBetweenCars < CAR_SIZE.height * 3 &&
          absAngleBetweenHeadingAndCarInFront < 9
        ) {
          const rotationFixer =
            (9 - absAngleBetweenHeadingAndCarInFront) *
            ((CAR_SIZE.height * 3) / distanceBetweenCars) *
            (angleBetweenHeadingAndCarInFront > 0 ? 1 : -1);
          this.heading.rotate(rotationFixer);
        }
      }

      const maxVelocity = 8.5;
      const percentualMaxVelocityReached = this.velocityNum / maxVelocity;

      this.velocityNum *=
        (p.constrain((audioValue + 0.1) ** 2, 1, 3.7) *
          (1.4 - percentualMaxVelocityReached)) /
        1.5;

      // this.velocityNum /=
      //   p.constrain(
      //     (p.abs(diffBetweenHeadings) / 6) * percentualMaxVelocityReached * 0.8,
      //     1,
      //     1.2
      //   ) +
      //   percentualMaxVelocityReached * 0.05;

      this.velocityNum /= p.constrain(
        1 + percentualMaxVelocityReached * 0.2,
        1,
        1.08
      );
      this.velocityNum /= this.audioFrequencyIntervalAssign.low;

      this.velocityNum = p.constrain(this.velocityNum, 0.35, maxVelocity);
      console.log(this.velocityNum);

      this.position.add(
        this.heading
          .copy()
          .mult(
            this.velocityNum *
              (this.currBoost > 0 ? 1 + this.currBoost * 0.7 : 1)
          )
      );
      this.currBoost /= 1.5;
    }

    draw(surface: p5) {
      surface.rectMode(p.CENTER);
      surface.translate(this.position.x, this.position.y);
      surface.rotate(this.heading.heading() + 90);
      surface.image(this.carImage, 0, 0);
    }
  }

  const CARS: Car[] = [];
  let TRACK_POINT_VECTORS: p5.Vector[];

  const MIN_POINTS = 30;
  const MAX_POINTS = 40;
  const MARGIN = 125;
  const MIN_DISTANCE = 110;
  const WIDTH = p.windowWidth;
  const HEIGHT = p.windowHeight;

  let kerbColorToggler = true;

  const MAX_ANGLE = 80;

  const DIFFICULTY = 0.1;
  const MAX_DISPLACEMENT = 80;

  const SPLINE_POINTS_COUNT = 1000;

  const TRACK_WIDTH = 40;

  const BOOST_COLOR = p.color(255, 255, 255, 80);

  const drawFinishLineGraphics = (surface: p5.Graphics) => {
    const numOfFinishLineSquares = 6;
    const lineSquareSize = TRACK_WIDTH / numOfFinishLineSquares;
    let colorToggler = true;
    surface.push();
    surface.noStroke();
    for (let i = 0; i < numOfFinishLineSquares; i++) {
      surface.fill(colorToggler ? p.color(255, 255, 255) : p.color(0, 0, 0));
      surface.square(i * lineSquareSize, 0, lineSquareSize);
      surface.fill(colorToggler ? p.color(0, 0, 0) : p.color(255, 255, 255));
      surface.square(i * lineSquareSize, lineSquareSize, lineSquareSize);
      colorToggler = !colorToggler;
    }
    surface.pop();
    return surface;
  };

  const finishLineGraphics = drawFinishLineGraphics(
    p.createGraphics(TRACK_WIDTH, TRACK_WIDTH / (6 / 2))
  );

  const TRACK_ASPHALT_COLOR = p.color(60, 57, 50);
  const TRACK_SAND_COLOR = p.color(255, 222, 153);
  const gravelWidth = TRACK_WIDTH + TRACK_WIDTH / 8;
  const GRAVEL_OFFSET =
    gravelWidth / 2 - (TRACK_WIDTH / 2 - gravelWidth / 2 + 5);
  const SHADOW_OFFSET = gravelWidth / 2;

  const TRACK_POINT_ANGLE_OFFSET = 3;

  const INTERPOLATE_STEP = 1 / (SPLINE_POINTS_COUNT - 1);
  const INTERPOLATE_DEGREE = 3;

  function random_points(
    min = MIN_POINTS,
    max = MAX_POINTS,
    margin = MARGIN,
    min_distance = MIN_DISTANCE
  ) {
    const pointCount = Math.round(p.random(min, max + 1));
    const points: Point[] = [];
    for (let i = 0; i < pointCount; i++) {
      const x = Math.round(p.random(margin, WIDTH - margin + 1));
      const y = Math.round(p.random(margin, HEIGHT - margin + 1));
      const distances = points
        .map((pt) => Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2))
        .filter((x) => x < min_distance);
      if (distances.length === 0) {
        points.push({ x, y });
      }
    }
    return points;
  }

  function make_rand_vector(dims: number) {
    const vec = Array.from({ length: dims }, () => p.randomGaussian(0, 1));
    const mag = Math.sqrt(vec.reduce((acc, x) => acc + x ** 2, 0));
    return vec.map((x) => x / mag);
  }

  function shape_track(
    track_points: Point[],
    difficulty = DIFFICULTY,
    max_displacement = MAX_DISPLACEMENT,
    margin = MARGIN / 2
  ) {
    const track_set: Point[] = Array(track_points.length * 2).fill({
      x: 0,
      y: 0,
    });
    for (let i = 0; i < track_points.length; i++) {
      const displacement = Math.pow(p.random(), difficulty) * max_displacement;
      const disp = make_rand_vector(2).map((x) => displacement * x);
      track_set[i * 2] = { x: track_points[i].x, y: track_points[i].y };
      track_set[i * 2 + 1] = {
        x: Math.round(
          (track_points[i].x + track_points[(i + 1) % track_points.length].x) /
            2 +
            disp[0]
        ),
        y: Math.round(
          (track_points[i].y + track_points[(i + 1) % track_points.length].y) /
            2 +
            disp[1]
        ),
      };
    }
    for (let i = 0; i < 3; i++) {
      push_points_apart(track_set);
      fix_angles(track_set);
    }

    // push any point outside screen limits back again
    const final_set: Point[] = [];
    for (const point of track_set) {
      if (point.x < margin) {
        point.x = margin;
      } else if (point.x > WIDTH - margin) {
        point.x = WIDTH - margin;
      }
      if (point.y < margin) {
        point.y = margin;
      } else if (point.y > HEIGHT - margin) {
        point.y = HEIGHT - margin;
      }
      final_set.push(point);
    }
    return final_set;
  }

  function push_points_apart(points: Point[], distance = MIN_DISTANCE) {
    // distance might need some tweaking
    const distance2 = distance * distance;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length - 1; j++) {
        const p_distance = Math.sqrt(
          (points[i].x - points[j].x) ** 2 + (points[i].y - points[j].y) ** 2
        );
        if (p_distance < distance) {
          const dx = points[j].x - points[i].x;
          const dy = points[j].y - points[i].y;
          const dl = Math.sqrt(dx * dx + dy * dy);
          const dif = distance - dl;
          points[j].x += Math.round(dif * (dx / dl));
          points[j].y += Math.round(dif * (dy / dl));
          points[i].x -= Math.round(dif * (dx / dl));
          points[i].y -= Math.round(dif * (dy / dl));
        }
      }
    }
    return points;
  }

  function fix_angles(points: Point[], max_angle = MAX_ANGLE) {
    for (let i = 0; i < points.length; i++) {
      const prev_point = i > 0 ? i - 1 : points.length - 1;
      const next_point = (i + 1) % points.length;
      let px = points[i].x - points[prev_point].x;
      let py = points[i].y - points[prev_point].y;
      const pl = Math.sqrt(px * px + py * py);
      px /= pl;
      py /= pl;
      let nx = -(points[i].x - points[next_point].x);
      let ny = -(points[i].y - points[next_point].y);
      const nl = Math.sqrt(nx * nx + ny * ny);
      nx /= nl;
      ny /= nl;
      const a = Math.atan2(px * ny - py * nx, px * nx + py * ny);
      if (Math.abs(p.degrees(a)) <= max_angle) {
        continue;
      }
      const diff = p.radians(max_angle * Math.sign(a)) - a;
      const c = Math.cos(diff);
      const s = Math.sin(diff);
      const new_x = (nx * c - ny * s) * nl;
      const new_y = (nx * s + ny * c) * nl;
      points[next_point].x = Math.round(points[i].x + new_x);
      points[next_point].y = Math.round(points[i].y + new_y);
    }
    return points;
  }

  function smooth_track(
    track_points: Point[],
    interpolateStep = INTERPOLATE_STEP,
    splinePointsCount = SPLINE_POINTS_COUNT
  ) {
    const trackPointsForLoop = track_points
      .concat(track_points.slice(0, INTERPOLATE_DEGREE + 1))
      .map((point) => [point.x, point.y]);
    const maxSpline = 1.0 - 1.0 / (trackPointsForLoop.length + 1);

    // fit splines to x=f(u) and y=g(u), treating both as periodic. also note that s=0
    // is needed in order to force the spline fit to pass through all the input points.

    const track: Point[] = [];
    for (let i = 0; i <= maxSpline; i += interpolateStep) {
      const interPolatedVal = interpolate(i, 3, trackPointsForLoop);
      track.push({ x: interPolatedVal[0], y: interPolatedVal[1] });
    }

    return track;
  }

  function draw_points(surface: p5, color: p5.Color, points: Point[]) {
    for (const point of points) {
      surface.fill(color);
      surface.circle(point.x, point.y, 10);
    }
  }

  function draw_convex_hull(
    convexHull: Point[],
    surface: p5,
    points: Point[],
    color: p5.Color
  ) {
    surface.fill(color);
    for (let i = 0; i < convexHull.length - 1; i++) {
      const pointIndexedByHull = points.find(
        (point) => point.x === convexHull[i].x && point.y === convexHull[i].y
      );
      if (!pointIndexedByHull) {
        continue;
      }

      const nextPointIndexedByHull = points.find(
        (point) =>
          point.x === convexHull[i + 1].x && point.y === convexHull[i + 1].y
      );
      if (!nextPointIndexedByHull) {
        continue;
      }
      surface.line(
        pointIndexedByHull.x,
        pointIndexedByHull.y,
        nextPointIndexedByHull.x,
        nextPointIndexedByHull.y
      );
      surface.line(
        pointIndexedByHull.x,
        pointIndexedByHull.y,
        nextPointIndexedByHull.x,
        nextPointIndexedByHull.y
      );
    }
    const firstPointIndexedByHull = points.find(
      (point) => point.x === convexHull[0].x && point.y === convexHull[0].y
    );

    if (!firstPointIndexedByHull) {
      return;
    }

    const lastPointIndexedByHull = points.find(
      (point) =>
        point.x === convexHull[convexHull.length - 1].x &&
        point.y === convexHull[convexHull.length - 1].y
    );

    if (!lastPointIndexedByHull) {
      return;
    }
    surface.line(
      firstPointIndexedByHull.x,
      firstPointIndexedByHull.y,
      lastPointIndexedByHull.x,
      lastPointIndexedByHull.y
    );
  }

  function draw_lines_from_points(
    surface: p5,
    color: p5.Color,
    points: Point[]
  ) {
    surface.fill(color);
    for (let i = 0; i < points.length - 1; i++) {
      surface.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }
    surface.line(
      points[0].x,
      points[0].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    );
  }

  const shadow = (surface: p5) => {
    surface.drawingContext.shadowBlur = 20;
    surface.drawingContext.shadowColor = p.color(20, 20, 20, 255);
  };

  const noShadow = (surface: p5) => {
    surface.drawingContext.shadowBlur = 0;
    surface.drawingContext.shadowColor = p.color(80, 80, 80, 0);
  };

  const drawTrackLineRaw = (
    surface: p5,
    currPoint: Point,
    nextPoint: Point,
    prevPoint: Point
  ) => {
    // compute angle between next and previous point
    const angle = p.degrees(
      p
        .createVector(currPoint.x - prevPoint.x, currPoint.y - prevPoint.y)
        .angleBetween(
          p.createVector(nextPoint.x - currPoint.x, nextPoint.y - currPoint.y)
        )
    );

    const perpendicularVector = p.createVector(
      currPoint.y - nextPoint.y,
      -(currPoint.x - nextPoint.x)
    );
    perpendicularVector.setMag(SHADOW_OFFSET);

    // draw shadow
    shadow(surface);
    surface.stroke(p.color(255, 222, 153));
    surface.strokeWeight(1.5);
    // right
    surface.line(
      currPoint.x + perpendicularVector.x,
      currPoint.y + perpendicularVector.y,
      nextPoint.x + perpendicularVector.x,
      nextPoint.y + perpendicularVector.y
    );
    // left
    surface.line(
      currPoint.x - perpendicularVector.x,
      currPoint.y - perpendicularVector.y,
      nextPoint.x - perpendicularVector.x,
      nextPoint.y - perpendicularVector.y
    );
    noShadow(surface);

    // draw sand or gravel or whatever it is next to the track or kerb if angle is too big
    perpendicularVector.setMag(GRAVEL_OFFSET);
    surface.strokeWeight(8);
    surface.stroke(TRACK_SAND_COLOR);

    if (p.abs(angle) > 2.2) {
      surface.stroke(
        kerbColorToggler
          ? surface.color(255, 255, 255)
          : surface.color(255, 0, 0)
      );
      kerbColorToggler = !kerbColorToggler;
    }
    surface.line(
      currPoint.x + perpendicularVector.x,
      currPoint.y + perpendicularVector.y,
      nextPoint.x + perpendicularVector.x,
      nextPoint.y + perpendicularVector.y
    );
    surface.line(
      currPoint.x - perpendicularVector.x,
      currPoint.y - perpendicularVector.y,
      nextPoint.x - perpendicularVector.x,
      nextPoint.y - perpendicularVector.y
    );

    // draw track itself
    surface.strokeWeight(TRACK_WIDTH);
    surface.stroke(TRACK_ASPHALT_COLOR);
    surface.line(currPoint.x, currPoint.y, nextPoint.x, nextPoint.y);
  };

  const rerenderTrackPart = (
    surface: p5,
    fromIndex: number,
    toIndex: number,
    track_line: Point[]
  ) => {
    kerbColorToggler = true;
    for (let i = fromIndex; i <= toIndex; i++) {
      const prevPoint = track_line.at(i - 1)!;
      const currentPoint = track_line[i];
      const nextPoint = track_line[(i + 1) % track_line.length];

      drawTrackLineRaw(surface, currentPoint, nextPoint, prevPoint);
    }
  };

  const drawFinishLine = (
    surface: p5,
    startPoint: Point,
    heading: p5.Vector
  ) => {
    surface.push();
    surface.translate(startPoint.x, startPoint.y);
    surface.translate(-heading.x, -heading.y);
    surface.angleMode(p.RADIANS);
    surface.rotate(heading.heading());
    surface.angleMode(p.DEGREES);
    surface.image(finishLineGraphics, 0, 0);
    surface.pop();
  };

  function drawTrackLine(surface: p5, points: Point[], width: number) {
    surface.push();
    surface.noFill();
    surface.strokeCap(p.ROUND);
    surface.angleMode(p.DEGREES);

    for (let i = 0; i < points.length - 1; i++) {
      const nextPoint = points[i + 1];
      const currentPoint = points[i];
      const prevPoint = points[i === 0 ? points.length - 1 : i - 1];

      // overlapping scout
      for (
        let revI = i - estimatedNumberOfPointsInContainedInWidthValue;
        revI >= 0;
        revI--
      ) {
        if (revI < 0) break;
        if (i > points.length - 80 && revI < 80) continue;
        if (
          TRACK_POINT_VECTORS[i].dist(TRACK_POINT_VECTORS[revI]) <
          width + width / 8
        ) {
          trackPartsNeededToRerender.push({
            point: points[i],
            indexInTrack: i,
          });
          break;
        }
      }

      drawTrackLineRaw(surface, currentPoint, nextPoint, prevPoint);
    }
    const finishLineHeading = p
      .createVector(points[1].y - points[0].y, -(points[1].x - points[0].x))
      .setMag(TRACK_WIDTH / 2);
    drawFinishLine(surface, points[0], finishLineHeading);
    surface.pop();
  }

  function draw_track(surface: p5, color: p5.Color, points: Point[]) {
    const radius = Math.round(TRACK_WIDTH / 2);

    // inner
    drawTrackLine(surface, points, TRACK_WIDTH);

    // get parameterized starting grid image
    const starting_grid: p5.Graphics = draw_starting_grid(TRACK_WIDTH);

    // rotate and place starting grid
    const offset = TRACK_POINT_ANGLE_OFFSET;
    const vec_p = [
      points[offset].y - points[0].y,
      -(points[offset].x - points[0].x),
    ];
    const n_vec_p = [
      vec_p[0] / Math.hypot(vec_p[0], vec_p[1]),
      vec_p[1] / Math.hypot(vec_p[0], vec_p[1]),
    ];

    // compute angle
    const angle = p.degrees(Math.atan2(n_vec_p[1], n_vec_p[0]));
    surface.push();
    const start_pos = {
      x: points[0].x - Math.sign(n_vec_p[0]) * n_vec_p[0] * radius,
      y: points[0].y - Math.sign(n_vec_p[1]) * n_vec_p[1] * radius,
    };
    surface.translate(start_pos.x, start_pos.y);
    surface.rotate(-angle);
    surface.image(starting_grid, start_pos.x, start_pos.y);
    surface.pop();
  }

  function draw_starting_grid(track_width: number) {
    const tile_height = 5;
    const tile_width = 5;
    const grid_tile = p.createGraphics(tile_width, tile_height);
    grid_tile.background(255);
    grid_tile.fill(0);
    grid_tile.rect(
      0,
      0,
      Math.floor(tile_width / 2),
      Math.floor(tile_height / 2)
    );
    grid_tile.rect(
      Math.floor(tile_width / 2),
      Math.floor(tile_height / 2),
      tile_width - Math.floor(tile_width / 2),
      tile_height - Math.floor(tile_height / 2)
    );

    const starting_grid = p.createGraphics(track_width, tile_height);
    for (let i = 0; i < track_width / tile_height; i++) {
      starting_grid.image(grid_tile, i * tile_width, 0);
    }
    return starting_grid;
  }

  const drawRaceStatsTable = (
    surface: p5,
    carsForFaceStats: CarStats,
    size: { width: number; height: number },
    position: Point
  ) => {
    const partWidth = size.width / (carsForFaceStats.length + 0.5);
    surface.push();
    shadow(surface);
    surface.noStroke();

    // table background
    surface.fill(0, 0, 0, 60);
    surface.rect(position.x, position.y, size.width, size.height);
    noShadow(surface);

    // header
    surface.image(
      audioRacingIcon,
      position.x,
      position.y,
      partWidth * 0.5,
      size.height
    );

    const carStatSize = {
      width: partWidth - partWidth / 6,
      widthPart: (partWidth - partWidth / 6) / 6,
      height: size.height - partWidth / 6,
      widthOffset: partWidth / 12,
      heightOffset: partWidth / 12,
    };

    for (let i = 0; i < carsForFaceStats.length; i++) {
      const carStats = carsForFaceStats.find(
        (carStats) => carStats.drawIndex === i
      )!;
      const partPosition = {
        x: position.x + carStatSize.widthOffset + partWidth * (i + 0.5),
        y: position.y + carStatSize.heightOffset,
      };

      surface.stroke(255);
      surface.strokeWeight(1.5);
      surface.noFill();
      surface.rect(
        partPosition.x,
        partPosition.y,
        carStatSize.width,
        carStatSize.height
      );

      const basicEnergy =
        carStatSize.widthPart +
        (p.constrain(carStats.energyGain, 0, 255) / 255) *
          carStatSize.widthPart *
          4;
      surface.noStroke();
      surface.fill(carStats.alteredColor);
      surface.rect(
        partPosition.x,
        partPosition.y,
        basicEnergy,
        carStatSize.height
      );
      surface.fill(BOOST_COLOR);
      surface.rect(
        partPosition.x + basicEnergy,
        partPosition.y,
        (carStats.boosted / 60) * carStatSize.widthPart,
        carStatSize.height
      );
      carStats.boosted = carStats.boosted > 0 ? carStats.boosted - 1 : 0;
      surface.fill(
        carStats.alteredColor[0] > 170 &&
          carStats.alteredColor[1] > 170 &&
          carStats.alteredColor[2] > 170
          ? p.color(0, 0, 0)
          : p.color(255, 255, 255)
      );

      carStats.energyGain /= 1.2;

      surface.textSize(carStatSize.height / 3);
      surface.textAlign(p.CENTER, p.CENTER);
      surface.textFont("Calibri");
      surface.text(
        `${carsForFaceStats.indexOf(carStats) + 1}. Lap: ${
          carStats.car.lapCount
        } ${
          carStats.car.bestLapTime !== Infinity
            ? ` - Best: ${(carStats.car.bestLapTime / 1000).toFixed(3)}s`
            : ""
        }`,
        partPosition.x + carStatSize.width / 2,
        partPosition.y + carStatSize.height / 4
      );
    }
    surface.pop();
  };

  // getting dominant colors from album cover
  const getColorPalleteFromImage = (image: p5.Image, numOfColors: number) => {
    const colors: {
      color: [r: number, g: number, b: number];
      amount: number;
    }[] = [];
    image.loadPixels();

    // iterating over pixels in image with step of 64 to reduce number of iterations
    for (let j = 0; j < image.pixels.length; j += 64) {
      let r = image.pixels[j];
      let g = image.pixels[j + 1];
      let b = image.pixels[j + 2];

      // grouping similar colors
      let temp = colors.find((element) => {
        return (
          p.abs(element.color[0] - r) < 10 &&
          p.abs(element.color[1] - g) < 10 &&
          p.abs(element.color[2] - b) < 10
        );
      });

      if (!temp) {
        colors.push({ color: [r, g, b], amount: 1 });
      } else {
        temp.amount += 1;
      }
      colors.sort((a, b) => b.amount - a.amount);
    }

    // returning only the most dominant colors
    return colors
      .filter((_, index) => index < numOfColors)
      .map((color) => [color.color[0], color.color[1], color.color[2]]);
  };

  const createBackground = (surface: p5.Graphics) => {
    const colorPallete = getColorPalleteFromImage(albumCover, 5);

    surface.angleMode(p.DEGREES);
    const angle = p.random(40, 50);
    surface.translate(surface.width / 2, surface.height / 2);
    surface.rotate(angle);

    surface.translate(-surface.width / 2, -surface.height / 2);

    const numOfStrikes = 150;
    surface.noStroke();

    const backgroundColor = colorPallete[0];
    if (backgroundColor[0] + backgroundColor[1] + backgroundColor[2] > 600) {
      const diff = Math.ceil(
        (backgroundColor[0] + backgroundColor[1] + backgroundColor[2] - 600) / 3
      );
      backgroundColor[0] = backgroundColor[0] - diff;
      backgroundColor[1] = backgroundColor[1] - diff;
      backgroundColor[2] = backgroundColor[2] - diff;
    }

    surface.background(backgroundColor);
    const palleteForStrikes = colorPallete.slice(1);
    for (let i = 0; i < numOfStrikes; i++) {
      surface.push();
      surface.stroke(p.random(palleteForStrikes));

      surface.strokeWeight(p.random(1, 8));
      const lineLength = -p.random(30, 350);
      const noiseVal = p.noise(i / 3);
      const noiseVal2 = p.noise(i / 4 + 100);
      surface.translate(
        p.width * 3 * noiseVal - p.width,
        p.height * 3 * noiseVal2 - p.height
      );

      surface.line(0, 0, 0, lineLength);
      surface.pop();
    }
    return { surface: surface, colorPalleteFromAlbumCover: palleteForStrikes };
  };

  p.preload = () => {
    audioRacingIcon = p.loadImage("/assets/spoticar-table-header.png");
    albumCover = p.loadImage(albumCoverUri);
  };

  p.setup = async () => {
    p.createCanvas(WIDTH, HEIGHT);

    // create buffer for track
    trackBuffer = p.createGraphics(WIDTH, HEIGHT);
    trackBuffer.background(0, 0, 0, 0);
    trackBuffer.angleMode(p.DEGREES);

    // create background
    const { surface, colorPalleteFromAlbumCover } = createBackground(
      p.createGraphics(WIDTH, HEIGHT)
    );
    backgroundBuffer = surface;

    // generate the track skeleton
    const points = random_points();

    const convexHullRaw = hull(
      points.map((point) => [point.x, point.y]),
      440
    ) as number[][];

    const convexHull = shape_track(
      convexHullRaw.slice(0, convexHullRaw.length - 1).map((point) => ({
        x: point[0],
        y: point[1],
      }))
    );

    // smoothening the track from rought skeleton to a nice curve
    trackPoints = smooth_track(convexHull);

    // track points converted to p5 vectors
    TRACK_POINT_VECTORS = trackPoints.map((point) =>
      p.createVector(point.x, point.y)
    );

    estimatedNumberOfPointsInContainedInWidthValue = Math.ceil(
      (10 * TRACK_WIDTH) /
        (TRACK_POINT_VECTORS[0].dist(TRACK_POINT_VECTORS[1]) +
          TRACK_POINT_VECTORS.at(-1)!.dist(TRACK_POINT_VECTORS.at(-2)!) +
          TRACK_POINT_VECTORS[Math.floor(TRACK_POINT_VECTORS.length / 2)].dist(
            TRACK_POINT_VECTORS[Math.floor(TRACK_POINT_VECTORS.length / 2) + 1]
          ) /
            3)
    );

    // draw the actual track (road, kerbs, starting grid)
    draw_track(trackBuffer, p.color(50, 48, 42), trackPoints);

    // reducing parts that need to be rerendered only to starting and ending index in track point array
    const reducedOverlapingParts = trackPartsNeededToRerender.reduce(
      (acc, pointAndIndex, index) => {
        if (index === 0) {
          acc.push({
            firstIndexOfOverlap: pointAndIndex.indexInTrack,
            lastIndexOfOverlap: pointAndIndex.indexInTrack,
          });
          return acc;
        }
        if (acc.at(-1)!.lastIndexOfOverlap === pointAndIndex.indexInTrack - 1) {
          acc.at(-1)!.lastIndexOfOverlap = pointAndIndex.indexInTrack;
        } else {
          acc.push({
            firstIndexOfOverlap: pointAndIndex.indexInTrack,
            lastIndexOfOverlap: pointAndIndex.indexInTrack,
          });
        }
        return acc;
      },
      [] as { firstIndexOfOverlap: number; lastIndexOfOverlap: number }[]
    );

    // draw the different elements that end up
    // making the track if debug is enabled
    const debug = false;
    if (debug) {
      TRACK_ASPHALT_COLOR.setAlpha(50);
      draw_points(trackBuffer, p.color(255), points);
      draw_convex_hull(convexHull, trackBuffer, points, p.color(255, 0, 0));
      draw_points(trackBuffer, p.color(0, 0, 255), convexHull);
      draw_lines_from_points(trackBuffer, p.color(0, 0, 255), convexHull);
      draw_points(trackBuffer, p.color(0), trackPoints);
    }

    // creating race cars with their initial state
    const carCount = 3;
    const startingVectorResolution = 6;
    const carInitPositions: { position: p5.Vector; heading: p5.Vector }[] =
      new Array(carCount);
    for (let i = -1; i >= -carCount; i--) {
      const partialTrackDirection = p.createVector(
        trackPoints.at((i + 1) * startingVectorResolution)!.x -
          trackPoints.at(i * startingVectorResolution)!.x,
        trackPoints.at((i + 1) * startingVectorResolution)!.y -
          trackPoints.at(i * startingVectorResolution)!.y
      );

      carInitPositions[carInitPositions.length + i] = {
        position: p.createVector(
          trackPoints.at(Math.round((i / 2) * startingVectorResolution))!.x,
          trackPoints.at(Math.round((i / 2) * startingVectorResolution))!.y
        ),
        heading: partialTrackDirection.normalize(),
      };
    }

    const colorHelper = (color: number) =>
      color > 110 ? color - 70 : color + 70;

    // const palleteForCars = colorPalleteFromAlbumCover.map((color, index) => {
    //   for (let i = 0; i < colorPalleteFromAlbumCover.length; i++) {
    //     if (i === index) continue;
    //     if (
    //       p.abs(colorPalleteFromAlbumCover[i][0] - color[0]) < 70 &&
    //       p.abs(colorPalleteFromAlbumCover[i][1] - color[1]) < 70 &&
    //       p.abs(colorPalleteFromAlbumCover[i][2] - color[2]) < 70
    //     ) {
    //       color[0] = colorHelper(color[0]);
    //       color[1] = colorHelper(color[1]);
    //       color[2] = colorHelper(color[2]);
    //     }
    //   }
    //   return color;
    // });

    const partDivider = 255 + 70;
    const colorDividers = [
      colorPalleteFromAlbumCover[0][0] / partDivider,
      colorPalleteFromAlbumCover[0][1] / partDivider,
      colorPalleteFromAlbumCover[0][2] / partDivider,
    ];
    const palleteForCars = [15, 140, 210].map((colorMultiplier) => [
      70 + colorDividers[0] * colorMultiplier,
      70 + colorDividers[1] * colorMultiplier,
      70 + colorDividers[2] * colorMultiplier,
    ]);

    const randomOffsetToSlowDown = Math.round(p.random(0, 3));
    const secondLessSlowingOffset = (randomOffsetToSlowDown + 1) / 3;
    for (let i = 0; i < 3; i++) {
      const slowConstant =
        i === randomOffsetToSlowDown
          ? 1.24
          : i === randomOffsetToSlowDown + 1
          ? 1.4
          : 1;
      CARS.push(
        new Car(
          carInitPositions[i].position,
          carInitPositions[i].heading,
          { low: slowConstant, high: (i + 1) * 10 },
          carColors[i],
          i + 1.5
        )
      );
    }

    carRaceStats = CARS.map((car, index) => {
      const carColorCopyToArray = p
        .color(car.color)
        .toString()
        .replace("rgba(", "")
        .replace(")", "")
        .split(",")
        .map((x) => +x);
      // carColorCopy.setAlpha(100);
      carColorCopyToArray[3] = 255;
      return {
        alteredColor: carColorCopyToArray,
        energyGain: 0,
        energyStatus: 0,
        boosted: 0,
        drawIndex: index,
        car: car,
      };
    });

    // creating array for track objects that need to be drawn in every frame at the correct order (mostly because of track overlaping parts)
    trackObjects = CARS.map(
      (car) =>
        ({
          type: "car",
          car,
          indexInTrack: car.prevClosestPointIndex,
        } as { type: "car"; car: Car } & { indexInTrack: number })
    );
    trackObjects = trackObjects.concat(
      reducedOverlapingParts.map(
        (overLapIndexes) =>
          ({
            type: "trackOverlap",
            overLapIndexes,
            indexInTrack: overLapIndexes.firstIndexOfOverlap - 20,
          } as {
            type: "trackOverlap";
            overLapIndexes: {
              firstIndexOfOverlap: number;
              lastIndexOfOverlap: number;
            };
          } & { indexInTrack: number })
      )
    );
    trackObjects.sort((a, b) => a.indexInTrack - b.indexInTrack);
    p.frameRate(60);

    // setting race start time
    raceStartTimestamp = p.millis();

    const audioContext = p.getAudioContext() as AudioContext;
    audioContext.resume();
    audioInput = new p5.AudioIn();
    fft.setInput(audioInput);
    const virtualInputIndex: number = await audioInput
      .getSources()
      .then((devices: InputDeviceInfo[]) =>
        devices.findIndex((dev) => dev.label.includes("Default"))
      );

    if (isNaN(virtualInputIndex)) {
      alert("Virtual input for Spotify couldn't be found!");
      return;
    }
    audioInput.setSource(virtualInputIndex);
    audioInput.start();
  };

  p.draw = () => {
    // const randomFakeSpectrum = Array.from({ length: 31 }, () =>
    //   p.random(0, 255)
    // );
    const spectrum: number[] = fft.analyze();
    // const firstNonZeroIndex = spectrum.findIndex((x) => x !== 0);
    // let lastNonZeroIndex;
    // for (let i = spectrum.length - 1; i > 2; i--) {
    //   if (spectrum.at(i) !== 0) {
    //     lastNonZeroIndex = i + 1;
    //     break;
    //   }
    // }
    // const audioSpectrum = spectrum.slice(firstNonZeroIndex, lastNonZeroIndex);
    // const audioPartSize = Math.floor(audioSpectrum.length / CARS.length);
    const energyValues = predefinedFrequencyRanges.map((range) =>
      fft.getEnergy(range)
    );
    const bassBoost = energyValues[bassFreqIndex] / 200;
    const boostedCarIndex =
      bassBoost > 1 ? Math.round(p.random(CARS.length)) : -1;

    // drawing background
    p.image(backgroundBuffer, 0, 0);
    // placing generated track
    p.image(trackBuffer, 0, 0);

    // rendering track objects
    let carCounter = 0;
    trackObjects.forEach((object) => {
      if (object.type === "car") {
        const car = object.car;
        const audioValue = energyValues[carCounter];
        const carStats = carRaceStats.find((x) => x.car === car)!;
        p.push();
        p.angleMode(p.DEGREES);
        car.move(
          1 + audioValue / 255,
          TRACK_POINT_VECTORS,
          boostedCarIndex === carCounter ? bassBoost : -1
        );
        if (boostedCarIndex === carCounter) {
          carStats.boosted = 60;
        }
        carStats.energyGain = p.constrain(
          carStats.energyGain +
            (audioValue * 10) /
              (carStats.energyGain === 0 ? 1 : carStats.energyGain),
          0,
          255
        );
        object.indexInTrack = car.prevClosestPointIndex;
        car.draw(p);
        p.pop();
        carCounter++;
      }
      if (object.type === "trackOverlap") {
        rerenderTrackPart(
          p,
          object.overLapIndexes.firstIndexOfOverlap,
          object.overLapIndexes.lastIndexOfOverlap,
          trackPoints
        );
      }
    });

    // keeping cars in seperate array to be able to store their race stats
    CARS.sort((a, b) => a.prevClosestPointIndex - b.prevClosestPointIndex);
    // for (let i = 0; i < CARS.length; i++) {
    //   for (let j = 0; j < CARS.length; j++) {
    //     if (i === j) continue;
    //     if ((carRaceStats[i].racePosition > carRaceStats[j].racePosition) && (carRaceStats[i].car.lapCount > carRaceStats[j].car.lapCount || (carRaceStats[i].car.lapCount === carRaceStats[j].car.lapCount && carRaceStats[i].car.prevClosestPointIndex > carRaceStats[j].car.prevClosestPointIndex))) {
    //       const tempPosition = carRaceStats[i].racePosition;
    //       carRaceStats[i].racePosition = carRaceStats[j].racePosition
    //       carRaceStats[j].racePosition = tempPosition;
    //     }
    //   }
    // }
    carRaceStats.sort((a, b) =>
      a.car.lapCount - b.car.lapCount === 0
        ? a.car.prevClosestPointIndex - b.car.prevClosestPointIndex
        : a.car.lapCount - b.car.lapCount
    );
    drawRaceStatsTable(
      p,
      carRaceStats,
      { width: (CARS.length + 0.5) * 250, height: 80 },
      { x: 0, y: HEIGHT - 80 }
    );
    trackObjects.sort((a, b) => a.indexInTrack - b.indexInTrack);
  };
};
