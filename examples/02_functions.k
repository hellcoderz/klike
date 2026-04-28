/ Function definition
add: {x + y}
$add[10; 20]

/ Default arguments (x, y, z are implicit)
double: {x * 2}
$double[10]

/ Function as data (one at a time)
f1: {x + 1}
$f1[10]

/ Closure
make_adder: { [n] {x + n} }
add5: make_adder[5]
$add5[10]
