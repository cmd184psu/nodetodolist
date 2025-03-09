package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/cmd184psu/alfredo"
	"github.com/gorilla/mux"
)

const server_crt_path_default = "./server.crt"
const server_key_path_default = "./server.key"
const jwt_key_path_default = "./jwt.key"

type ConfigStruct struct {
	Port           int    `json:"port"`
	Index          string `json:"indexhtml"`
	Prefix         string `json:"prefix"`
	Ext            string `json:"ext"`
	Todo           bool   `json:"todo"`
	DefaultSubject string `json:"defaultSubject"`
	Strict         bool   `json:"strict"`
	Age            int    `json:"age"`
	Unrestricted   bool   `json:"unrestricted"`
	Secure         bool   `json:"secure"`
	ServerCrtPath 	string `json:"servercrt"`
	ServerKeyPath 	string `json:"serverkey"`
	JwtKeyPath 	string `json:"jwt"`
	currentFile    string
}

var config ConfigStruct

func GetConfig(w http.ResponseWriter, r *http.Request) {
	log.Printf("calling GetConfig()")
	w.Header().Set(alfredo.ContentTypeJSON())
	json.NewEncoder(w).Encode(config)
}

func (config *ConfigStruct) Load(filename string) error {
	config.currentFile = filename
	return alfredo.ReadStructFromJSONFile(config.currentFile, &config)
}

func (config *ConfigStruct) SetConfig(w http.ResponseWriter, r *http.Request) {
	log.Printf("calling SetConfig()")
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&config)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.Header().Set(alfredo.ContentTypeJSON())
	json.NewEncoder(w).Encode(config)
	//save config to file
	log.Printf("Saving config to file: %s\n", alfredo.ExpandTilde(config.currentFile))
	if err := alfredo.WriteStructToJSONFile(alfredo.ExpandTilde(config.currentFile), config); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func SetupStaticRoutes(r *mux.Router) {
	fs := http.FileServer(http.Dir("./static/js"))
	r.PathPrefix("/js/").Handler(http.StripPrefix("/js/", fs))
	r.PathPrefix("/css/").Handler(http.StripPrefix("/css/", http.FileServer(http.Dir("./static/css"))))
	r.PathPrefix("/webfonts/").Handler(http.StripPrefix("/webfonts/", http.FileServer(http.Dir("./static/webfonts"))))
	log.Printf("serving index file: %s\n", config.Index)
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("in / route")
		log.Printf("URI=%s", r.RequestURI)
		log.Printf("serving index file: %s\n", config.Index)
		http.ServeFile(w, r, "./static/"+config.Index)
	})

}

type ListStruct struct {
	Age       int      `json:"age"`
	Timestamp int      `json:"timestamp"`
	Subject   string   `json:"subject"`
	Entries   []string `json:"entries"`
}

type ListItemStruct struct {
	Json string `json:"json"`
	Name string `json:"name"`
	Skip bool   `json:"skip"`
}

type ListItemContainerStruct struct {
	List  []ListItemStruct `json:"list"`
	Title string           `json:"title"`
}

func (config *ConfigStruct) GetLists() []ListStruct {
	//get list of directories
	log.Printf("prefix=%s\n", config.Prefix)
	thisdir, _ := os.Getwd()
	os.Chdir(config.Prefix)
	top, _ := os.Getwd()
	dirs := alfredo.FindFiles(".", "*", alfredo.DirectoryInodes)
	//dirs = append(dirs, "coding")
	//dirs = append(dirs, "work")
	//dirs = append(dirs, "home")
	var list []ListStruct
	var l ListStruct
	log.Printf("size of dirs: %d\n", len(dirs))
	for d := 0; d < len(dirs); d++ {
		if strings.EqualFold(dirs[d], ".") {
			continue
		}
		log.Printf("looking at directory: dir[%d]=%q\n", d, dirs[d])
		l.Age = 0
		l.Timestamp = 0
		log.Printf("top=%s\n", top)
		log.Printf("dirs[%d]=%s\n", d, dirs[d])
		l.Subject = dirs[d]

		l.Entries = alfredo.FindFiles(l.Subject, "*."+config.Ext, alfredo.RegFileInodes)

		if config.Todo {
			if !alfredo.SliceContains(l.Entries, l.Subject+"/index.json") {
				l.Entries = append([]string{l.Subject + "/index.json"}, l.Entries...)
			}
		}

		list = append(list, l)
	}
	os.Chdir(thisdir)

	return list
}

func (config *ConfigStruct) GetItems(w http.ResponseWriter, r *http.Request) {
	w.Header().Set(alfredo.ContentTypeJSON())
	json.NewEncoder(w).Encode(config.GetLists())
}

func ThisOrDefault(s string, def string) string {
	if len(s) > 0 {
		return s
	}
	return def
}