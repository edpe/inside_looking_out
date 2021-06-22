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
    let i = 502;

    p5.preload = () => {
      img = p5.loadImage("/window.jpg");
    };

    p5.setup = () => {
      p5.createCanvas(img.width, p5.windowHeight);
      p5.background(220, 100);
      img.resize(750, 1000);
      img.loadPixels();
      // p5.frameRate(25);
    };

    p5.draw = () => {
      // show image
      p5.image(img, 0, 0);

      // show lines over image for cases
      if (i < coronaStats.data.length && i > 0) {
        for (let j = 0; j < coronaStats.data[i].dailyCases / 20; j++) {
          let xPos = p5.random(img.width, 0);
          p5.line(xPos, 0, xPos, p5.windowHeight);
        }
        // turns a random pixel white per death
        for (let j = 0; j < coronaStats.data[i].cumulativeDeaths; j++) {
          let randomPixel = Math.floor(p5.random(0, img.pixels.length));
          img.pixels[randomPixel] = 255;
          img.pixels[randomPixel + 1] = 255;
          img.pixels[randomPixel + 2] = 255;
          img.pixels[randomPixel + 3] = 255;
          console.log(coronaStats.data[i].date);
        }
        i--;
      }
      img.updatePixels();
    };
  };

  if (!coronaStats) {
    return <p>Loading data</p>;
  }

  return <P5comp sketch={sketch} />;
};

export default Home;

// Fix wierd looping
// Only make the circle of the outside world change colour with number of deaths
// Add text that shows the date and cum cases and cum deaths
// Connect to vercel
