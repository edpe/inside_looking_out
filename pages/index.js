import axios from "axios";
import dynamic from "next/dynamic";

const P5comp = dynamic(() => import("react-p5-wrapper"), { ssr: false });

const getData = async (queries) => {
  const endpoint = "https://api.coronavirus.data.gov.uk/v1/data";

  const { data, status, statusText } = await axios.get(endpoint, {
    params: queries,
    timeout: 10000,
  });

  if (status >= 400) throw new Error(statusText);

  return data;
}; // getData

const main = async () => {
  const AreaType = "overview",
    AreaName = "united kingdom";

  const filters = [`areaType=${AreaType}`, `areaName=${AreaName}`],
    structure = {
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
      secondVaccinationsCumulative:
        "cumPeopleVaccinatedSecondDoseByPublishDate",
    };

  const apiParams = {
    filters: filters.join(";"),
    structure: JSON.stringify(structure),
  };

  const result = await getData(apiParams);

  const ourData = result.data;
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

export default function Home(ourData) {
  const sketch = (p5, ourData) => {
    let img;
    let ourImportedData = ourData;

    p5.preload = () => {
      img = p5.loadImage("/Boris.jpg");
    };

    p5.setup = () => {
      p5.createCanvas(p5.windowWidth, p5.windowHeight);
      p5.background(220, 100);
      img.resize(750, 1000);
      p5.image(img, 0, 0);
    };

    p5.draw = (ourImportedData) => {
      let i = 0;
      for (let j = 0; j < ourImportedData[i].dailyCases; j++) {
        let xPos = p5.random(p5.windowWidth, 0);
        p5.line(xPos, 0, xPos, p5.windowHeight);
      }
      i++;
    };
  };

  return <P5comp sketch={sketch} />;
}
