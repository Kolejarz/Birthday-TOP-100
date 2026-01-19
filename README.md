# Birthday Hot 100 Playlist

Build a birthday playlist that pulls the Billboard Hot 100 chart just after your birthday for
each year through today. Everything runs client-side so it can be deployed on GitHub Pages
without a server.

## How it works

1. Enter your birth date.
2. Choose how many songs to pull from each yearly chart.
3. The app fetches the Billboard Hot 100 chart for the day after your birthday, repeats the
   same date every year up to today, and assembles a playlist.

Each result is shown as `TITLE (ARTIST) [YEAR]` with quick links to search on YouTube and
Spotify.

## Running locally

Because the app is static, you can serve the `public/` directory with any simple web server:

```bash
python -m http.server 4173 --directory public
```

Then open `http://localhost:4173` in your browser.

## Deploying to GitHub Pages

1. Push the repository to GitHub.
2. Enable GitHub Pages in the repository settings and point it to the `public/` folder.
3. Visit the provided Pages URL.

> **Note**
> The browser fetches Billboard chart pages through a public CORS proxy so it can run without a
> server. If the proxy is unavailable, try again later or update the proxy URL in `public/app.js`.
