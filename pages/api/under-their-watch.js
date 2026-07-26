import axios from "axios";

const CPI_SERIES_URL =
  "https://www.ons.gov.uk/generator?format=csv&uri=/economy/inflationandpriceindices/timeseries/d7g7/mm23";
const EARNINGS_LEVEL_URL =
  "https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/kai7/emp";
const HCI_LATEST_URL =
  "https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/householdcostsindicesforukhouseholdgroups/latest";
const CACHE_TTL_MS = 1000 * 60 * 60;

let cachedResponse = null;
let cachedAt = 0;
let inFlightPromise = null;

const monthMap = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

const figures = [
  {
    key: "tony-blair",
    name: "Tony Blair",
    image: "/img/portraits/tony-blair.jpg",
    start: "2000-01-01",
    end: "2007-06-30",
  },
  {
    key: "gordon-brown",
    name: "Gordon Brown",
    image: "/img/portraits/gordon-brown.jpg",
    start: "2007-07-01",
    end: "2010-05-31",
  },
  {
    key: "david-cameron",
    name: "David Cameron",
    image: "/img/portraits/david-cameron.jpg",
    start: "2010-06-01",
    end: "2016-07-31",
  },
  {
    key: "theresa-may",
    name: "Theresa May",
    image: "/img/portraits/theresa-may.jpg",
    start: "2016-08-01",
    end: "2019-07-31",
  },
  {
    key: "boris-johnson",
    name: "Boris Johnson",
    image: "/img/portraits/boris-johnson.jpg",
    start: "2019-08-01",
    end: "2022-09-30",
  },
  {
    key: "elizabeth-truss",
    name: "Elizabeth Truss",
    image: "/img/portraits/elizabeth-truss.jpg",
    start: "2022-10-01",
    end: "2022-10-31",
  },
  {
    key: "rishi-sunak",
    name: "Rishi Sunak",
    image: "/img/portraits/rishi-sunak.jpg",
    start: "2022-11-01",
    end: "2024-07-31",
  },
  {
    key: "keir-starmer",
    name: "Keir Starmer",
    image: "/img/portraits/keir-starmer.jpg",
    start: "2024-08-01",
    end: "2026-06-30",
  },
  {
    key: "andy-burnham",
    name: "Andy Burnham",
    image: "/img/portraits/andy-burnham.jpg",
    start: "2026-07-01",
    end: null,
  },
];

const parseMonthLabel = (label) => {
  const [year, monthCode] = label.split(" ");
  const month = monthMap[monthCode];

  if (month === undefined) {
    return null;
  }

  return new Date(Date.UTC(Number(year), month, 1));
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const formatMonth = (date) =>
  date.toLocaleString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const parseObservationCsv = (csvText) => {
  const observations = new Map();

  csvText
    .split(/\r?\n/)
    .filter((line) => /^"\d{4} [A-Z]{3}"/.test(line))
    .forEach((line) => {
      const match = line.match(/^"([^"]+)","?([^"]*)"?$/);

      if (!match) {
        return;
      }

      const date = parseMonthLabel(match[1]);
      const value = Number.parseFloat(match[2]);

      if (!date || Number.isNaN(value)) {
        return;
      }

      observations.set(formatDate(date), value);
    });

  return observations;
};

const wait = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

const fetchWithRetry = async (url, timeout, retries = 2) => {
  try {
    return await axios.get(url, { timeout });
  } catch (error) {
    const retryAfterSeconds = Number.parseInt(
      error?.response?.headers?.["retry-after"] || "0",
      10
    );

    if (error?.response?.status === 429 && retries > 0) {
      await wait(Math.max(retryAfterSeconds, 2) * 1000);
      return fetchWithRetry(url, timeout, retries - 1);
    }

    throw error;
  }
};

const extractHciChartUrl = (html) => {
  const match = html.match(/href="(\/generator\?uri=\/economy\/inflationandpriceindices\/bulletins\/householdcostsindicesforukhouseholdgroups\/[^"]+&format=csv)"/);

  if (!match) {
    throw new Error("Unable to find HCI chart CSV link");
  }

  return `https://www.ons.gov.uk${match[1].replace(/&amp;/g, "&")}`;
};

