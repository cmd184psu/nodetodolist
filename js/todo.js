requirejs.config({
    "baseUrl": "js/lib",
    "paths": {
      "todo": "../todo"
    },
    "shim": {
        "utils": ["jquery"]
    }
});

// Load the main app module to start the app
requirejs(["todo/main"]);
