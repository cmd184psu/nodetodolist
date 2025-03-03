package main

import (
	"fmt"
	"strings"

	"github.com/cmd184psu/alfredo"
)

// GitRevision will be injected with the current git commit hash
var GitRevision string

// GitBranch will be injected with the current git branch name
var GitBranch string

var GitVersion string

var GitTimestamp string

func BuildVersion() string {

	alfredo.VerbosePrintln("gitbranch=" + GitBranch)
	alfredo.VerbosePrintln("ver=" + GitVersion)
	alfredo.VerbosePrintln("time=" + GitTimestamp)

	var gb string
	if strings.EqualFold(GitBranch, "\"main\"") || strings.EqualFold(GitBranch, "\"master\"") {
		gb = ""
	} else {
		gb = "-" + GitBranch
	}

	return fmt.Sprintf("%s%s (%s)", GitVersion, gb, GitTimestamp)
}
