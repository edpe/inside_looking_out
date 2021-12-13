import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { render } from "react-dom";
import * as Tone from "tone";
import Placard from "../src/Placard";

import styles from "../styles/Main.module.css";

const P5comp = dynamic(() => import("react-p5-wrapper"), { ssr: false });

const AreaType = "overview";

const AreaName = "united kingdom";

const filters = [`areaType=${AreaType}`, `areaName=${AreaName}`];

const structure = {
  date: "date",
  name: "areaName",
  code: "areaCode",
  dailyCases: "newCasesByPublishDate",
  dailyDeaths: "newDeaths28DaysByPublishDate",
};

const apiParams = {
  filters: filters.join(";"),
  structure: JSON.stringify(structure),
};

export const Main = () => {
  const [coronaStats, setCoronaStats] = useState(null);
  const [userInteractionComplete, setUserInteractionComplete] = useState(false);

  // tone setup synths and effects
  const synthStates = [
    {
      voice: "sine",
      triggerAmount: 0,
      notes: ["A2"],
      isPlaying: true,
      synth: {},
      sequence: {},
    },
    {
      voice: "triangle",
      triggerAmount: 1000,
      notes: ["A3", "B3", "C4", "D4"],
      isPlaying: false,
      synth: {},
      sequence: {},
    },
    {
      voice: "triangle",
      triggerAmount: 5000,
      notes: ["A4", "B4", "C5", "D5"],
      isPlaying: false,
      synth: {},
      sequence: {},
    },
    {
      voice: "triangle",
      triggerAmount: 18000,
      notes: ["B5", "C6", "A5", "C6"],
      isPlaying: false,
      synth: {},
      sequence: {},
    },
    {
      voice: "sine",
      triggerAmount: 22000,
      notes: ["A6", "B6", "C7", "D7"],
      isPlaying: false,
      synth: {},
      sequence: {},
    },
  ];

  let synths = [];

  useEffect(() => {
    const reverb = new Tone.Reverb(3);
    const distortion = new Tone.Distortion(0.1);

    synthStates.forEach(
      (synthState) =>
        (synthState.synth = new Tone.Synth({
          oscillator: {
            type: synthState.voice,
          },
          envelope: {
            attack: 2,
            decay: 0.1,
            sustain: 0.3,
            release: 2,
          },
        }).chain(distortion, reverb, Tone.Destination))
    );

    synthStates.forEach(
      (synthState) =>
        (synthState.sequence = new Tone.Sequence((time, note) => {
          synthState.synth.triggerAttackRelease(note, 0.1, time);
        }, synthState.notes))
    );

    return () => {
      synthStates.forEach((synthState) => synthState.synth.triggerRelease());
    };
  });

  const getData = async (queries) => {
    const endpoint = "https://api.coronavirus.data.gov.uk/v1/data";

    const { data, status, statusText } = await axios.get(endpoint, {
      params: queries,
      timeout: 10000,
    });

    if (status >= 400) throw new Error(statusText);
    return setCoronaStats(data);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // play audio on user interaction, due to Chrome policy not allowing autoplay
      document.addEventListener("click", playAudio);

      const playAudio = () => {
        document.getElementById("audio").play();
        document.removeEventListener("click", playAudio);
      };
    }
  });

  useEffect(() => {
    getData(apiParams);
  }, [apiParams]);

  const sketch = (p5) => {
    let img;
    let mobileImageOffset;
    let isMobile = p5.windowWidth <= 700;
    let count = coronaStats.data.length - 1;
    let imageStartX;
    let imageEndX;

    p5.preload = () => {
      img = p5.loadImage("/window.jpg");
    };
    Tone.Transport.start();
    // synthStates[0].sequence.start(0);
    p5.setup = () => {
      if (isMobile) {
        p5.createCanvas(p5.windowWidth, p5.windowHeight);
        img.resize(p5.windowWidth, p5.windowWidth * (1000 / 750));
      } else {
        p5.createCanvas(p5.windowWidth, p5.windowHeight);
        img.resize(p5.windowHeight * (750 / 1000), p5.windowHeight);
      }
      img.loadPixels();
      p5.frameRate(10);
      mobileImageOffset = (p5.windowHeight - p5.windowWidth * (1000 / 750)) / 2;

      imageStartX = p5.windowWidth / 2 - img.width / 2;
      imageEndX = p5.windowWidth / 2 + img.width / 2;
    };

    p5.draw = () => {
      if (count > 0) {
        p5.background(20);

        p5.image(
          img,
          isMobile ? 0 : imageStartX,
          isMobile ? mobileImageOffset : 0
        );
        // show lines over image for cases

        for (
          let i = 0;
          i < coronaStats.data[count].dailyCases / (isMobile ? 40 : 10);
          i++
        ) {
          let xPos = p5.random(
            isMobile ? img.width : imageStartX,
            isMobile ? 0 : imageEndX
          );
          p5.line(xPos, 0, xPos, isMobile ? p5.windowHeight : img.height);
        }

        // turns a random pixel white per death
        for (let i = 0; i < coronaStats.data[count].dailyDeaths; i++) {
          let randomPixel = Math.floor(p5.random(0, img.pixels.length));
          //todo refactor as random pixel isn't necessarily the first in the series
          img.pixels[randomPixel] = 255;
          img.pixels[randomPixel + 1] = 255;
          img.pixels[randomPixel + 2] = 255;
          img.pixels[randomPixel + 3] = 255;
        }

        // starts synth playing when cases reach the specified trigger level
        synthStates.forEach((synthState) => {
          if (coronaStats.data[count].dailyCases > synthState.triggerAmount) {
            if (!synthState.isPlaying) {
              synthState.sequence.start(0);
              synthState.isPlaying = true;
            }
          } else {
            synthState.sequence.stop(0);
            synthState.isPlaying = false;
          }
        });

        // order the date to be more readable
        let day = coronaStats.data[count].date.slice(8);
        let month = coronaStats.data[count].date.slice(5, 7);
        let year = coronaStats.data[count].date.slice(0, 4);
        let date = day + "-" + month + "-" + year;

        // updates with the date
        p5.text(
          date,
          isMobile ? p5.windowWidth - 120 : imageEndX - 120,
          isMobile ? p5.windowHeight - 40 : img.height - 20
        );
        p5.fill("white");
        p5.textSize(20);

        // stops synths  and ensures the final image is left on the screen
      } else {
        synthStates.forEach((synthState) => synthState.sequence.stop());
      }
      // move backwards through the data - begins at the last entry and moves forwards through time, finally ending on yesterdday's data (most recent stats)
      count--;
      img.updatePixels();
    };
  };

  if (!coronaStats) {
    return (
      <div className={styles.container}>
        <p className={styles.text}>Loading data</p>
      </div>
    );
  }

  const handleClick = () => {
    Tone.start();
    setUserInteractionComplete(true);
  };

  if (!userInteractionComplete) {
    return (
      <Placard
        onClick={handleClick}
        link="https://github.com/edpe/inside_looking_out"
        title="Inside Looking Out"
        linkText=" Find out more and view the project on Github"
        darkMode
      >
        <p>
          Live data from the UK Government COVID-19 API is used as the source to
          create a narrative structure for this audiovisual web artwork. Each
          day of the Coronavirus pandemic in the UK is represented by a single
          frame, creating an animated film that tells a story about the impact
          of the virus on the people of the UK.
        </p>
        <p>
          Each frame shows a photograph of a circular window, obscured by
          vertical lines representing each new case registered on that day. As
          the frames advance, a pixel is removed to represent each death,
          eroding the photograph until a final static image is revealed
          representing cases and cumulative statistics from the previous day.
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

export default Main;

// tests
