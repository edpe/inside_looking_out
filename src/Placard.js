import styles from "../styles/Placard.module.css";

const Placard = ({ onClick, title, link, linkText, children, darkMode }) => {
  return (
    <>
      <div
        className={darkMode ? styles.container_dark : styles.container_light}
      >
        <div className={styles.main}>
          <h1 className={darkMode ? styles.title_dark : styles.title_light}>
            {title}
          </h1>
          <div
            className={
              darkMode ? styles.description_dark : styles.description_light
            }
          >
            {children}
            {link && (
              <a href={link}>
                {linkText}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 500 500"
                  fill="currentColor"
                >
                  <path d="M0,0v512h512V0H0z M46.5,46.5h418.9v418.9H46.5V46.5z M186.2,116.4v46.5h129.5l-216,216l33.5,33.5l216-216v129.5h46.5 V116.4H186.2z" />
                </svg>
              </a>
            )}
            <button
              onClick={onClick}
              className={
                darkMode ? styles.playButton_dark : styles.playButton_light
              }
            >
              PLAY
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Placard;
