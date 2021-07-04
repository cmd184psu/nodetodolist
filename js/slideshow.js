requirejs.config({
    "baseUrl": "js/lib",
    "paths": {
      "slideshow": "../slideshow"
    },
    "shim": {
        "utils": ["jquery"]
    }
});

// Load the main app module to start the app
requirejs(["slideshow/main"]);
