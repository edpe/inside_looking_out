import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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

export const Home = () => {
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
    getData(apiParams);
  }, [apiParams]);

  const sketch = (p5) => {
    let img;
    let count = coronaStats.data.length - 1;
    let vaccLineXPosCentre;
    let vaccMaxLineHeight;

    p5.preload = () => {
      img = p5.loadImage("/window.jpg");
    };

    p5.setup = () => {
      p5.createCanvas(img.width, img.height);
      p5.background(220, 100);
      img.resize(750, 1000);
      img.loadPixels();
      p5.frameRate(25);
      vaccLineXPosCentre = [
        img.width * 0,
        img.width * 0.2,
        img.width * 0.5,
        img.width * 0.8,
      ];
      vaccMaxLineHeight = [200, 400, 300, 350];
    };

    p5.draw = () => {
      // show lines over image for cases
      if (count > 0) {
        p5.image(img, 0, 0);

        for (let i = 0; i < coronaStats.data[count].dailyCases / 10; i++) {
          let xPos = p5.random(img.width, 0);
          p5.stroke(0);
          p5.line(xPos, 0, xPos, img.height);
        }

        for (
          let i = 0;
          i < coronaStats.data[count].firstVaccinationsCumulative / 50000;
          i++
        ) {
          let randomChoice = Math.floor(p5.random(0, 4));
          let xPos = p5.random(img.width, 0);
          let xPosDiff = Math.abs(vaccLineXPosCentre[randomChoice] - xPos);
          let lineHeight =
            vaccMaxLineHeight[randomChoice] - xPosDiff * p5.random(0.5, 1.5);
          p5.stroke(
            p5.random(250, 255),
            p5.random(220, 240),
            p5.random(230, 250)
          );
          p5.line(xPos, img.height, xPos, img.height - lineHeight);
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

export default Home;

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
