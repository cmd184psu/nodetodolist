PWD=$(shell pwd)
VER=1.0.0
NAME=NodeJS-Todolist
PNAME=$(NAME)-$(VER)
BASE=/opt/NodeJS-Todolist
SERVICENAME=todo


all:
	node /opt/node/compiler/r.js -o config.js


clean: 
	rm -rf www-build

diff: 
	git diff -b > diffs.txt

npm:
	sudo npm install express

refresh:
	sudo /etc/init.d/nodetodolist.service stop
	sudo cp -avpf css/*.css $(BASE)/css/
	sudo cp -avpf *.html $(BASE)/
	sudo cp -avpf images/* $(BASE)/images/
	sudo cp -avpf js/*.js $(BASE)/js/
	sudo cp -avpf webfonts/* $(BASE)/webfonts/
	sudo cp -avpf *.sh $(BASE)/bin
	sudo cp data.json $(BASE)/
	sudo cp server.js $(BASE)/
	sudo /etc/init.d/nodetodolist.service start

install: 
	echo "destdir=$(DESTDIR)"
	mkdir -p $(DESTDIR)$(BASE)/js
	mkdir -p $(DESTDIR)$(BASE)/images
	mkdir -p $(DESTDIR)$(BASE)/webfonts
	mkdir -p $(DESTDIR)$(BASE)/css
	mkdir -p $(DESTDIR)$(BASE)/bin
	mkdir -p $(DESTDIR)/etc/init.d/
	
	cp -avpf css/*.css $(DESTDIR)$(BASE)/css/
	cp -avpf *.html $(DESTDIR)$(BASE)/
	cp -avpf images/* $(DESTDIR)$(BASE)/images/
	cp -avpf js/*.js $(DESTDIR)$(BASE)/js/
	cp -avpf server.js $(DESTDIR)$(BASE)/
	cp -avpf webfonts/* $(DESTDIR)$(BASE)/webfonts/
	install -m 755 *.sh $(DESTDIR)$(BASE)/bin/
	install -m 755 nodetodolist.service $(DESTDIR)/etc/init.d/
	
rpms:
	#begin standard prep
	mkdir -p $(PNAME)
	
	cp nodetodolist.service $(PNAME)/
	cp -avpf css $(PNAME)/
	cp -avpf *.html $(PNAME)/
	cp -avpf images $(PNAME)/
	cp -avpf js $(PNAME)/
	cp -avpf webfonts $(PNAME)/
	cp -avpf server.js $(PNAME)/
	cp -avpf *.sh $(PNAME)/

	cp Makefile $(PNAME)/Makefile
	touch $(PNAME)/configure
	chmod 755 $(PNAME)/configure
	#end standard prep
	
	tar -cvp $(PNAME) -f - | gzip > $(RPMTOP)/SOURCES/$(PNAME).tar.gz
	rpmbuild -ba ./$(SPEC).spec --target noarch
	mv -vf $(RPMTOP)/RPMS/noarch/$(NAME)-* .
	mv -vf $(RPMTOP)/SRPMS/$(NAME)-* .

install-slideshow:
	sudo install -m 755 servicefiles/slideshow.service /lib/systemd/system/
	sudo systemctl daemon-reload
	sudo systemctl enable slideshow
	sudo systemctl start slideshow
install-todolist:
	sudo install -m 755 servicefiles/todolist.service /lib/systemd/system/
	sudo systemctl daemon-reload
	sudo systemctl enable todolist
	sudo systemctl start todolist

docker-build:

	docker build -t cdelezenski/myapp .

run-slideshow:
	
	docker run -p 8888:8888 -t -i -v /Volumes/nt:/usr/src/app/nt -d cdelezenski/myapp 

run-todo:
	
	docker run -p 8000:8000 -t -i  -d cdelezenski/myapp 

