import styles from "../styles/Placard.module.css";

const Placard = ({ onClick }) => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.main}>
          <h1 className={styles.title}>Inside Looking Out</h1>
          <div className={styles.description}>
            <p>
              Live data from the UK Government COVID-19 API is used as the
              source to create a narrative structure for this audiovisual web
              artwork. Each day of the Coronavirus pandemic in the UK is
              represented by a single frame, creating an animated film that
              tells a story about the impact of the virus on the people of the
              UK.
            </p>
            <p>
              Each frame shows a photograph of a circular window, obscured by
              vertical lines representing each new case registered on that day.
              As the frames advance, a pixel is removed to represent each death,
              eroding the photograph until a final static image is revealed
              representing cases and cumulative statistics from the previous
              day.
            </p>
            <a href="https://github.com/edpe/inside_looking_out">
              Find out more and view the project on Github
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 500 500"
                fill="white"
              >
                <path d="M0,0v512h512V0H0z M46.5,46.5h418.9v418.9H46.5V46.5z M186.2,116.4v46.5h129.5l-216,216l33.5,33.5l216-216v129.5h46.5 V116.4H186.2z" />
              </svg>
            </a>
            <button onClick={onClick} className="styles.playButtonLink">
              PLAY
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Placard;
