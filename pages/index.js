import Link from "next/link";
import styles from "../styles/Home.module.css";

export const Home = () => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.title}>
          <h1>Inside Looking Out</h1>
          <div className={styles.main}>
            <p>
              Inside Looking Out uses live data from the UK Government COVID-19
              API as a narrative structure. Each day of the Coronavirus pandemic
              in the UK is represented by a single frame, creating an animated
              film that tells a story about the impact of the virus on the
              people of the UK.
            </p>
            <p>
              Each frame shows a photograph of a circular window, obscured by
              vertical lines representing each new case registered on that day.
              As the frames advance, a pixel is removed to represent each death,
              eroding the photograph until a final static image is revealed
              representing cases and cumulative statistics from the previous
              day.
            </p>
            <a
              className={styles.inlineLink}
              href="https://github.com/edpe/inside_looking_out"
            >
              Find out more and view the project on Github
            </a>
            <Link href="/main" passHref>
              <a>PLAY</a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
