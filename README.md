# Focus Playlist

Focus Playlist is a cozy ambient study timer. Choose a sound mood, blend a second sound, set a session length, and track your focus history while looped ambience plays.

## Features

- Five focus moods: Rain, Cafe, Night, Lo-fi, and Forest
- Real looped ambience files for each mood
- Animated visualizer
- PWA manifest and app icon
- Audio loading state
- Keyboard shortcuts
- Adjustable session length
- Session presets
- Volume control
- Blend two sound moods
- Favorite moods
- Theme switcher
- Focus task input
- Daily focus goal with progress bar
- Completed session history
- Export history as JSON
- Clear saved data button
- 60-second breathing break screen
- Session counter
- Saves preferences in `localStorage`
- Responsive UI

## Keyboard Shortcuts

- `Space`: Play or pause
- `R`: Reset timer
- `1` to `5`: Switch mood

## Tech

- HTML
- CSS
- JavaScript
- HTML audio

No dependencies or build tools are required. Keep the `audio/` folder with the project because the app loads those MP3 files.

## Audio Credits

Fill in `AUDIO_CREDITS.md` with the source and license for each MP3 before publishing.

## Run

Open `index.html` in your browser.

## Deploy On GitHub Pages

1. Create a new GitHub repository.
2. Upload the files in this folder.
3. Go to repository `Settings` > `Pages`.
4. Choose `Deploy from a branch`.
5. Select branch `main` and folder `/root`.

Your app will be live at `https://your-username.github.io/repository-name/`.
