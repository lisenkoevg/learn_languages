ifneq (a,)
  $(info 'a' not equal empty)
endif

ifneq (a,b)
  $(info 'a' not equal 'b')
endif

all:
