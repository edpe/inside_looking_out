# Inside Looking Out

A [P5.js](https://p5js.org/) project that uses live [Coronavirus data](https://coronavirus.data.gov.uk/details/developers-guide) to process an image over time. Sound is made using the [Tone.js](https://tonejs.github.io/) web audio framework.

Inside Looking Out uses live data from the UK Governments COVID-19 API as a narrative structure. Each day of the Coronavirus pandemic in the UK is represented by a single animation frame, creating an animated film that tells a story about the impact of the virus on the people of the UK.
              
Each frame shows a photograph of a circular window, obscured by horizontal lines representing each new case registered on that
day. As the frames advance, a pixel is removed to represent each death, eroding the photograph until a final static image is revealed representing cases and cumulative statistics from the previous day.

![image](https://user-images.githubusercontent.com/32434854/124262176-9da65d80-db29-11eb-81ef-ebef16b74a03.png)


## Getting Started

```bash
npm install
npm run dev
# or
yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Or see it live [here](https://inside-looking-out.vercel.app/)
