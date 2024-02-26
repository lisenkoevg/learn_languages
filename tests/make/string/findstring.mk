str = aa bb cc
$(info $(str))
$(info $(findstring bb, $(str)))
$(info $(findstring d, $(str)))
$(info $(findstring b, $(str)))

all:
