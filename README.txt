DESKGAINS: setup (Windows 11 + Edge)
=====================================

1. HOST IT (Edge only installs apps from https:// or http://localhost, not from a file on disk)

   Option A, recommended: GitHub Pages (permanent, works from any PC)
     - Create a free GitHub repo, upload every file in this folder (keep the icons folder).
     - Repo Settings > Pages > deploy from the main branch.
     - Open the https://<you>.github.io/<repo>/ address in Edge.
     - The app files are public; your workout data is not. It stays in your browser.

   Option B: this PC only
     - Double-click start-server.bat and leave the window open.
     - Open http://localhost:8765/ in Edge.
     - (Not tested by me. If PowerShell is locked down on your work PC, use Option A.)

2. INSTALL
   - In Edge: ... menu > Apps > Install this site as an app (or the install icon in the address bar).
   - Pin it to the taskbar. Maximize the window once; press F11 (or the button in the app) for full screen.
   - Click "Turn on reminders" in the app and allow notifications.

3. KEEP IT RUNNING (reminders only fire while the app is open; minimized is fine)
   - edge://apps > DeskGains > Details > turn on "Start app when you sign in".
   - Edge Settings > System and performance > "Save resources with sleeping tabs" > add this site to "Never put these sites to sleep".
   - Windows Settings > System > Notifications: make sure Microsoft Edge is allowed, and that Focus / Do Not Disturb is not on during work hours.
   - Use Settings > "Send a test reminder" in the app to check that toasts and the buttons appear.

4. YOUR DATA
   - Stored in this browser only. Use Settings > Export backup once in a while; clearing site data erases it.

5. CHANGING THE PROGRAM
   - Exercises, weekly layout and muscle ceilings live in data.js. Times, days, fuel reminders and units are in the app's Settings tab.

KNOWN LIMITS
   - Windows toasts show at most two buttons (Done, Snooze 10). Skip and "In a meeting" are in the app window.
   - If the app is fully closed, no reminders fire.
   - Expected ROI is a model built from conservative beginner estimates, not a measurement. Tape numbers will include fat and water while you gain weight.
