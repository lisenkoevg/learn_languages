object = hello

mixal_version = $(shell mixal -V | sed 1q)
mixsim_version = $(shell mixsim -V | sed 1q)

ifneq 'mixal (mix 2.0)' '$(mixal_version)'
  $(error mixal version error)
endif
ifneq 'mixsim (mix 2.0)' '$(mixsim_version)'
  $(error mixsim version error)
endif

all: $(object).deck $(object).list

$(object).list: $(object).mix
	@mixal $^ --xref --list-file=$@

$(object).deck: $(object).mix
	@mixal $^ -o $@

.PHONY: run clean

run:
	@mixal $(object).mix | mixsim 2> /dev/null ; echo -n ""

clean:
	@rm -f $(addprefix $(object), .deck .list)
