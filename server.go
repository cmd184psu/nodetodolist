package main

import (
	"fmt"
	"os"
	"strings"
)

const todo = "todo"
const menugen = "menugen"
const slideshow = "slideshow"
const pshelper = "pshelper"

const fileserver_version_fmt = "Generic File Server (c) C Delezenski <cmd184psu@gmail.com> - %s\n"

func main() {
	if len(os.Args) > 1 && os.Args[1] == "-ver" {
		fmt.Printf(fileserver_version_fmt, BuildVersion())
		os.Exit(0)
	}

	if strings.Contains(os.Args[0], todo) {
		todoMain()
		os.Exit(0)
	}
	if strings.Contains(os.Args[0], menugen) {
		menugenMain()
		os.Exit(0)
	}
	if strings.Contains(os.Args[0], slideshow) {
		slideshowMain()
		os.Exit(0)
	}
	if strings.Contains(os.Args[0], pshelper) {
		pshelperMain()
		os.Exit(0)
	}
	fmt.Println("hello world - file-server-generic")
}
