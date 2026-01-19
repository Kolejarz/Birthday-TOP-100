import express from "express";
import { getChart } from "billboard-hot-100";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const formatDate = (date) => date.toISOString().split("T")[0];

const addYearsSafely = (date, years) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  if (next.getMonth() !== date.getMonth()) {
    next.setDate(0);
  }
  return next;
};

const fetchChart = (dateString) =>
  new Promise((resolve, reject) => {
    getChart("hot-100", dateString, (error, chart) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(chart);
    });
  });

app.get("/api/playlist", async (req, res) => {
  const { birth, count } = req.query;
  const parsedCount = Number.parseInt(count, 10);

  if (!birth || Number.isNaN(parsedCount) || parsedCount < 1) {
    res.status(400).json({ error: "Provide a valid birth date and song count." });
    return;
  }

  const birthDate = new Date(birth);
  if (Number.isNaN(birthDate.getTime())) {
    res.status(400).json({ error: "Birth date is invalid." });
    return;
  }

  const startDate = new Date(birthDate);
  startDate.setDate(startDate.getDate() + 1);

  const today = new Date();
  const songs = [];

  for (
    let current = new Date(startDate);
    current <= today;
    current = addYearsSafely(current, 1)
  ) {
    const dateString = formatDate(current);
    try {
      // eslint-disable-next-line no-await-in-loop
      const chart = await fetchChart(dateString);
      const picks = chart.songs.slice(0, parsedCount).map((song) => ({
        title: song.title,
        artist: song.artist,
        year: current.getFullYear(),
        youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          `${song.title} ${song.artist}`
        )}`,
        spotify: `https://open.spotify.com/search/${encodeURIComponent(
          `${song.title} ${song.artist}`
        )}`,
      }));
      songs.push(...picks);
    } catch (error) {
      console.error(`Failed to fetch chart for ${dateString}`, error);
    }
  }

  res.json({ songs, from: formatDate(startDate), to: formatDate(today) });
});

app.listen(PORT, () => {
  console.log(`Birthday Hot 100 running at http://localhost:${PORT}`);
});
