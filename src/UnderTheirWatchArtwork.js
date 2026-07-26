import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

import Placard from "./Placard";
import styles from "../styles/Main.module.css";

const P5comp = dynamic(
  () => import("react-p5-wrapper").then((module) => module.ReactP5Wrapper),
  { ssr: false }
);

const PORTRAIT_RATIO = 3 / 4;
const SCALE = ["C2", "D2", "F2", "G2", "A2", "C3", "D3", "F3"];

const fitImageToPortrait = (target, source) => {
  const sourceRatio = source.width / source.height;

  let sx = 0;
  let sy = 0;
  let sw = source.width;
  let sh = source.height;

  if (sourceRatio > PORTRAIT_RATIO) {
    sw = source.height * PORTRAIT_RATIO;
    sx = (source.width - sw) / 2;
  } else {
    sh = source.width / PORTRAIT_RATIO;
    sy = (source.height - sh) / 2;
  }

  target.clear();
  target.image(source, 0, 0, target.width, target.height, sx, sy, sw, sh);
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const UnderTheirWatchArtwork = () => {
  const [artworkData, setArtworkData] = useState(null);
  const [dataError, setDataError] = useState(null);
  const [userInteractionComplete, setUserInteractionComplete] = useState(false);
  const synthRef = useRef(null);

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const getData = async () => {
      try {
        const { data } = await axios.get("/api/under-their-watch", {
          timeout: 30000,
        });

        if (!isCancelled) {
          setArtworkData(data);
          setDataError(null);
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setDataError(
            "Live ONS inflation, earnings and household cost data is currently unavailable."
          );
        }
      }
    };

    getData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const sketch = (p5) => {
    const portraitImages = {};
    const portraitBuffers = new Map();
    const archiveBuffers = new Map();
    const portraitSourceSize = { width: 360, height: 480 };
    let frameIndex = 0;
    let currentFigureKey = artworkData.figures[0].key;
    let lastFrame = null;
    let lastPlayedDate = null;

    const getFigureIndex = (figureKey) =>
      artworkData.figures.findIndex((figure) => figure.key === figureKey);

    const drawEmptySlot = (x, y, width, height) => {
      p5.noFill();
      p5.stroke(80);
      p5.strokeWeight(1);
      p5.rect(x, y, width, height);
    };

    const createArchiveBuffer = (figureKey) => {
      if (archiveBuffers.has(figureKey)) {
        return archiveBuffers.get(figureKey);
      }

      const sourceBuffer = portraitBuffers.get(figureKey);
      const archiveBuffer = p5.createGraphics(sourceBuffer.width, sourceBuffer.height);
      archiveBuffer.image(sourceBuffer, 0, 0, sourceBuffer.width, sourceBuffer.height);
      archiveBuffer.filter(p5.GRAY);
      archiveBuffers.set(figureKey, archiveBuffer);
      return archiveBuffer;
    };

    const applyFrameEffects = (buffer, frame) => {
      const inflationLines = Math.max(1, Math.round(frame.cpi * 2));
      const wageSlices = Math.max(0, Math.round(frame.wageSqueeze * 2));
      const erosionBursts = Math.max(0, Math.round((frame.hci || 0) * 0.75));

      buffer.push();
      buffer.stroke(255, 255, 255, clamp(18 + frame.cpi * 6, 18, 70));
      buffer.strokeWeight(1);
      for (let index = 0; index < inflationLines; index += 1) {
        const xPos = p5.random(0, buffer.width);
        buffer.line(xPos, 0, xPos, buffer.height);
      }
      buffer.pop();

      for (let index = 0; index < wageSlices; index += 1) {
        const sliceHeight = Math.max(6, Math.floor(p5.random(8, 28)));
        const yPos = Math.max(0, Math.floor(p5.random(0, buffer.height - sliceHeight)));
        const offset = Math.floor(
          p5.random(-12 - frame.wageSqueeze * 3, 12 + frame.wageSqueeze * 3)
        );

        buffer.copy(
          buffer,
          0,
          yPos,
          buffer.width,
          sliceHeight,
          offset,
          yPos,
          buffer.width,
          sliceHeight
        );
      }

      buffer.noStroke();
      for (let index = 0; index < erosionBursts; index += 1) {
        const width = p5.random(8, 26);
        const height = p5.random(8, 26);
        const xPos = p5.random(0, Math.max(1, buffer.width - width));
        const yPos = p5.random(0, Math.max(1, buffer.height - height));
        buffer.fill(255, 255, 255, clamp(30 + (frame.hci || 0) * 10, 30, 110));
        buffer.rect(xPos, yPos, width, height);
      }
    };

    const layout = () => {
      const padding = p5.windowWidth <= 700 ? 12 : 24;
      const gutter = p5.windowWidth <= 700 ? 8 : 14;
      const availableHeight = p5.height - padding * 2;
      const sideWidth = Math.min(
        124,
        ((availableHeight - gutter * 3) / 4) * PORTRAIT_RATIO
      );
      const sideHeight = sideWidth / PORTRAIT_RATIO;
      const centerMaxHeight = availableHeight;
      const centerWidth = Math.min(
        centerMaxHeight * PORTRAIT_RATIO,
        p5.width - padding * 2 - sideWidth * 2 - gutter * 2
      );
      const centerHeight = centerWidth / PORTRAIT_RATIO;
      const centerX = (p5.width - centerWidth) / 2;
      const centerY = (p5.height - centerHeight) / 2;
      const leftX = padding;
      const rightX = p5.width - padding - sideWidth;

      return {
        padding,
        gutter,
        sideWidth,
        sideHeight,
        centerX,
        centerY,
        centerWidth,
        centerHeight,
        leftX,
        rightX,
      };
    };

    const playToneForFrame = (frame) => {
      if (!synthRef.current || lastPlayedDate === frame.date) {
        return;
      }

      const noteIndex = clamp(Math.round(frame.cpi), 0, SCALE.length - 1);
      const velocity = clamp(0.15 + frame.wageSqueeze * 0.04, 0.15, 0.75);
      synthRef.current.triggerAttackRelease(SCALE[noteIndex], "12n", undefined, velocity);
      lastPlayedDate = frame.date;
    };

    p5.preload = () => {
      artworkData.figures.forEach((figure) => {
        portraitImages[figure.key] = p5.loadImage(figure.image);
      });
    };

    p5.setup = () => {
      p5.createCanvas(p5.windowWidth, p5.windowHeight);
      p5.frameRate(12);
      p5.textFont("Poppins");

      artworkData.figures.forEach((figure) => {
        const buffer = p5.createGraphics(
          portraitSourceSize.width,
          portraitSourceSize.height
        );
        fitImageToPortrait(buffer, portraitImages[figure.key]);
        portraitBuffers.set(figure.key, buffer);
      });
    };

    p5.windowResized = () => {
      p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
    };

    p5.draw = () => {
      p5.background(8);

      if (frameIndex < artworkData.frames.length) {
        const frame = artworkData.frames[frameIndex];
        currentFigureKey = frame.figureKey;
        lastFrame = frame;

        applyFrameEffects(portraitBuffers.get(frame.figureKey), frame);
        playToneForFrame(frame);
        frameIndex += 1;
      } else {
        currentFigureKey = artworkData.currentFigureKey;
      }

      const metricsFrame = lastFrame || artworkData.frames[artworkData.frames.length - 1];
      const activeIndex = getFigureIndex(currentFigureKey);
      const completeFigures = artworkData.figures.slice(0, activeIndex);
      const leftFigures = completeFigures.slice(0, 4);
      const rightFigures = completeFigures.slice(4, 8);

      const {
        sideWidth,
        sideHeight,
        centerX,
        centerY,
        centerWidth,
        centerHeight,
        leftX,
        rightX,
        padding,
        gutter,
      } = layout();

      for (let index = 0; index < 4; index += 1) {
        const yPos = padding + index * (sideHeight + gutter);
        if (leftFigures[index]) {
          const archiveBuffer = createArchiveBuffer(leftFigures[index].key);
          p5.image(
            archiveBuffer,
            leftX,
            yPos,
            sideWidth,
            sideHeight
          );
        } else {
          drawEmptySlot(leftX, yPos, sideWidth, sideHeight);
        }

        if (rightFigures[index]) {
          const archiveBuffer = createArchiveBuffer(rightFigures[index].key);
          p5.image(
            archiveBuffer,
            rightX,
            yPos,
            sideWidth,
            sideHeight
          );
        } else {
          drawEmptySlot(rightX, yPos, sideWidth, sideHeight);
        }
      }

      p5.image(
        portraitBuffers.get(currentFigureKey),
        centerX,
        centerY,
        centerWidth,
        centerHeight
      );

      if (metricsFrame) {
        const statsX = centerX + centerWidth / 2;
        const statsTop = Math.max(28, centerY - (p5.windowWidth <= 700 ? 70 : 82));
        const formatMetric = (value, suffix = "") =>
          typeof value === "number" ? `${value.toFixed(1)}${suffix}` : "Not available";
        const statLines = [
          `Inflation rate: ${formatMetric(metricsFrame.cpi, "%")}`,
          `Wages behind prices: ${formatMetric(metricsFrame.wageSqueeze, " pts")}`,
          `Household costs index: ${formatMetric(metricsFrame.hci)}`,
        ];

        p5.noStroke();
        p5.fill(205);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.textSize(p5.windowWidth <= 700 ? 12 : 15);

        statLines.forEach((line, index) => {
          p5.text(line, statsX, statsTop + index * (p5.windowWidth <= 700 ? 16 : 20));
        });
      }

      const labelY = Math.min(
        p5.height - 48,
        centerY + centerHeight + (p5.windowWidth <= 700 ? 34 : 42)
      );

      p5.noStroke();
      p5.fill(255);
      p5.textAlign(p5.CENTER, p5.CENTER);
      p5.textSize(p5.windowWidth <= 700 ? 22 : 28);
      p5.text(
        artworkData.figures[activeIndex].name,
        centerX + centerWidth / 2,
        labelY
      );

      if (metricsFrame) {
        p5.fill(180);
        p5.textSize(p5.windowWidth <= 700 ? 13 : 16);
        p5.text(metricsFrame.dateLabel, centerX + centerWidth / 2, labelY + 26);
      }
    };
  };

  if (dataError) {
    return (
      <div className={styles.container}>
        <p className={styles.text}>{dataError}</p>
      </div>
    );
  }

  if (!artworkData) {
    return (
      <div className={styles.container}>
        <p className={styles.text}>Loading latest ONS data</p>
      </div>
    );
  }

  const handleClick = async () => {
    await Tone.start();

    if (!synthRef.current) {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.02,
          decay: 0.2,
          sustain: 0.15,
          release: 0.8,
        },
      });

      const reverb = new Tone.Reverb(2.5).toDestination();
      synth.connect(reverb);
      synthRef.current = synth;
    }

    setUserInteractionComplete(true);
  };

  if (!userInteractionComplete) {
    return (
      <Placard
        onClick={handleClick}
        title="Under Their Watch"
        darkMode
      >
        <p>
          Live UK inflation, earnings and household cost data are used as the
          source for this audiovisual web artwork. Each month from 2000 onwards
          is represented by a single frame, creating a sequence of political
          portraits shaped by the changing cost of ordinary life in Britain.
        </p>
        <p>
          Each political portrait begins intact. As the frames advance,
          inflation obscures the image, the gap between prices and pay distorts
          it, and rising household costs gradually erode it. When one term ends,
          that portrait is fixed in place and the next appears in the centre.
          Over time, a political frame is formed around the current figure.
        </p>
      </Placard>
    );
  }

  return (
    <div className={styles.container}>
      <P5comp sketch={sketch} />
    </div>
  );
};

export default UnderTheirWatchArtwork;