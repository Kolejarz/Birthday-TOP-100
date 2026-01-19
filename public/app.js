const form = document.querySelector("#playlist-form");
const playlist = document.querySelector("#playlist");
const status = document.querySelector("#status");
const range = document.querySelector("#range");

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
  const count = formData.get("count");

  status.textContent = "Downloading charts…";
  playlist.innerHTML = "";
  range.textContent = "";

  try {
    const response = await fetch(`/api/playlist?birth=${birth}&count=${count}`);
    if (!response.ok) {
      throw new Error("Could not fetch playlist.");
    }
    const data = await response.json();
    renderSongs(data.songs);
    range.textContent = `Charts from ${data.from} to ${data.to}`;
    status.textContent = data.songs.length
      ? `Found ${data.songs.length} songs.`
      : "No songs returned for this range.";
  } catch (error) {
    status.textContent = "Something went wrong. Please try again.";
  }
});
