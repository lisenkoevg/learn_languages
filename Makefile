TESTS_DIR = tests
MERGED_DIR = tests_merged
COMPILERS = $(wildcard $(TESTS_DIR)/*)

.PHONY: mergeTests
mergeTests:
	$(info Merge tests for different compilers to dir '$(MERGED_DIR)'...)
	@$(echo) rm -rf $(MERGED_DIR)/*; \
	$(echo) mkdir -p $(MERGED_DIR); \
	for f in $(COMPILERS); do \
	  $(echo) cp -r $$f/* $(MERGED_DIR); \
	done; \

.PHONY: clean
clean:
	$(info Clean output...)
	rm -rf ./output; \
	find . -depth -type d -name __pycache__ -execdir rm -rf '{}' \;

.PHONY: showExcluded
showExcluded:
	$(info Tests, excluded with dot (.name):)
	@find ./tests -name ".*"
