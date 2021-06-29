import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
  const [droneAPlaying, setDroneAPlaying] = useState(true);
  const [droneBPlaying, setDroneBPlaying] = useState(true);

  const [droneCPlaying, setDroneCPlaying] = useState(true);

  const [droneDPlaying, setDroneDPlaying] = useState(true);

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
    let droneSynthA;
    let droneSynthB;
    let droneSynthC;
    let droneSynthD;

    p5.preload = () => {
      img = p5.loadImage("/window.jpg");
    };

    p5.setup = () => {
      droneSynthA = new Tone.Synth({}).toDestination();
      droneSynthB = new Tone.Synth({}).toDestination();
      droneSynthC = new Tone.Synth({}).toDestination();
      droneSynthD = new Tone.Synth({}).toDestination();
      droneSynthA.triggerAttack("C2");

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
            droneSynthB.triggerAttack("G2");
            setDroneBPlaying(true);
          }
        } else {
          droneSynthB.triggerRelease();
          setDroneBPlaying(false);
        }

        if (coronaStats.data[count].dailyCases > 5000) {
          if (!droneCPlaying) {
            droneSynthC.triggerAttack("C3");
            setDroneCPlaying(true);
          }
        } else {
          droneSynthC.triggerRelease();
          setDroneCPlaying(false);
        }

        if (coronaStats.data[count].dailyCases > 20000) {
          if (!droneDPlaying) {
            droneSynthD.triggerAttack("G3");
            setDroneDPlaying(true);
          }
        } else {
          droneSynthD.triggerRelease();
          setDroneDPlaying(false);
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

// vaccines first vaccinations draw random height line at the bottom of the image maybe blue or grey/blue
// line length increases over time to draw mountain range

// second doses draw pink/purple/blue lines from the top of the image ideally avoiding the circle to look like sky

// future:
// save an image from a particular date or save final image
// add sound with tone.js
