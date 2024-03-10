python_eval: python_eval.c
	$(CC) -std=c99 -ggdb3 -O0 -pedantic-errors -Wall -Wextra \
	-fpie $$(python3-config --cflags --embed) -o $@ \
	$^ $$(python3-config --embed --ldflags)
