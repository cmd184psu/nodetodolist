package main

import (
	"bufio"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/cmd184psu/alfredo"
	"github.com/gorilla/mux"
)

type Customer struct {
	CustomerName   string `json:"customerName"`
	SlackChannel   string `json:"slackChannel"`
	SlackChannelId string `json:"slackChannelId"`
	InsightUrl     string `json:"insightUrl"`
	WorkLoadType   string `json:"workLoadType"`
	SfdcUrl        string `json:"sfdcUrl"`
	SupportTunnel  string `json:"supportTunnel"`
	CumulusBucket  string `json:"cumulusBucket"`
	Jira           string `json:"jira"`
}

type Data struct {
	CompanyName string     `json:"companyName"`
	ProjectName string     `json:"projectName"`
	Author      string     `json:"author"`
	Version     string     `json:"version"`
	Customers   []Customer `json:"customers"`
}

var (
	dataFilePath       = filepath.Join("public", "data.json")
	tunnelListFilePath = filepath.Join("public", "tunnellist.txt")
)

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
}

var config ConfigStruct

func GetConfig(w http.ResponseWriter, r *http.Request) {
	log.Printf("calling GetConfig()")
	w.Header().Set(alfredo.ContentTypeJSON())
	json.NewEncoder(w).Encode(config)
}

func main() {
	if err := alfredo.ReadStructFromJSONFile("./config.json", &config); err != nil {
		panic(err.Error())
	}
	r := mux.NewRouter()
	r.HandleFunc("/data", dataHandler).Methods("GET")
	r.HandleFunc("/update", updateHandler).Methods("POST")
	r.HandleFunc("/tunnel-mapping", tunnelMappingHandler).Methods("GET")
	r.HandleFunc("/delete", deleteHandler).Methods("POST")
	r.HandleFunc("/create-customer", createCustomerHandler).Methods("POST")
	r.HandleFunc("/export-csv", csvExportHandler).Methods("GET")
	r.HandleFunc("/import-csv", csvImportHandler).Methods("POST")

	r.HandleFunc("/config/", GetConfig).Methods("GET")
	r.HandleFunc("/config", GetConfig).Methods("GET")
	r.HandleFunc("/items", config.GetItems).Methods("GET")

	r.HandleFunc("/items/{subject}/{item}", itemHandlerGet).Methods("GET")
	r.HandleFunc("/items/{subject}/{item}", itemHandlerPost).Methods("POST")

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

	log.Printf("Listening on :%d...\n", config.Port)
	err := http.ListenAndServe(fmt.Sprintf(":%d", config.Port), r)
	if err != nil {
		log.Fatal(err)
	}
}

func updateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var update struct {
		Index int         `json:"index"`
		Field string      `json:"field"`
		Value interface{} `json:"value"`
	}

	err := json.NewDecoder(r.Body).Decode(&update)
	if err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Println("Received update request:", update)

	data, err := loadData()
	if err != nil {
		log.Println("Error loading data:", err)
		http.Error(w, "Failed to load data", http.StatusInternalServerError)
		return
	}

	if update.Index == -1 {
		// Update author
		if value, ok := update.Value.(string); ok {
			data.Author = value
		}
	} else {
		// Update customer data
		switch update.Field {
		case "customerName":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].CustomerName = value
			}
		case "slackChannel":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].SlackChannel = value
			}
		case "insightUrl":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].InsightUrl = value
			}
		case "workLoadType":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].WorkLoadType = value
			}
		case "sfdcUrl":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].SfdcUrl = value
			}
		case "cumulusBucket":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].CumulusBucket = value
			}
		case "jira":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].Jira = value
			}
		case "supportTunnel":
			if value, ok := update.Value.(string); ok {
				data.Customers[update.Index].SupportTunnel = value
			}
			// case "timeUsage":
			// 	if value, ok := update.Value.([]interface{}); ok {
			// 		var timeUsage []int
			// 		for _, v := range value {
			// 			if intValue, ok := v.(float64); ok {
			// 				timeUsage = append(timeUsage, int(intValue))
			// 			}
			// 		}
			// 		data.Customers[update.Index].TimeUsage = timeUsage
			// 	}
		default:
			log.Println("Invalid field:", update.Field)
			http.Error(w, "Invalid field", http.StatusBadRequest)
			return
		}
	}

	err = saveData(data)
	if err != nil {
		log.Println("Error saving data:", err)
		http.Error(w, "Failed to save data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func tunnelMappingHandler(w http.ResponseWriter, r *http.Request) {
	mapping, err := loadTunnelMapping()
	if err != nil {
		log.Println("Error loading tunnel mapping:", err)
		http.Error(w, "Failed to load tunnel mapping", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mapping)
}

func deleteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		Index int `json:"index"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println("Error decoding request body:", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	data, err := loadData()
	if err != nil {
		log.Println("Error loading data:", err)
		http.Error(w, "Failed to load data", http.StatusInternalServerError)
		return
	}

	if request.Index < 0 || request.Index >= len(data.Customers) {
		http.Error(w, "Invalid index", http.StatusBadRequest)
		return
	}

	data.Customers = append(data.Customers[:request.Index], data.Customers[request.Index+1:]...)

	err = saveData(data)
	if err != nil {
		log.Println("Error saving data:", err)
		http.Error(w, "Failed to save data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func createCustomerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	data, err := loadData()
	if err != nil {
		log.Println("Error loading data:", err)
		http.Error(w, "Failed to load data", http.StatusInternalServerError)
		return
	}

	newCustomer := Customer{CustomerName: "New Customer"}
	data.Customers = append(data.Customers, newCustomer)

	err = saveData(data)
	if err != nil {
		log.Println("Error saving data:", err)
		http.Error(w, "Failed to save data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func loadTunnelMapping() (map[string]string, error) {
	file, err := os.Open(tunnelListFilePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	mapping := make(map[string]string)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)
		if len(fields) >= 3 {
			mapping[fields[0]] = fields[2]
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return mapping, nil
}

func loadData() (*Data, error) {
	file, err := os.Open(dataFilePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var data Data
	err = json.NewDecoder(file).Decode(&data)
	if err != nil {
		return nil, err
	}

	return &data, nil
}

func saveData(data *Data) error {
	file, err := os.Create(dataFilePath)
	if err != nil {
		return err
	}
	defer file.Close()

	return json.NewEncoder(file).Encode(data)
}
func deepCopyCustomer(c Customer) Customer {
	return Customer{
		CustomerName:   c.CustomerName,
		SlackChannel:   c.SlackChannel,
		SlackChannelId: c.SlackChannelId,
		InsightUrl:     c.InsightUrl,
		WorkLoadType:   c.WorkLoadType,
		SfdcUrl:        c.SfdcUrl,
		SupportTunnel:  c.SupportTunnel,
		CumulusBucket:  c.CumulusBucket,
		Jira:           c.Jira,
		//	TimeUsage:      append([]int{}, c.TimeUsage...),
	}
}

func deepCopyCustomers(customers []Customer) []Customer {
	copy := make([]Customer, len(customers))
	for i, c := range customers {
		copy[i] = deepCopyCustomer(c)
	}
	return copy
}
func dataHandler(w http.ResponseWriter, r *http.Request) {
	data, err := loadData()
	if err != nil {
		log.Println("Error loading data:", err)
		http.Error(w, "Failed to load data", http.StatusInternalServerError)
		return
	}

	// Make a deep copy of customers and sort by name
	customersCopy := deepCopyCustomers(data.Customers)
	sort.Slice(customersCopy, func(i, j int) bool {
		return strings.ToLower(customersCopy[i].CustomerName) < strings.ToLower(customersCopy[j].CustomerName)
	})

	data.Customers = customersCopy

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func csvExportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	data, err := loadData()
	if err != nil {
		log.Println("Error loading data:", err)
		http.Error(w, "Failed to load data", http.StatusInternalServerError)
		return
	}

	// Make a deep copy of customers and sort by name
	customersCopy := deepCopyCustomers(data.Customers)
	sort.Slice(customersCopy, func(i, j int) bool {
		return strings.ToLower(customersCopy[i].CustomerName) < strings.ToLower(customersCopy[j].CustomerName)
	})

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=customers.csv")

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write header
	if err := writer.Write([]string{"CustomerName", "SlackChannel", "SlackChannelId", "InsightUrl", "WorkLoadType", "SfdcUrl", "SupportTunnel", "CumulusBucket", "Jira"}); err != nil {
		log.Println("Error writing CSV header:", err)
		return
	}

	// Write data
	for _, customer := range customersCopy {
		if err := writer.Write([]string{
			customer.CustomerName,
			customer.SlackChannel,
			customer.SlackChannelId,
			customer.InsightUrl,
			customer.WorkLoadType,
			customer.SfdcUrl,
			customer.SupportTunnel,
			customer.CumulusBucket,
			customer.Jira,
		}); err != nil {
			log.Println("Error writing CSV row:", err)
			return
		}
	}
}

func csvImportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		log.Println("Error parsing form file:", err)
		http.Error(w, "Failed to parse uploaded file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)

	// Skip header
	if _, err := reader.Read(); err != nil {
		log.Println("Error reading CSV header:", err)
		http.Error(w, "Failed to read CSV", http.StatusBadRequest)
		return
	}

	data, err := loadData()
	if err != nil {
		log.Println("Error loading data:", err)
		http.Error(w, "Failed to load data", http.StatusInternalServerError)
		return
	}

	data.Customers = []Customer{}

	for {
		record, err := reader.Read()
		if err != nil {
			break
		}

		customer := Customer{
			CustomerName:   record[0],
			SlackChannel:   record[1],
			SlackChannelId: record[2],
			InsightUrl:     record[3],
			WorkLoadType:   record[4],
			SfdcUrl:        record[5],
			SupportTunnel:  record[6],
			CumulusBucket:  record[7],
			Jira:           record[8],
		}

		data.Customers = append(data.Customers, customer)
	}

	if err := saveData(data); err != nil {
		log.Println("Error saving data:", err)
		http.Error(w, "Failed to save data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
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
		l.Entries = alfredo.FindFiles(l.Subject, "*.json", alfredo.RegFileInodes)

		if !alfredo.SliceContains(l.Entries, l.Subject+"/index.json") {
			l.Entries = append([]string{l.Subject + "/index.json"}, l.Entries...)
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

func itemHandlerGet(w http.ResponseWriter, r *http.Request) {

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
