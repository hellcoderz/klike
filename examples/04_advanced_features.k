/ Adverbs: Over (/)
/ Sum over
$+/ 1 2 3 4
/ Product over
$*/ 1 2 3 4
/ Join over (unary)
$,/ (1 2; 3 4)

/ Primitives: Take (#) and Drop (_)
data: 10 20 30 40 50
/ Take first 2
$2 # data
/ Take last 2
$-2 # data
/ Drop first 2
$2 _ data

/ Primitives: Where (&)
mask: 1 0 1 0 1
$mask
$& mask
/ Combine Where and Indexing to filter
$data[& mask]

/ Primitives: Match (~)
$1 2 3 ~ 1 2 3
$1 2 3 ~ 1 2

/ Conditionals: $[c; t; f]
x: 10
$"x is ", $[x > 5; "big"; "small"]
x: 2
$"x is ", $[x > 5; "big"; "small"]