const parseHciCsv = (csvText) => {
  const observations = new Map();
  const rows = csvText.split(/\r?\n/).filter(Boolean);
  const startIndex = rows.findIndex((line) => line.startsWith('"index_date"'));

  if (startIndex === -1) {
    return observations;
  }

  rows.slice(startIndex + 1).forEach((line) => {
    const parts = line.replace(/^"|"$/g, "").split('","');

    if (parts.length < 3) {
      return;
    }

    const rawDate = parts[0];
    const value = Number.parseFloat(parts[2]);
    const parsed = new Date(`${rawDate} UTC`);

    if (Number.isNaN(parsed.getTime()) || Number.isNaN(value)) {
      return;
    }

    observations.set(formatDate(parsed), value);
  });

  return observations;
};

const getFigureForDate = (date) => {
  const target = formatDate(date);
  return figures.find((figure) => {
    const starts = target >= figure.start;
    const ends = !figure.end || target <= figure.end;
    return starts && ends;
  });
};

const buildMonthlyFrames = ({ cpiByDate, earningsByDate, hciByDate }) => {
  const startDate = new Date(Date.UTC(2000, 0, 1));
  const endDate = new Date(Date.UTC(2026, 5, 1));
  const frames = [];

  for (
    let cursor = new Date(startDate);
    cursor <= endDate;
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1))
  ) {
    const isoDate = formatDate(cursor);
    const figure = getFigureForDate(cursor);

    if (!figure) {
      continue;
    }

    const cpi = cpiByDate.get(isoDate);
    if (typeof cpi !== "number") {
      continue;
    }

    const currentEarnings = earningsByDate.get(isoDate);
    const lastYear = new Date(
      Date.UTC(cursor.getUTCFullYear() - 1, cursor.getUTCMonth(), 1)
    );
    const lastYearEarnings = earningsByDate.get(formatDate(lastYear));

    let wageGrowth = null;
    if (
      typeof currentEarnings === "number" &&
      typeof lastYearEarnings === "number" &&
      lastYearEarnings > 0
    ) {
      wageGrowth = ((currentEarnings - lastYearEarnings) / lastYearEarnings) * 100;
    }

    frames.push({
      date: isoDate,
      dateLabel: formatMonth(cursor),
      figureKey: figure.key,
      cpi,
      wageGrowth,
      wageSqueeze:
        typeof wageGrowth === "number" ? Math.max(0, cpi - wageGrowth) : 0,
      hci: hciByDate.get(isoDate) ?? null,
    });
  }

  return frames;
};

const buildUnderTheirWatchData = async () => {
  const [cpiCsv, earningsCsv, hciLatestPage] = await Promise.all([
    fetchWithRetry(CPI_SERIES_URL, 20000),
    fetchWithRetry(EARNINGS_LEVEL_URL, 20000),
    fetchWithRetry(HCI_LATEST_URL, 20000),
  ]);

  const hciCsvUrl = extractHciChartUrl(hciLatestPage.data);
  const { data: hciCsv } = await fetchWithRetry(hciCsvUrl, 20000);

  const cpiByDate = parseObservationCsv(cpiCsv.data);
  const earningsByDate = parseObservationCsv(earningsCsv.data);
  const hciByDate = parseHciCsv(hciCsv);
  const frames = buildMonthlyFrames({ cpiByDate, earningsByDate, hciByDate });

  return {
    title: "Under Their Watch",
    figures,
    currentFigureKey: "andy-burnham",
    frames,
    sources: {
      cpi: "ONS CPI annual rate series D7G7",
      earnings: "ONS average weekly earnings level series KAI7",
      householdCosts: "ONS Household Costs Index annual rate for all households",
    },
  };
};

export default async function handler(req, res) {
  try {
    if (cachedResponse && Date.now() - cachedAt < CACHE_TTL_MS) {
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      res.status(200).json(cachedResponse);
      return;
    }

    if (!inFlightPromise) {
      inFlightPromise = buildUnderTheirWatchData()
        .then((data) => {
          cachedResponse = data;
          cachedAt = Date.now();
          return data;
        })
        .finally(() => {
          inFlightPromise = null;
        });
    }

    const data = await inFlightPromise;
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    if (cachedResponse) {
      res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
      res.status(200).json(cachedResponse);
      return;
    }

    res.status(502).json({
      error: "Live ONS inflation, earnings and household cost data is currently unavailable.",
    });
  }
}