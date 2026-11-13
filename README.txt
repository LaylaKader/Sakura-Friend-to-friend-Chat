SAKURA CHAT v3
1. Drag this unzipped folder into app.netlify.com/drop (or redeploy your site with it).
2. Open the link on both devices, enter the SAME room code.

CHECK THE STATUS AT THE TOP OF THE CHAT:
 "connected (direct)" or "connected (relay)" = linked. Messages show ✓✓ when your friend received them.
 Stuck on "waiting" or "can't link yet" = the devices can't reach each other (usually different networks).

FIX FOR DIFFERENT NETWORKS (free TURN relay):
 a. Sign up free at metered.ca and create a TURN app.
 b. Copy your app name (the part before .metered.live) and your API key.
 c. Paste them into app.js: METERED_APP and METERED_KEY. Redeploy.

Optional: free Giphy key (developers.giphy.com) in app.js (GIPHY_KEY) for the most reliable GIF search.
Movie night: desktop Chrome -> TV button -> "Chrome Tab" -> tick "Share tab audio". Friend taps Watch.
