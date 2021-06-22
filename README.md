# Inside Looking Out

A [P5.js](https://p5js.org/) project that uses live [Coronavirus data](https://coronavirus.data.gov.uk/details/developers-guide) to process an image over time

Inside Looking Out steps through recorded statistics for each day of the Coronavirus pandemic in the UK. Each frame obscures a photograph of a window with a horizontal line representing each new case registered on that day. As the frames advance, a pixel is removed to represent each death, eroding the photograph until a final static image is revealed representing yesterdays cases and cumulative deaths.

<img width="501" alt="2021-06-22" src="https://user-images.githubusercontent.com/32434854/123002435-d6b43480-d3a9-11eb-8c41-e8fd305678ff.png">


## Getting Started

```bash
npm install
npm run dev
# or
yarn
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
