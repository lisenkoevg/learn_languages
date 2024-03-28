define(`target', esyscmd(`echo -n $target'))dnl
define(`from', esyscmd(`echo -n $from'))dnl
define(`num', esyscmd(`echo -n $num'))dnl
substr(target, eval(from` - 1'), num)
