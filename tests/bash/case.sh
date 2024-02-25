
seq 11 15 |
while read var
do
  case $var in
    11)
      echo 11
      ;;
    12 | 13)
      echo 12 or 13
      ;;
    *4)
      echo "*4"
      ;;
    *)
      echo other
      ;;
  esac
done
