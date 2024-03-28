define(`regexp', esyscmd(`echo -n $regexp'))dnl
define(`replacement', esyscmd(`echo -n $replacement'))dnl
define(`target', esyscmd(`echo -n $target'))dnl
patsubst(target, regexp, replacement)
