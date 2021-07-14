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

  // tone setup synths and effects
  const synthState = [
    { voice: "sine", triggerAmount: 0, note: "C2", isPlaying: true },
    { voice: "triangle", triggerAmount: 1000, note: "Eb2", isPlaying: false },
    { voice: "triangle", triggerAmount: 5000, note: "G3", isPlaying: false },
    { voice: "triangle", triggerAmount: 18000, note: "Bb2", isPlaying: false },
    { voice: "sine", triggerAmount: 22000, note: "C6", isPlaying: false },
  ];

  const synths = [];

  const reverb = new Tone.Reverb(3);
  const distortion = new Tone.Distortion(0.5);

  synthState.forEach((synthState) =>
    synths.push(
      new Tone.Synth({
        oscillator: {
          type: synthState.voice,
        },
        envelope: {
          attack: 2,
          decay: 0.1,
          sustain: 0.3,
          release: 2,
        },
      }).chain(distortion, reverb, Tone.Destination)
    )
  );

  const stopSynths = () => {
    synths.forEach((synth) => synth.triggerRelease());
  };

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
    return () => {
      stopSynths();
    };
  });

  useEffect(() => {
    getData(apiParams);
  }, [apiParams]);

  const sketch = (p5) => {
    let img;
    let count = coronaStats.data.length - 1;

    const isMobile = p5.windowWidth <= 400;
    let mobileImageOffset;

    p5.preload = () => {
      img = p5.loadImage("/window.jpg");
    };

    p5.setup = () => {
      synths[0].triggerAttack(synthState[0].note);

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

        synthState.forEach((synth, index) => {
          if (coronaStats.data[count].dailyCases > synth.triggerAmount) {
            if (!synth.isPlaying) {
              synths[index].triggerAttack(synth.note);
              synth.isPlaying = true;
            }
          } else {
            synths[index].triggerRelease();
            synth.isPlaying = false;
          }
        });

        // turns a random pixel white per death
        for (let i = 0; i < coronaStats.data[count].dailyDeaths; i++) {
          let randomPixel = Math.floor(p5.random(0, img.pixels.length));
          //todo refactor
          img.pixels[randomPixel] = 255;
          img.pixels[randomPixel + 1] = 255;
          img.pixels[randomPixel + 2] = 255;
          img.pixels[randomPixel + 3] = 255;
        }
   
        // order the date to be more readable
        let day = coronaStats.data[count].date.slice(8)
        let month = coronaStats.data[count].date.slice(5,7)
        let year = coronaStats.data[count].date.slice(0,4)
        let date = day + "-" + month + "-" + year
        
        // updates with the date 
        p5.text( date, isMobile ? p5.windowWidth - 120 : img.width - 120, isMobile ? p5.windowHeight - 20 : img.height - 20)
        p5.fill('white')
        p5.textSize(20);

      } else {
        stopSynths();
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
// Favicon
// finalise styling for index page
// make play button

// stretch - allow user to select area and filter results so they get a piece specific to their area
