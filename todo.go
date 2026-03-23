package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/cmd184psu/alfredo"
	"github.com/gorilla/mux"
)

const todo_config_path = "~/.todo-config.json"

func ServeJsonFile(f string, w http.ResponseWriter, r *http.Request) {
	log.Printf("ServeJsonFile(%s)\n", f)
	useInitialized := false
	if !alfredo.FileExistsEasy(f) {
		log.Printf("file %s does not exist\n", f)
		if err := alfredo.Touch(f); err != nil {
			log.Printf("error creating file %s\n", f)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		useInitialized = true
	}

	if useInitialized {
		log.Printf("using initialized file %s\n", f)
		w.Header().Set("Content-Type", alfredo.ApplicationJson)
		content := []byte("{ \"title\" : \"untitled\", \"list\": [] }")
		log.Printf("content=%s\n", content)
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(content)))
		w.WriteHeader(http.StatusOK)
		w.Write(content)

		err := os.WriteFile(f, content, 0644)
		if err != nil {
			log.Printf("error writing to file %s: %v\n", f, err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		return
	} else {

		// Open the file
		file, err := os.Open(f)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer file.Close()

		// Get file info
		fileInfo, err := file.Stat()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Set headers
		//w.Header().Set("Content-Disposition", "attachment; filename="+fileInfo.Name())
		w.Header().Set("Content-Type", alfredo.ApplicationJson)
		w.Header().Set("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))
		log.Printf("file=%s, size=%d\n", f, fileInfo.Size())
		// Copy file contents to response writer
		_, err = io.Copy(w, file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

}

func ServeGeneratedIndex(subject string, w http.ResponseWriter, r *http.Request) {
	log.Printf("ServeGeneratedIndex(%s)\n", subject)

	w.Header().Set("Content-Type", alfredo.ApplicationJson)
	content := []byte("{ \"title\" : \"Index of " + subject + "\", \"list\": [] }")

	//marshal content byte array into a json structure of type ListStruct
	log.Println("unmarshalling content")
	var container ListItemContainerStruct

	err := json.Unmarshal(content, &container)
	if err != nil {
		log.Printf("error unmarshalling content: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	//get list of json files in this directory (current working + f)
	thisdir := alfredo.EatErrorReturnString(os.Getwd())

	log.Printf("thisdir=%s\n", thisdir)

	os.Chdir(thisdir + "/" + config.Prefix + "/" + subject)

	log.Printf("now this dir = %s\n", alfredo.EatErrorReturnString(os.Getwd()))
	log.Printf("find all files ending in json in current directory")
	dirs := alfredo.FindFiles(".", "*.json", alfredo.RegFileInodes)
	os.Chdir(thisdir)

	//add each json file to the list
	for d := 0; d < len(dirs); d++ {
		if strings.EqualFold(dirs[d], "index.json") {
			continue
		}
		container.List = append(container.List, ListItemStruct{Json: subject + "/" + dirs[d], Name: dirs[d], Skip: false})
	}

	//sort the list
	//prepend the index file to the list

	//marshal the list structure back into a byte array
	content, err = json.Marshal(container)
	if err != nil {
		log.Printf("error marshalling list: %v\n", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("content=%s\n", content)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(content)))
	w.WriteHeader(http.StatusOK)
	w.Write(content)

}

func todoItemHandlerGet(w http.ResponseWriter, r *http.Request) {

	log.Printf("in complex /items/ route")
	log.Printf("URI=%s", r.RequestURI)
	//URI=/items/home/index.json

	splits := strings.Split(r.RequestURI[7:], "/")

	subject := splits[0]
	item := splits[1]

	w.Header().Set(alfredo.ContentTypeJSON())

	filename := fmt.Sprintf("./%s/%s/%s", config.Prefix, subject, item)

	log.Printf("file=%s\n", filename)
	//jhs.Router.Handle(StaticRoute, http.FileServer(http.Dir(StaticDirRoute)))

	if strings.Contains(filename, "/index.json") {
		log.Printf("serving index file: %s\n", filename)
		ServeGeneratedIndex(filename[8:len(filename)-11], w, r)
		return
	}
	ServeJsonFile(filename, w, r)
}

func itemHandlerPost(w http.ResponseWriter, r *http.Request) {
	log.Printf("in complex /items/ route (POST)")
	log.Printf("URI=%s", r.RequestURI)
	//URI=/items/home/index.json

	splits := strings.Split(r.RequestURI[7:], "/")

	subject := splits[0]
	item := splits[1]

	w.Header().Set(alfredo.ContentTypeJSON())

	filename := fmt.Sprintf("./%s/%s/%s", config.Prefix, subject, item)

	log.Printf("file=%s\n", filename)

	// Create a file to save the JSON data
	file, err := os.Create(filename)
	if err != nil {
		http.Error(w, "Error creating file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	// Create a JSON decoder for the request body
	decoder := json.NewDecoder(r.Body)

	// Create a JSON encoder for the file
	encoder := json.NewEncoder(file)

	// Read the JSON data and write it to the file
	var data interface{}
	if err := decoder.Decode(&data); err != nil {
		if err != io.EOF {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
	}

	// Write the data to the file with indentation
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(data); err != nil {
		http.Error(w, "Error writing to file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("JSON data saved successfully"))
}

func todoMain() {
	if err := alfredo.ReadStructFromJSONFile(alfredo.ExpandTilde(todo_config_path), &config); err != nil {
		panic(err.Error())
	}
	r := mux.NewRouter()
	// r.HandleFunc("/data", dataHandler).Methods("GET")
	// r.HandleFunc("/update", updateHandler).Methods("POST")
	// r.HandleFunc("/tunnel-mapping", tunnelMappingHandler).Methods("GET")
	// r.HandleFunc("/delete", deleteHandler).Methods("POST")
	// r.HandleFunc("/create-customer", createCustomerHandler).Methods("POST")
	// r.HandleFunc("/export-csv", csvExportHandler).Methods("GET")
	// r.HandleFunc("/import-csv", csvImportHandler).Methods("POST")

	r.HandleFunc("/config/", GetConfig).Methods("GET")
	r.HandleFunc("/config", GetConfig).Methods("GET")
	r.HandleFunc("/items", config.GetItems).Methods("GET")

	r.HandleFunc("/items/{subject}/{item}", todoItemHandlerGet).Methods("GET")
	r.HandleFunc("/items/{subject}/{item}", itemHandlerPost).Methods("POST")

	SetupStaticRoutes(r)

	log.Printf("Listening on :%d...\n", config.Port)

	if config.Secure {
		err := http.ListenAndServeTLS(fmt.Sprintf(":%d", config.Port), config.ServerCrtPath, config.ServerKeyPath, r)
		if err != nil {
			log.Fatal(err)
		}
		return
	} else {
		err := http.ListenAndServe(fmt.Sprintf(":%d", config.Port), r)
		if err != nil {
			log.Fatal(err)
		}
	}
}
