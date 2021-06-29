import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import * as Tone from "tone";

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

export const InsideLookingOut = () => {
  const [coronaStats, setCoronaStats] = useState(null);

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
    let count = coronaStats.data.length - 1;
    let reverb;
    let bitCrusher;
    let distortion;
    let droneSynthA;
    let droneSynthB;
    let droneSynthC;
    let droneSynthD;
    let droneSynthE;

    let droneBPlaying;
    let droneCPlaying;
    let droneDPlaying;
    let droneEPlaying;

    p5.preload = () => {
      img = p5.loadImage("/window.jpg");
    };

    p5.setup = () => {
      reverb = new Tone.Reverb(3);
      bitCrusher = new Tone.BitCrusher(8);
      distortion = new Tone.Distortion(0.5);

      droneSynthA = new Tone.Synth({
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
      droneSynthB = new Tone.Synth({
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
      droneSynthC = new Tone.Synth({
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
      droneSynthD = new Tone.Synth({
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
      droneSynthE = new Tone.Synth({
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
      droneSynthA.triggerAttack("C2");

      droneSynthA.chain(bitCrusher, distortion, reverb, Tone.Destination);
      droneSynthB.chain(bitCrusher, distortion, reverb, Tone.Destination);
      droneSynthC.chain(bitCrusher, distortion, reverb, Tone.Destination);
      droneSynthD.chain(bitCrusher, distortion, reverb, Tone.Destination);
      droneSynthE.chain(bitCrusher, distortion, reverb, Tone.Destination);

      p5.createCanvas(750, 1000);
      p5.background(220, 100);
      img.resize(750, 1000);
      img.loadPixels();
      p5.frameRate(10);
    };

    p5.draw = () => {
      // show lines over image for cases
      if (count > 0) {
        p5.image(img, 0, 0);

        for (let i = 0; i < coronaStats.data[count].dailyCases / 10; i++) {
          let xPos = p5.random(img.width, 0);
          p5.line(xPos, 0, xPos, img.height);
        }

        if (coronaStats.data[count].dailyCases > 1000) {
          if (!droneBPlaying) {
            droneSynthB.triggerAttack("Eb2");
            droneBPlaying = true;
          }
        } else {
          droneSynthB.triggerRelease();
          droneBPlaying = false;
        }

        if (coronaStats.data[count].dailyCases > 5000) {
          if (!droneCPlaying) {
            droneSynthC.triggerAttack("G3");
            droneCPlaying = true;
          }
        } else {
          droneSynthC.triggerRelease();
          droneCPlaying = false;
        }

        if (coronaStats.data[count].dailyCases > 18000) {
          if (!droneDPlaying) {
            droneSynthD.triggerAttack("Bb3");
            droneDPlaying = true;
          }
        } else {
          droneSynthD.triggerRelease();
          droneDPlaying = false;
        }

        if (coronaStats.data[count].dailyCases > 22000) {
          if (!droneEPlaying) {
            droneSynthE.triggerAttack("C6");
            droneEPlaying = true;
          }
        } else {
          droneSynthE.triggerRelease();
          droneEPlaying = false;
        }

        console.log(coronaStats.data[count].dailyCases);

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
    return <p>Loading data</p>;
  }

  return <P5comp sketch={sketch} />;
};

export default InsideLookingOut;

// todo:
// Only make the circle of the outside world change colour with number of deaths
// Add text that shows the date and cum cases and cum deaths
// Favicon
// landing page with some blurb
// style page: desktop - image in the centre, mobile - image only

// future:
// save an image from a particular date or save final image
// add sound with tone.js
