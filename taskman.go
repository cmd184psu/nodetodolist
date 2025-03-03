package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/cmd184psu/alfredo"
	"github.com/gorilla/mux"
)

const taskman_config_file = "~/.taskman-config.json"

func taskmanMain() {
	if err := alfredo.ReadStructFromJSONFile(alfredo.ExpandTilde(taskman_config_file), &config); err != nil {
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

	// r.HandleFunc("/config/", GetConfig).Methods("GET")
	// r.HandleFunc("/config", GetConfig).Methods("GET")
	// r.HandleFunc("/items", config.GetItems).Methods("GET")

	// r.HandleFunc("/items/{subject}/{item}", itemHandlerGet).Methods("GET")
	// r.HandleFunc("/items/{subject}/{item}", itemHandlerPost).Methods("POST")

	SetupStaticRoutes(r)
	log.Printf("Listening on :%d...\n", config.Port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", config.Port), r); err != nil {
		log.Fatal(err)
	}
}
