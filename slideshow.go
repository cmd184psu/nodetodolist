package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/cmd184psu/alfredo"
	"github.com/gorilla/mux"
)

const slideshow_config_file = "~/.slideshow-config.json"

func slideshowItemHandlerGet(w http.ResponseWriter, r *http.Request) {

	log.Printf("in slideshow complex /items/ route")
	log.Printf("URI=%s", r.RequestURI)
	//URI=/items/home/index.json

	//	splits := strings.Split(r.RequestURI[7:], "/")

	//	subject := splits[0]
	//	item := splits[1]

	w.Header().Set(alfredo.ContentTypeJSON())

	filename := fmt.Sprintf(".%s", r.RequestURI)

	log.Printf("file=%q\n", filename)
	//jhs.Router.Handle(StaticRoute, http.FileServer(http.Dir(StaticDirRoute)))

	if alfredo.FileExistsEasy(filename) {
		log.Printf("file exists: %s\n", filename)

	} else {
		log.Printf("file does not exist: %s\n", filename)
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	if strings.HasSuffix(filename, ".jpg") {
		w.Header().Set("Content-Type", "image/jpeg")
	}
	if strings.HasSuffix(filename, ".png") {
		w.Header().Set("Content-Type", "image/png")
	}

	http.ServeFile(w, r, filename)
	// ServeJpgFile(filename, w, r)
}

func slideshowMain() {
	if err := config.Load(alfredo.ExpandTilde(slideshow_config_file)); err != nil {
		panic(err.Error())
	}
	r := mux.NewRouter()
	//	r.HandleFunc("/data", dataHandler).Methods("GET")
	//	r.HandleFunc("/update", updateHandler).Methods("POST")
	//	r.HandleFunc("/tunnel-mapping", tunnelMappingHandler).Methods("GET")
	//	r.HandleFunc("/delete", deleteHandler).Methods("POST")
	// r.HandleFunc("/create-customer", createCustomerHandler).Methods("POST")
	// r.HandleFunc("/export-csv", csvExportHandler).Methods("GET")
	// r.HandleFunc("/import-csv", csvImportHandler).Methods("POST")

	r.HandleFunc("/config/", GetConfig).Methods("GET")
	r.HandleFunc("/config", GetConfig).Methods("GET")
	r.HandleFunc("/config", config.SetConfig).Methods("POST")
	r.HandleFunc("/items", config.GetItems).Methods("GET")

	r.HandleFunc("/"+config.Prefix+"/{subject}/{item}", slideshowItemHandlerGet).Methods("GET")

	SetupStaticRoutes(r)
	log.Printf("Listening on :%d...\n", config.Port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", config.Port), r); err != nil {
		log.Fatal(err)
	}
}
