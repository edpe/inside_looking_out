import Head from "next/head";

import "../styles/globals.css";

const metaData = {
  name: "Inside Looking Out",
  description:
    "A pair of UK data-driven audiovisual artworks built from live public datasets.",
  image: "https://inside-looking-out.vercel.app/img/meta-image.png",
  url: "https://inside-looking-out.vercel.app/",
};

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Inside Looking Out</title>

        <meta name="description" content={metaData.description} />

        {/* Google / Search Engine Tags */}
        <meta itemProp="name" content={metaData.name}></meta>
        <meta itemProp="description" content={metaData.description} />
        <meta itemProp="image" content={metaData.image} />

        {/* Facebook Meta Tags */}
        <meta property="og:url" content={metaData.url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaData.name} />
        <meta property="og:description" content={metaData.description} />
        <meta property="og:image" content={metaData.image} />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaData.name} />
        <meta name="twitter:description" content={metaData.description} />
        <meta name="twitter:image" content={metaData.image}></meta>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
