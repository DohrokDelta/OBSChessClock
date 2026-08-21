Hello everyone, MiniDohrok here.

Always remember to npm install the first time!

npm run to start the server (default port 8080, you may change it in the config server.js file's line 6, const PORT = 8080;)

This will start up the browser app of which you will want to use two windows, one for the controller and a second one for the overlay.

Controller will be at http://localhost:8080 OR http://localhost:8080/controller.html
Overlay will be at http://localhost:8080/overlay.html

To set it up on OBS, you need to create a Custom Browser Source which will point to the Overlay url.
I'd recommend using a 1000x300 frame for this.

Then, from the Docks tab you'll want to create a Custom Browser Dock that points to the Controller url.

And you're all set up now!

From the controller window you may click on the buttons or when focused press the spacebar to controll the clocks.
Every time the clock switches sides 15 seconds are added (you may change this value from the server.js file on line 21, const INCREMENT_MS = 15 * 1000;)

Feel free to make any modifications or customizations, hope you find this useful!