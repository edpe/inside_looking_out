import axios from "axios";

const CASES_ENDPOINT =
  "https://api.ukhsa-dashboard.data.gov.uk/themes/infectious_disease/sub_themes/respiratory/topics/COVID-19/geography_types/Nation/geographies/England/metrics/COVID-19_cases_casesByDay?page_size=365";

const DEATHS_ENDPOINT =
  "https://api.ukhsa-dashboard.data.gov.uk/themes/infectious_disease/sub_themes/respiratory/topics/COVID-19/geography_types/Nation/geographies/England/metrics/COVID-19_deaths_ONSByDay?page_size=365";

const getMetricResults = async (endpoint) => {
  const results = [];
  let nextPage = endpoint;

  while (nextPage) {
    const { data, status, statusText } = await axios.get(nextPage, {
      timeout: 10000,
    });

    if (status >= 400) {
      throw new Error(statusText);
    }

    results.push(...data.results);
    nextPage = data.next;
  }

  return results;
};

const buildCoronaStats = async () => {
  const [caseResults, deathResults] = await Promise.all([
    getMetricResults(CASES_ENDPOINT),
    getMetricResults(DEATHS_ENDPOINT),
  ]);

  const deathsByDate = new Map(
    deathResults.map((entry) => [entry.date, Math.round(entry.metric_value || 0)])
  );

  return {
    data: caseResults.map((entry) => ({
      date: entry.date,
      name: entry.geography,
      code: entry.geography_code,
      dailyCases: Math.round(entry.metric_value || 0),
      dailyDeaths: deathsByDate.get(entry.date) || 0,
    })),
  };
};

export default async function handler(req, res) {
  try {
    const liveStats = await buildCoronaStats();

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json(liveStats);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "Live UKHSA COVID-19 data is currently unavailable." });
  }
}