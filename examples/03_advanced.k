/ Data structure
data: 10 20 30 40 50

/ Simple Indexing
$data[1]

/ Vector Indexing
$data[0 2 4]

/ Type Inspection
$@data
$@10
$@`abc
$@"hello"

/ Search (?)
$data ? 30
$data ? 100

/ Formatting and Output (join strings)
"The result is " , $ 2 + 2
