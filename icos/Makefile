FILES = $(shell find icos -maxdepth 1 -type f -iname "*.*" | sed 's/icos/output2\/icos/g')
#CONVERT_CMD = convert $< -resize 100x100\! -monochrome  $@ 
CONVERT_CMD = convert $< -resize 100x100\! -ordered-dither o8x8  $@

MSG = @echo "\nUpdating thumbnail" $@

all: $(FILES) 
 

output2/icos/%: icos/%
#	echo $(CONVERT_CMD)
#	$(MSG)
	$(CONVERT_CMD)
