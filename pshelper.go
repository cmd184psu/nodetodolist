package main

import (
	"bufio"
	"encoding/csv"
	"encoding/json"
	"fmt"
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

const pshelper_config_path = "~/.pshelper-config.json"

func pshelperMain() {
	if err := alfredo.ReadStructFromJSONFile(alfredo.ExpandTilde(pshelper_config_path), &config); err != nil {
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
	//	r.HandleFunc("/items", config.GetItems).Methods("GET")

	//	r.HandleFunc("/items/{subject}/{item}", itemHandlerGet).Methods("GET")
	//
	//	r.HandleFunc("/items/{subject}/{item}", itemHandlerPost).Methods("POST")

	SetupStaticRoutes(r)

	// fs := http.FileServer(http.Dir("./static/js"))
	// r.PathPrefix("/js/").Handler(http.StripPrefix("/js/", fs))
	// r.PathPrefix("/css/").Handler(http.StripPrefix("/css/", http.FileServer(http.Dir("./static/css"))))
	// r.PathPrefix("/webfonts/").Handler(http.StripPrefix("/webfonts/", http.FileServer(http.Dir("./static/webfonts"))))
	// log.Printf("serving index file: %s\n", config.Index)
	// r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	// 	log.Printf("in / route")
	// 	log.Printf("URI=%s", r.RequestURI)
	// 	log.Printf("serving index file: %s\n", config.Index)
	// 	http.ServeFile(w, r, "./static/"+config.Index)
	// })

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
