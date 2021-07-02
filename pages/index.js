import Link from "next/link";
import styles from "../styles/Home.module.css";

export const Home = () => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.title}>
          <h1>Inside Looking Out</h1>
          <Link href="/main" passHref>
            <a>Click to play</a>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
