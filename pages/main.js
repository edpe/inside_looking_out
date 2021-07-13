import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import * as Tone from "tone";

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
  cumulativeCases: "cumCasesByPublishDate",
  dailyDeaths: "newDeaths28DaysByPublishDate",
  cumulativeDeaths: "cumDeaths28DaysByPublishDate",
  firstVaccinationsDaily: "newPeopleVaccinatedFirstDoseByPublishDate",
  firstVaccinationsCumulative: "cumPeopleVaccinatedFirstDoseByPublishDate",
  secondVaccinationsDaily: "newPeopleVaccinatedSecondDoseByPublishDate",
  secondVaccinationsCumulative: "cumPeopleVaccinatedSecondDoseByPublishDate",
};

const apiParams = {
  filters: filters.join(";"),
  structure: JSON.stringify(structure),
};

export const Main = () => {
  const [coronaStats, setCoronaStats] = useState(null);
  const droneSynthA = new Tone.Synth({
    oscillator: {
      type: "sine",
    },
    envelope: {
      attack: 2,
      decay: 0.1,
      sustain: 0.3,
      release: 2,
    },
  }).toDestination();
  const droneSynthB = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 2,
      decay: 0.1,
      sustain: 0.3,
      release: 2,
    },
  });
  const droneSynthC = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 2,
      decay: 0.1,
      sustain: 0.3,
      release: 2,
    },
  });
  const droneSynthD = new Tone.Synth({
    oscillator: {
      type: "triangle",
    },
    envelope: {
      attack: 2,
      decay: 0.1,
      sustain: 0.3,
      release: 2,
    },
  });
  const droneSynthE = new Tone.Synth({
    oscillator: {
      type: "sine",
    },
    envelope: {
      attack: 2,
      decay: 0.1,
      sustain: 0.3,
      release: 2,
    },
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
    console.log(Tone.getContext());
    if (typeof window !== "undefined") {
      // play audio on user interaction, due to Chrome policy not allowing autoplay
      document.addEventListener("click", playAudio);

      const playAudio = () => {
        document.getElementById("audio").play();
        document.removeEventListener("click", playAudio);
      };
    }
    return () => {
      droneSynthA.triggerRelease();
      droneSynthB.triggerRelease();
      droneSynthC.triggerRelease();
      droneSynthD.triggerRelease();
      droneSynthE.triggerRelease();
    };
  });

  useEffect(() => {
    getData(apiParams);
  }, [apiParams]);

  const sketch = (p5) => {
    let img;
    let count = coronaStats.data.length - 1;
    let reverb;
    let distortion;

    let droneBPlaying;
    let droneCPlaying;
    let droneDPlaying;
    let droneEPlaying;

    const isMobile = p5.windowWidth <= 400;
    let mobileImageOffset;

    p5.preload = () => {
      img = p5.loadImage("/window.jpg");
    };

    p5.setup = () => {
      reverb = new Tone.Reverb(3);
      distortion = new Tone.Distortion(0.5);

      droneSynthA.triggerAttack("C2");

      droneSynthA.chain(distortion, reverb, Tone.Destination);
      droneSynthB.chain(distortion, reverb, Tone.Destination);
      droneSynthC.chain(distortion, reverb, Tone.Destination);
      droneSynthD.chain(distortion, reverb, Tone.Destination);
      droneSynthE.chain(distortion, reverb, Tone.Destination);

      if (isMobile) {
        p5.createCanvas(p5.windowWidth, p5.windowHeight);
        img.resize(p5.windowWidth, p5.windowWidth * (1000 / 750));
      } else {
        p5.createCanvas(750, 1000);
        img.resize(750, 1000);
      }
      img.loadPixels();
      p5.frameRate(10);
      mobileImageOffset = (p5.windowHeight - p5.windowWidth * (1000 / 750)) / 2;
    };

    p5.draw = () => {
      // show lines over image for cases
      if (count > 0) {
        p5.background(40);

        p5.image(img, 0, isMobile ? mobileImageOffset : 0);

        for (
          let i = 0;
          i < coronaStats.data[count].dailyCases / (isMobile ? 40 : 10);
          i++
        ) {
          let xPos = p5.random(img.width, 0);
          p5.line(xPos, 0, xPos, isMobile ? p5.windowHeight : img.height);
        }

        if (coronaStats.data[count].dailyCases > 1000) {
          if (!droneBPlaying) {
            droneSynthB.triggerAttack("Eb2");
            droneBPlaying = true;
            // console.log("start drone b");
          }
        } else {
          droneSynthB.triggerRelease();
          droneBPlaying = false;
          // console.log("strop drone b");
        }

        if (coronaStats.data[count].dailyCases > 5000) {
          if (!droneCPlaying) {
            droneSynthC.triggerAttack("G3");
            droneCPlaying = true;
            // ("start drone c");
          }
        } else {
          droneSynthC.triggerRelease();
          droneCPlaying = false;
          // console.log("strop drone c");
        }

        if (coronaStats.data[count].dailyCases > 18000) {
          if (!droneDPlaying) {
            droneSynthD.triggerAttack("Bb3");
            droneDPlaying = true;
            // ("start drone d");
          }
        } else {
          droneSynthD.triggerRelease();
          droneDPlaying = false;
          // console.log("strop drone d");
        }

        if (coronaStats.data[count].dailyCases > 22000) {
          if (!droneEPlaying) {
            droneSynthE.triggerAttack("C6");
            droneEPlaying = true;
            // ("start drone e");
          }
        } else {
          droneSynthE.triggerRelease();
          droneEPlaying = false;
          // console.log("strop drone e");
        }

        // turns a random pixel white per death
        for (let i = 0; i < coronaStats.data[count].dailyDeaths; i++) {
          let randomPixel = Math.floor(p5.random(0, img.pixels.length));
          //todo refactor
          img.pixels[randomPixel] = 255;
          img.pixels[randomPixel + 1] = 255;
          img.pixels[randomPixel + 2] = 255;
          img.pixels[randomPixel + 3] = 255;
        }
      } else {
        droneSynthA.triggerRelease();
        droneSynthB.triggerRelease();
        droneSynthC.triggerRelease();
        droneSynthD.triggerRelease();
        droneSynthE.triggerRelease();
      }

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

  return (
    <div className={styles.container}>
      <P5comp sketch={sketch} />
    </div>
  );
};

export default Main;

// todo:
// break code into functions? more readable?
// tone js cleanup - on component unmount do Tone.context.dispose()
// Add text that shows the date and cum cases and cum deaths
// refactor p5 code to use map for synths

// Favicon
