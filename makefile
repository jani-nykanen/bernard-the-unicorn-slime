LEVEL_FOLDER := ./levels
MAPCONV := ./scripts/mapconverter.py
LEVEL_SRC_PATH := ./source/leveldata.ts
JS_FILES := $(wildcard js/source/*.js)
ifeq ($(CLOSURE_PATH),)
	CLOSURE_PATH := ./closure/closure.jar
endif

all: js

.PHONY: js
js:
	tsc
watch:
	tsc -w

server:
	python3 -m http.server

linecount:
	find . -name '*.ts' | xargs wc -l


.PHONY: levels
levels:
	echo -n "export const LEVEL_DATA : string[] = [" > $(LEVEL_SRC_PATH)
	$(MAPCONV) $(LEVEL_FOLDER)/1.tmx >> $(LEVEL_SRC_PATH)
	$(MAPCONV) $(LEVEL_FOLDER)/2.tmx >> $(LEVEL_SRC_PATH)
	$(MAPCONV) $(LEVEL_FOLDER)/3.tmx >> $(LEVEL_SRC_PATH)
	$(MAPCONV) $(LEVEL_FOLDER)/4.tmx >> $(LEVEL_SRC_PATH)
	$(MAPCONV) $(LEVEL_FOLDER)/5.tmx >> $(LEVEL_SRC_PATH)
	$(MAPCONV) $(LEVEL_FOLDER)/6.tmx >> $(LEVEL_SRC_PATH)
	$(MAPCONV) $(LEVEL_FOLDER)/7.tmx >> $(LEVEL_SRC_PATH)
	echo -n "]" >> $(LEVEL_SRC_PATH)



##########################################


.PHONY: closure
closure:
	rm -rf ./temp
	mkdir -p temp
	java -jar $(CLOSURE_PATH) --js $(JS_FILES) --js_output_file temp/out.js --compilation_level ADVANCED_OPTIMIZATIONS --language_out ECMASCRIPT_2020


compress: js closure


.PHONY: pack
pack:
	mkdir -p temp
	cp templates/index.html temp/index.html
	cp font.png temp/font.png
	cp base.png temp/base.png

.PHONY: zip
zip: 
	(cd temp; zip -r ../dist.zip .)
	advzip -z dist.zip
	wc -c dist.zip

.PHONY: clear_temp
clear_temp:
	rm -rf ./temp 


.PHONY: dist 
dist: compress pack zip clear_temp
