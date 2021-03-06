#!/bin/bash

set -e

[ -z "$1" ] && echo "number of partitions required" && exit 1
[ -z "$2" ] && echo "partition number required" && exit 1
[ -z "$3" ] && echo "test file expression required" && exit 1

tests="$(find "$(dirname "$(readlink -f "$0")")" -name $3 | sort)"
no="$(echo "$tests" | wc -l)"
psize="$(($no / $1 + 1))"

# echo "found $no tests, partitions with size $psize"

if [ "$2" -eq "1" ]
then
  echo "$tests" | head -n $psize
else
  echo "$tests" | tail -n +$(( 1 + ($psize * ($2 - 1)))) | head -n $psize
fi

exit 0
