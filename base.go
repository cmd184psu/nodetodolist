package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/cmd184psu/alfredo"
)

const base_config_file = "~/.base-config.json"

var jserver alfredo.JwtHttpsServerStruct

func baseMain() {
	log.Printf("Starting base server...\n")
	if err := alfredo.ReadStructFromJSONFile(alfredo.ExpandTilde(base_config_file), &config); err != nil {
		log.Fatal(err.Error())
	}
	if err := baseTrialOne(); err != nil {
		log.Fatal(err)
	}
	// if err := baseTrialTwo(); err != nil {
	// 	log.Fatal(err)
	// }

}

func baseTrialOne() error {
	log.Println("baseTrialOne")
	alfredo.VerbosePrintf("PORT (from config file) = %d\n", config.Port)
	fmt.Printf("PORT (from config file) = %d\n", config.Port)
	fmt.Printf("config file=%s\n", base_config_file)
	fmt.Printf("config file=%s\n", alfredo.ExpandTilde(base_config_file))
	//set defaults, if needed
	//config.SetDefaults()
	//initialize the service
	jserver.Init(config.Port)
	jserver.SetupStaticRoutes(config.Index)
	//	jserver.SetStaticDirRoute(alfredo.EatErrorReturnString(os.Getwd()) + "/static")

	// fmt.Printf("Creating queue, with size of %d...\n", config.PoolSize)
	// taskQueue := NewTaskQueue(config.PoolSize)

	// fmt.Println("Setup running tasks...")
	// go taskQueue.RunTasks()

	fmt.Printf("port will be set to %d\n", config.Port)
	//FIXME later: move to /certs directory or add to config
	jserver.SetCertFiles(ThisOrDefault(config.ServerCrtPath, server_crt_path_default),
		ThisOrDefault(config.ServerKeyPath, server_key_path_default))
	//FIXME later: move to /keys directory or add to config
	jserver.AcquireKey(ThisOrDefault(config.JwtKeyPath, jwt_key_path_default))

	jserver.Router.Get("/config", GetConfig)

	//handlers
	jserver.Router.Post(alfredo.LoginRoute, loginHandler)
	if err := jserver.StartServer(); err != nil {
		panic(err.Error())
	}

	return nil
}

// func baseTrialTwo() error {
// 	r := mux.NewRouter()

//load configuration, specific to statusapi
//	jserver.Router.Get("/taggedcsv", jserver.AuthMiddleware(TaggedCSVHandler))
//	jserver.Router.Get("/test", jserver.AuthMiddleware(testHandler))

//	jserver.Router.Put("/init", jserver.AuthMiddleware(InitTaskHandler))
//	jserver.Router.Post("/update", jserver.AuthMiddleware(UpdateTaskHandler))
//	jserver.Router.Delete("/clear", jserver.AuthMiddleware(ClearTaskHandler))
//	jserver.Router.Post("/update", jserver.AuthMiddleware(UpdateTaskHandler))
//	jserver.Router.Put("/complete", jserver.AuthMiddleware(CompleteTaskHandler))
// slice := jserver.Router.Routes()
// for i := 0; i < len(slice); i++ {
// 	fmt.Println(slice[i])
// }
//start server and wait

// 	SetupStaticRoutes(r)
// 	r.HandleFunc(alfredo.LoginRoute, loginHandler).Methods("POST")

// 	log.Printf("Listening on :%d...\n", config.Port)
// 	if err := http.ListenAndServe(fmt.Sprintf(":%d", config.Port), r); err != nil {
// 		return err
// 	}
// 	return nil
// }

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var creds alfredo.JwtCredentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	log.Printf("Attempting to authenticate user: %s:%s\n", creds.Username, creds.Password)
	alfredo.VerbosePrintln("using credential file: ./" + alfredo.DefaultUserCredsConfig)
	if alfredo.FileAuthenticate(creds.Username, creds.Password, "./"+alfredo.DefaultUserCredsConfig) {
		log.Printf("authentication was successful")
		jserver.UpdateClaims(creds.Username, w)
		//jserver.UpdateCookie(creds.Username, w)
	} else {
		log.Printf("authentication failed")
		w.WriteHeader(http.StatusUnauthorized)
	}
}
