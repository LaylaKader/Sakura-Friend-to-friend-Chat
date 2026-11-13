# FriendChato

A private chat room for two. Open the site on two devices, type the same secret room code, and you can text, send photos and voice notes, use animated stickers, play games, talk by voice, and watch movies together with a shared screen. No accounts, no database, no server of your own.

**Live demo:** https://friendchato.netlify.app/

## Features

- **Chat:** text, emoji, photos, voice notes (hold the mic), delivery ticks (✓✓)
- **Stickers:** animated emotes, faces, cute packs, kaomoji
- **Message history:** saved on each device (IndexedDB), with a clear button
- **Movie theater:** one person shares a screen or browser tab, the other watches in a full-page theater view with chat on the side, floating emoji reactions and fullscreen
- **Voice chat:** live talking while you watch or play
- **Games:** Tic-Tac-Toe, Rock Paper Scissors, Memory Match, Connect Four, Hangman, Reaction Race, shared Doodle Board
- **Anime night-city look:** canvas-painted skyline, moon, clouds and falling petals
- Works on desktop and phone browsers (phones can watch a shared screen but can't share one)

## How it works

FriendChato has no backend. The two browsers connect directly to each other with WebRTC. [PeerJS](https://peerjs.com/) is used only for the first handshake: the first person in a room registers an ID built from the room code, and the second person connects to it. After that, messages, files, calls and screen share flow directly between the two devices.

Because nothing is stored on a server, both people must be online at the same time. Chat history lives only in each person's own browser.

## APIs and libraries used

| What | Used for |
| --- | --- |
| [WebRTC](https://developer.mozilla.org/docs/Web/API/WebRTC_API) (`RTCPeerConnection`, data channels) via [PeerJS 1.5.4](https://peerjs.com/) | Direct messaging, voice chat and screen share between the two browsers |
| [Screen Capture API](https://developer.mozilla.org/docs/Web/API/Screen_Capture_API) (`getDisplayMedia`) | Sharing a screen, window or tab, with tab audio |
| [Media Capture API](https://developer.mozilla.org/docs/Web/API/Media_Capture_and_Streams_API) (`getUserMedia`) and [MediaRecorder API](https://developer.mozilla.org/docs/Web/API/MediaRecorder) | Voice chat and voice notes |
| [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API) | Message history on each device |
| [Canvas 2D API](https://developer.mozilla.org/docs/Web/API/Canvas_API) | Anime night-city background and the Doodle Board |
| [Fullscreen API](https://developer.mozilla.org/docs/Web/API/Fullscreen_API) | Theater fullscreen |
| Google STUN servers | Finding a direct network path between devices |
| [PeerJS Cloud](https://peerjs.com/) signaling server (free public, replaceable) | Introducing the two browsers to each other |
| [Metered](https://www.metered.ca/) TURN REST API (optional) | Relay server for devices on networks that block direct connections |
| [Google Fonts](https://fonts.google.com/) (Mochiy Pop One, Zen Maru Gothic) | Typography |

No build step and no frameworks: plain HTML, CSS and JavaScript.

## Run locally

Camera, microphone and screen sharing need `https://` or `localhost`.

```bash
git clone <your-repo-url>
cd friendchato
cp config.example.js config.js
python3 -m http.server 8080   # or: npx serve
```

Open http://localhost:8080 in two browser windows (or two devices on the same network) and enter the same room code.

## Deploy to Netlify

1. Drag the project folder into [app.netlify.com/drop](https://app.netlify.com/drop), or connect your GitHub repo to Netlify.
2. Leave the build command empty and set the publish directory to `.` (already set in `netlify.toml`).
3. Share your site link and a room code with your friend.

## Configuration (optional TURN relay)

If two devices on different networks (for example Wi-Fi and mobile data) can't connect, add a free relay:

1. Create a free account at [metered.ca](https://www.metered.ca/) and create a TURN app.
2. Copy `config.example.js` to `config.js` and fill in your app name (the part before `.metered.live`) and API key.
3. Redeploy.

`config.js` is listed in `.gitignore`, so your key is not committed. It is still sent to the browser on the live site, so use a free-tier key that you are fine with rotating.

## Troubleshooting

- The status line at the top of the chat shows `connected (direct)` or `connected (relay)` when linked, and messages show ✓✓ when delivered.
- Stuck on "waiting": check that both devices typed the exact same room code, and try the TURN relay above.
- "Room is busy" or "nobody in the room yet" right after closing or reloading a tab: the free PeerJS server can hold on to the old room for up to a minute. FriendChato retries by itself, so just wait.
- Close old FriendChato tabs on both devices before testing a new version.
- The status line shows the exact connection error (for example `network`) if the free PeerJS server is down. You can point the app at your own PeerJS server with the `peerHost` options in `config.js`.
- Movie sound: on desktop Chrome choose **Chrome Tab** when sharing and tick **Share tab audio**. Your friend taps **Watch** to start the video with sound.
- Use headphones during voice chat to avoid echo.

## Privacy and limits

- Messages travel directly between the two browsers and are not stored on any server. Anyone who knows your room code can join it, so pick a long random one.
- Only two people per room.
- Chat history is local to each browser; clearing site data deletes it.

## Project structure

```
index.html          page layout
style.css           anime glass UI, theater layout, game styles
app.js              connection, chat, stickers, calls, theater, games
config.example.js   optional TURN settings (copy to config.js)
netlify.toml        Netlify settings
```
