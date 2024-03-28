#!/bin/bash

# Regenerate README.md
# Run from pre-commit hook
# . ./README.sh

m4 < README.m4 > README_.md || exit 1
dos2unix -q README_.md || exit 1
diff -qN README.md README_.md > /dev/null && {
  echo README.md is not changed
  rm -f README_.md
} || {
  echo README.md changed
  mv -f README_.md README.md
  git add README.md
}
