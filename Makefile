MERGED_DIR = tests_merged
TESTS_DIR = tests
COMPILERS = $(wildcard $(TESTS_DIR)/*)

.PHONY: mergeTests
mergeTests:
	@$(echo) rm -rf $(MERGED_DIR)/*; \
	$(echo) mkdir -p $(MERGED_DIR); \
    for f in $(COMPILERS); do \
      $(echo) cp -r $$f/* $(MERGED_DIR); \
	done; \

.PHONY: clean
clean:
	rm -rf ./output
