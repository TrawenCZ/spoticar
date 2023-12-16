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
  let carRaceStats: Car[];
  let audioInput: p5.AudioIn;
  const fft = new p5.FFT();

  let audioRacingLogo: p5.Image;
  let albumCover: p5.Image;
  let backgroundBuffer: p5.Graphics;

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

    velocityNum: number = 0.5;
    prevClosestPointIndex: number = 0;

    lapCount: number = 0;
    private lastLapTotalTime: number = 0;
    bestLapTime: number = Infinity;

    color: p5.Color;

    constructor(
      position: p5.Vector,
      heading: p5.Vector,
      audioFrequencyIntervalAssign: { low: number; high: number },
      color: p5.Color
    ) {
      this.position = position;
      this.heading = heading.normalize();
      this.audioFrequencyIntervalAssign = audioFrequencyIntervalAssign;
      this.audioIntervalSize =
        this.audioFrequencyIntervalAssign.high -
        this.audioFrequencyIntervalAssign.low;
      this.carImage = createCarImage(color);
      this.color = color;
    }

    move(assignedSpectrum: number[], trackPoints: p5.Vector[]) {
      const value =
        assignedSpectrum.reduce((acc, x) => acc + x, 0) /
        assignedSpectrum.length;

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
        .add(trackHeading.mult(1.2))
        .normalize()
        .rotate(
          (closestPtDistance / (TRACK_WIDTH / 2)) * 2.5 * trackSidePosition
        );

      const carsInFront = CARS.slice(CARS.indexOf(this) + 1);
      carsInFront.forEach((carInFront) => {
        const angleBetweenHeadingAndCarInFront = p.abs(
          this.heading.angleBetween(
            p.createVector(
              carInFront.position.x - this.position.x,
              carInFront.position.y - this.position.y
            )
          )
        );
        const distanceBetweenCars = this.position.dist(carInFront.position);
        if (
          distanceBetweenCars < CAR_SIZE.height * 3 &&
          angleBetweenHeadingAndCarInFront < 8
        ) {
          const rotationFixer =
            (8 - angleBetweenHeadingAndCarInFront) *
            ((CAR_SIZE.height * 3) / distanceBetweenCars) *
            -trackSidePosition;

          this.heading.rotate(rotationFixer);
        }
        if (
          distanceBetweenCars <= CAR_SIZE.height &&
          angleBetweenHeadingAndCarInFront < 40
        ) {
          this.velocityNum *=
            (distanceBetweenCars / CAR_SIZE.height) *
            carInFront.velocityNum *
            1.2;
        }
      });

      const maxVelocity = 9;
      const percentualMaxVelocityReached = this.velocityNum / maxVelocity;

      this.velocityNum *=
        p.constrain(value / 100, 1, 2) * (1.5 - percentualMaxVelocityReached);
      this.velocityNum /= p.constrain(
        (p.abs(diffBetweenHeadings) / 4) * percentualMaxVelocityReached,
        1,
        1.5
      );
      this.velocityNum = p.constrain(this.velocityNum, 1, maxVelocity);

      this.position.add(this.heading.copy().mult(this.velocityNum));
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

  const MIN_POINTS = 25;
  const MAX_POINTS = 35;
  const MARGIN = 120;
  const MIN_DISTANCE = 110;
  const WIDTH = p.windowWidth;
  const HEIGHT = p.windowHeight;

  let kerbColorToggler = true;

  const MAX_ANGLE = 90;

  const DIFFICULTY = 0.1;
  const MAX_DISPLACEMENT = 80;

  const SPLINE_POINTS_COUNT = 1000;

  const N_CHECKPOINTS = 10;

  const TRACK_WIDTH = 40;

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

  const TRACK_ASPHALT_COLOR = p.color(50, 48, 42);
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
    carsForFaceStats: Car[],
    size: { width: number; height: number },
    position: Point
  ) => {
    const partHeight = size.height / (carsForFaceStats.length + 1);
    surface.push();
    surface.noStroke();

    // table background
    surface.fill(0, 0, 0, 100);
    surface.rect(position.x, position.y + partHeight, size.width, size.height);

    // header
    surface.image(
      audioRacingLogo,
      position.x,
      position.y,
      size.width,
      partHeight
    );

    const carStatSize = {
      width: size.width - size.width / 6,
      height: partHeight - partHeight / 4,
      widthOffset: size.width / 12,
      heightOffset: partHeight / 8,
    };

    for (let i = 0; i < carsForFaceStats.length; i++) {
      const car = carsForFaceStats[i];
      const partPosition = {
        x: position.x + carStatSize.widthOffset,
        y: position.y + partHeight * (i + 1) + carStatSize.heightOffset,
      };
      surface.fill(car.color);
      surface.rect(
        partPosition.x,
        partPosition.y,
        carStatSize.width,
        carStatSize.height
      );
      surface.fill(255);
      surface.textSize(carStatSize.height / 4);
      surface.textAlign(p.CENTER, p.CENTER);
      surface.text(
        `${i + 1}.   Lap: ${car.lapCount} ${
          car.bestLapTime !== Infinity
            ? ` - Best: ${car.bestLapTime.toFixed(2)}ms`
            : ""
        }`,
        partPosition.x + carStatSize.width / 2,
        partPosition.y + carStatSize.height / 2
      );
    }
  };

  const getColorPalleteFromImage = (image: p5.Image, numOfColors: number) => {
    const colors: {
      color: [r: number, g: number, b: number];
      amount: number;
    }[] = [];
    image.loadPixels();

    for (let j = 0; j < image.pixels.length; j += 64) {
      let r = image.pixels[j];
      let g = image.pixels[j + 1];
      let b = image.pixels[j + 2];

      let temp = colors.find((element) => {
        return (
          element.color[0] == r &&
          element.color[1] == g &&
          element.color[2] == b
        );
      });

      if (!temp) {
        colors.push({ color: [r, g, b], amount: 1 });
      } else {
        temp.amount += 1;
      }
      colors.sort((a, b) => b.amount - a.amount);
    }
    return colors
      .filter((_, index) => index < numOfColors)
      .map((color) => p.color(color.color[0], color.color[1], color.color[2]));
  };

  const createBackground = (surface: p5.Graphics) => {
    const colorPallete = getColorPalleteFromImage(albumCover, 5);

    surface.angleMode(p.DEGREES);
    const angle = p.random(35, 55);
    surface.translate(surface.width / 2, surface.height / 2);
    surface.rotate(angle);
    surface.translate(-surface.width / 2, -surface.height / 2);

    const numOfStrikes = 50;
    surface.noStroke();
    surface.background(p.random(colorPallete));
    for (let i = 0; i < numOfStrikes; i++) {
      surface.push();
      surface.stroke(p.color(p.random(colorPallete)));

      surface.strokeWeight(p.random(1, 3));
      const lineLength = -p.random(30, 100);
      const noiseVal = p.noise(i / 10);
      surface.translate(p.width * noiseVal, p.height * noiseVal);
      surface.line(0, 0, 0, lineLength);
      surface.pop();
    }
    return surface;
  };

  p.preload = () => {
    audioRacingLogo = p.loadImage("/assets/audio-racing-logo.png", (im) =>
      console.log(im.width)
    );

    albumCover = p.loadImage(`/album-cover/${albumCoverUri}`, (im) =>
      console.log(im.width)
    );
  };

  p.setup = async () => {
    p.createCanvas(WIDTH, HEIGHT);
    trackBuffer = p.createGraphics(WIDTH, HEIGHT);
    trackBuffer.background(0, 0, 0, 0);
    trackBuffer.angleMode(p.DEGREES);
    backgroundBuffer = createBackground(p.createGraphics(WIDTH, HEIGHT));
    p.image(albumCover, 0, 0, 150, 150);
    console.log("chuj");

    // create background

    if (!backgroundBuffer) {
      console.error("Background couldn't be created!");
    }

    // generate the track skeleton
    const points = random_points();

    const convexHullRaw = hull(
      points.map((point) => [point.x, point.y]),
      420
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

    for (let i = 0; i < 3; i++) {
      CARS.push(
        new Car(
          carInitPositions[i].position,
          carInitPositions[i].heading,
          { low: i * 10, high: (i + 1) * 10 },
          p.color(i === 2 ? 255 : 0, i === 1 ? 255 : 0, i === 0 ? 255 : 0)
        )
      );
    }

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
    console.log(trackObjects);
    p.frameRate(60);

    carRaceStats = Array.from(CARS);

    // setting race start time
    raceStartTimestamp = p.millis();

    audioInput = new p5.AudioIn();
    const virtualInputIndex: number = await audioInput
      .getSources()
      .then((devices: InputDeviceInfo[]) =>
        devices.findIndex((dev) => dev.label.includes("VoiceMeeter Output"))
      );

    if (!virtualInputIndex || isNaN(virtualInputIndex)) {
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
    const spectrum: number[] = fft.analyze(16);
    console.log(spectrum);
    const firstNonZeroIndex = spectrum.findIndex((x) => x !== 0);
    let lastNonZeroIndex;
    for (let i = spectrum.length - 1; i > 2; i--) {
      if (spectrum.at(i) !== 0) {
        lastNonZeroIndex = i + 1;
        break;
      }
    }
    const audioSpectrum = spectrum.slice(firstNonZeroIndex, lastNonZeroIndex);
    const audioPartSize = Math.floor(audioSpectrum.length / CARS.length);

    // drawing background
    p.image(backgroundBuffer, 0, 0);
    // placing generated track
    p.image(trackBuffer, 0, 0);

    // rendering track objects
    let carCounter = 0;
    trackObjects.forEach((object) => {
      if (object.type === "car") {
        const car = object.car;
        p.push();
        p.angleMode(p.DEGREES);
        car.move(
          audioSpectrum.slice(
            carCounter * audioPartSize,
            (carCounter + 1) * audioPartSize
          ),
          TRACK_POINT_VECTORS
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
    carRaceStats.sort((a, b) =>
      a.lapCount - b.lapCount === 0
        ? a.prevClosestPointIndex - b.prevClosestPointIndex
        : a.lapCount - b.lapCount
    );
    drawRaceStatsTable(
      p,
      carRaceStats,
      { width: 300, height: (CARS.length + 1) * 100 },
      { x: 0, y: 0 }
    );
    trackObjects.sort((a, b) => a.indexInTrack - b.indexInTrack);
  };
};
