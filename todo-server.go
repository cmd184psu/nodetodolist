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
)

type SampleData struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Value string `json:"value"`
}

var jserver alfredo.JwtHttpsServerStruct


// mux.HandleFunc("GET /api/tender/readWrite/{tenderReference}/vendor/{vendorCode}", func(w http.ResponseWriter, r *http.Request) {
//     tenderRef := r.PathValue("tenderReference")
//     vendorCode := r.PathValue("vendorCode")

//	    tender := Tender{
//	        tenderReference: tenderRef,
//	        vendorCode: vendorCode,
//	    }
//	    tender.readWrite()
//	})
// func ServeJsonFile(f string, w http.ResponseWriter, r *http.Request) {
// 	log.Printf("ServeJsonFile(%s)\n", f)
// 	useInitialized := false
// 	if !alfredo.FileExistsEasy(f) {
// 		log.Printf("file %s does not exist\n", f)
// 		if err := alfredo.Touch(f); err != nil {
// 			log.Printf("error creating file %s\n", f)
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}
// 		useInitialized = true
// 	}

// 	if useInitialized {
// 		log.Printf("using initialized file %s\n", f)
// 		w.Header().Set("Content-Type", alfredo.ApplicationJson)
// 		content := []byte("{ \"title\" : \"untitled\", \"list\": []")
// 		log.Printf("content=%s\n", content)
// 		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(content)))
// 		w.WriteHeader(http.StatusOK)
// 		w.Write(content)
// 	} else {

// 		// Open the file
// 		file, err := os.Open(f)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}
// 		defer file.Close()

// 		// Get file info
// 		fileInfo, err := file.Stat()
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}

// 		// Set headers
// 		//w.Header().Set("Content-Disposition", "attachment; filename="+fileInfo.Name())
// 		w.Header().Set("Content-Type", alfredo.ApplicationJson)
// 		w.Header().Set("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))
// 		log.Printf("file=%s, size=%d\n", f, fileInfo.Size())
// 		// Copy file contents to response writer
// 		_, err = io.Copy(w, file)
// 		if err != nil {
// 			http.Error(w, err.Error(), http.StatusInternalServerError)
// 			return
// 		}
// 	}

// }

func Oldmain() {
	if err := alfredo.ReadStructFromJSONFile("./config.json", &config); err != nil {
		panic(err.Error())
	}

	//initialize
	jserver.Init(config.Port)
	//	jserver.SetCertFiles("server.crt", "server.key")
	//	jserver.AcquireKey("jwt.key")

	//handlers
	jserver.Router.Post(alfredo.LoginRoute, loginHandler)
	//	jserver.Router.Get("/data", jserver.AuthMiddleware(GetData))
	//jserver.Router.Get("/data", jserver.AuthMiddleware(GetData))

	jserver.SetStaticDirRoute("/static")
	jserver.Router.Get("/config/", GetConfig)
	jserver.Router.Get("/config", GetConfig)

	jserver.Router.Get("/items", config.GetItems)
	jserver.Router.Get("/", func(w http.ResponseWriter, r *http.Request) {

		log.Printf("in / route")
		log.Printf("URI=%s", r.RequestURI)

		log.Printf("serving index file: %s\n", config.Index)

		http.ServeFile(w, r, "./static/"+config.Index)
	})
	jserver.Router.Get("/items/{subject}/{item}", func(w http.ResponseWriter, r *http.Request) {

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
		ServeJsonFile(filename, w, r)

	})
	// jserver.Router.Post("/items/{subject}/{item}", func(w http.ResponseWriter, r *http.Request) {

	// 	log.Printf("in complex /items/ route (POST)")
	// 	log.Printf("URI=%s", r.RequestURI)
	// 	//URI=/items/home/index.json

	// 	splits := strings.Split(r.RequestURI[7:], "/")

	// 	subject := splits[0]
	// 	item := splits[1]

	// 	w.Header().Set(alfredo.ContentTypeJSON())

	// 	filename := fmt.Sprintf("./%s/%s/%s", config.Prefix, subject, item)

	// 	log.Printf("file=%s\n", filename)
	// 	//jhs.Router.Handle(StaticRoute, http.FileServer(http.Dir(StaticDirRoute)))

	// 	log.Printf("write json body of size %d to file %s\n", 0, filename)
	// 	//ServeJsonFile(filename, w, r)

	// 	// 	err := json.NewDecoder(r.Body).Decode(&creds)
	// 	// if err != nil {
	// 	// 	w.WriteHeader(http.StatusBadRequest)
	// 	// 	return
	// 	// }

	// })

	jserver.Router.Post("/items/{subject}/{item}", func(w http.ResponseWriter, r *http.Request) {
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
	})

	//console.log("requested item: "+process.cwd()

	// slice := jserver.Router.Routes()
	// for i := 0; i < len(slice); i++ {
	// 	fmt.Println(slice[i])
	// }
	//start server and wait
	if err := jserver.StartServer(); err != nil {
		panic(err.Error())
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var creds alfredo.JwtCredentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	log.Printf("Attempting to authenticate user: %s:%s\n", creds.Username, creds.Password)
	if alfredo.FileAuthenticate(creds.Username, creds.Password, alfredo.DefaultUserCredsConfig) {
		log.Printf("authentication was successful")
		jserver.UpdateClaims(creds.Username, w)
		//jserver.UpdateCookie(creds.Username, w)
	} else {
		log.Printf("authentication failed")
		w.WriteHeader(http.StatusUnauthorized)
	}
}

func GetData(w http.ResponseWriter, r *http.Request) {
	sampleData := []SampleData{
		{ID: 1, Name: "Item 1", Value: "Value 1"},
		{ID: 2, Name: "Item 2", Value: "Value 2"},
		{ID: 3, Name: "Item 3", Value: "Value 3"},
	}

	w.Header().Set(alfredo.ContentTypeJSON())
	json.NewEncoder(w).Encode(sampleData)
}

// func GetConfig(w http.ResponseWriter, r *http.Request) {
// 	log.Printf("calling GetConfig()")
// 	w.Header().Set(alfredo.ContentTypeJSON())
// 	json.NewEncoder(w).Encode(config)
// }

// [
//   {
//     "subject": "coding",
//     "timestamp": 1710019140254,
//     "entries": [
//       "coding/alfredo.json",
//       "coding/fstools.json",
//       "coding/index.json",
//       "coding/opentop.json",
//       "coding/portfolio.json",
//       "coding/s4.json",
//       "coding/slideshow.json",
//       "coding/todolist.json"
//     ],
//     "age": 198.183440196759
//   },
//   {
//     "subject": "home",
//     "timestamp": 1713614451482,
//     "entries": [
//       "home/adventure.json",
//       "home/cleanhd.json",
//       "home/dinner.json",
//       "home/externtodolistproject.json",
//       "home/food.json",
//       "home/futurama.json",
//       "home/games.json",
//       "home/gifts.json",
//       "home/index.json",
//       "home/javascript.json",
//       "home/justtoday.json",
//       "home/lego.json",
//       "home/movies.json",
//       "home/office.json",
//       "home/onetime.json",
//       "home/physical-cleanup.json",
//       "home/pi.json",
//       "home/pos.json",
//       "home/recurring.json",
//       "home/test.json",
//       "home/thisweekend.json",
//       "home/tonight.json",
//       "home/treehouse.json",
//       "home/workfromhome.json",
//       "home/yard.json"
//     ],
//     "age": 156.571041724537
//   },

