const form = document.querySelector("#playlist-form");
const playlist = document.querySelector("#playlist");
const status = document.querySelector("#status");
const range = document.querySelector("#range");

const BILLBOARD_BASE = "https://www.billboard.com/charts/hot-100/";
const PROXIES = [
  (url) => `https://r.jina.ai/http://${url}`,
  (url) => `https://r.jina.ai/http://r.jina.ai/http://${url}`,
];

const formatDate = (date) => date.toISOString().split("T")[0];

const addYearsSafely = (date, years) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  if (next.getMonth() !== date.getMonth()) {
    next.setDate(0);
  }
  return next;
};

const cleanText = (value) => value?.replace(/\s+/g, " ").trim();

const findEntriesArray = (data) => {
  const queue = [data];

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    if (Array.isArray(current)) {
      if (current.length) {
        const hasTitles = current.some(
          (item) =>
            item &&
            typeof item === "object" &&
            (("title" in item && "artist" in item) ||
              ("song" in item && "artist" in item) ||
              ("title" in item && "artistName" in item))
        );
        if (hasTitles) {
          return current;
        }
      }
      current.forEach((item) => queue.push(item));
    } else if (typeof current === "object") {
      Object.values(current).forEach((value) => queue.push(value));
    }
  }

  return [];
};

const parseChartHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const nextData = doc.querySelector("#__NEXT_DATA__");
  if (nextData?.textContent) {
    try {
      const parsed = JSON.parse(nextData.textContent);
      const entries = findEntriesArray(parsed);
      if (entries.length) {
        return entries
          .map((entry) => ({
            title: cleanText(entry.title || entry.song),
            artist: cleanText(entry.artist || entry.artistName),
          }))
          .filter((entry) => entry.title && entry.artist);
      }
    } catch (error) {
      console.warn("Could not parse Next.js data", error);
    }
  }

  const dataRows = [...doc.querySelectorAll("[data-artist][data-title]")];
  if (dataRows.length) {
    return dataRows
      .map((row) => ({
        title: cleanText(row.getAttribute("data-title")),
        artist: cleanText(row.getAttribute("data-artist")),
      }))
      .filter((entry) => entry.title && entry.artist);
  }

  const regex = /data-title="([^"]+)"[^>]*data-artist="([^"]+)"/g;
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push({
      title: cleanText(match[1]),
      artist: cleanText(match[2]),
    });
  }
  return matches;
};

const fetchChartHtml = async (dateString) => {
  const url = `${BILLBOARD_BASE}${dateString}`;
  let lastError;

  for (const buildProxyUrl of PROXIES) {
    try {
      const response = await fetch(buildProxyUrl(url));
      if (!response.ok) {
        lastError = new Error(`Failed with ${response.status}`);
        continue;
      }
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to reach chart data.");
};

const renderSongs = (songs) => {
  playlist.innerHTML = "";

  songs.forEach((song) => {
    const item = document.createElement("li");

    const title = document.createElement("div");
    title.className = "song-title";
    title.textContent = `${song.title} (${song.artist})`;

    const meta = document.createElement("div");
    meta.className = "song-meta";
    meta.textContent = `Year: ${song.year}`;

    const links = document.createElement("div");
    links.className = "links";

    const youtube = document.createElement("a");
    youtube.href = song.youtube;
    youtube.target = "_blank";
    youtube.rel = "noreferrer";
    youtube.textContent = "YouTube";

    const spotify = document.createElement("a");
    spotify.href = song.spotify;
    spotify.target = "_blank";
    spotify.rel = "noreferrer";
    spotify.textContent = "Spotify";

    links.append(youtube, spotify);
    item.append(title, meta, links);
    playlist.append(item);
  });
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const birth = formData.get("birth");
  const count = Number.parseInt(formData.get("count"), 10);

  if (!birth || Number.isNaN(count) || count < 1) {
    status.textContent = "Enter a valid birth date and song count.";
    return;
  }

  const birthDate = new Date(birth);
  if (Number.isNaN(birthDate.getTime())) {
    status.textContent = "Enter a valid birth date.";
    return;
  }

  status.textContent = "Downloading charts…";
  playlist.innerHTML = "";
  range.textContent = "";

  const startDate = new Date(birthDate);
  startDate.setDate(startDate.getDate() + 1);

  const today = new Date();
  const songs = [];

  try {
    for (
      let current = new Date(startDate);
      current <= today;
      current = addYearsSafely(current, 1)
    ) {
      const dateString = formatDate(current);
      status.textContent = `Fetching ${dateString} chart…`;
      // eslint-disable-next-line no-await-in-loop
      const html = await fetchChartHtml(dateString);
      const entries = parseChartHtml(html);
      const picks = entries.slice(0, count).map((song) => ({
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
    }

    renderSongs(songs);
    range.textContent = `Charts from ${formatDate(startDate)} to ${formatDate(today)}`;
    status.textContent = songs.length
      ? `Found ${songs.length} songs.`
      : "No songs returned for this range.";
  } catch (error) {
    console.error(error);
    status.textContent =
      "Unable to reach Billboard right now. Please try again later.";
  }
});
