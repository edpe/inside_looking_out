import Link from "next/link";
import Head from "next/head";

import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Ed Perkins Data Art Gallery</title>
      </Head>
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Ed Perkins</p>
          <h1 className={styles.title}>Data Art Gallery</h1>
          <p className={styles.intro}>
            A small gallery of UK data-driven artworks. Enter the original COVID
            piece or the new portrait work shaped by inflation, earnings and
            household cost data.
          </p>
        </header>

        <section className={styles.grid}>
          <article className={styles.card}>
            <div>
              <h2 className={styles.cardTitle}>Inside Looking Out</h2>
              <p className={styles.cardCopy}>
                Daily UK COVID-19 data obscures and erodes a single photograph,
                turning the pandemic into a time-based audiovisual record.
              </p>
            </div>
            <div className={styles.cardFooter}>
              <Link className={styles.link} href="/inside-looking-out">
                Open artwork
              </Link>
            </div>
          </article>

          <article className={styles.card}>
            <div>
              <h2 className={styles.cardTitle}>Under Their Watch</h2>
              <p className={styles.cardCopy}>
                Monthly UK inflation, earnings and household cost data act upon
                a sequence of political portraits, leaving a damaged frame of
                recent leadership around the current figure.
              </p>
            </div>
            <div className={styles.cardFooter}>
              <Link className={styles.link} href="/under-their-watch">
                Open artwork
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
