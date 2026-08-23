LEVEL_FOLDER := ./levels
MAPCONV := ./scripts/mapconverter.py
LEVEL_SRC_PATH := ./source/leveldata.ts


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
	echo -n "]" >> $(LEVEL_SRC_PATH)
