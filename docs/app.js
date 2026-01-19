const form = document.querySelector("#playlist-form");
const playlist = document.querySelector("#playlist");
const status = document.querySelector("#status");
const range = document.querySelector("#range");

const BILLBOARD_JSON_BASE =
  "https://cdn.jsdelivr.net/gh/mhollingshead/billboard-hot-100@main/data";

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

const normalizeEntries = (entries) =>
  (entries || [])
    .map((entry) => ({
      title: cleanText(entry.title || entry.song || entry.songTitle),
      artist: cleanText(entry.artist || entry.artistName),
    }))
    .filter((entry) => entry.title && entry.artist);

const fetchChartEntries = async (dateString) => {
  const year = dateString.slice(0, 4);
  const url = `${BILLBOARD_JSON_BASE}/${year}/${dateString}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed with ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return normalizeEntries(data);
  }

  if (data && Array.isArray(data.data)) {
    return normalizeEntries(data.data);
  }

  if (data && Array.isArray(data.songs)) {
    return normalizeEntries(data.songs);
  }

  return [];
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
      const entries = await fetchChartEntries(dateString);
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
      "Unable to reach the chart data right now. Please try again later.";
  }
});
