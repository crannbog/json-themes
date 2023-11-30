### 2024
### Crannbog GmbH

.PHONY: test, build, install, clean

##
#  use bash as shell
#
SHELL:=/bin/bash

###
# Current Year
#
YEAR:=$(shell date "+%Y")

##
#  root directory (Makefile location)
#
WORKING_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

all: install build test

build: install
	npm run build

dist: build
	@echo "dist"

develop: install
	@echo "This library doesn't support a live development mode. Use 'build' to create installable binaries."

test: 
	npm run lint
	npm run check
	npm run test

install: 
	npm install

clean:
	rm -rf $(WORKING_DIR)/dist
	rm -rf $(WORKING_DIR)/node_modules

rebuild: clean install build
	@echo "Rebuild completed."

publish: clean install
	npm run pub

update:
	npm list npm-check-updates -g || npm i npm-check-updates -g
	ncu -u -t minor
	@+make -s install