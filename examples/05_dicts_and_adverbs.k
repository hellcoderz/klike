/ Dictionaries
d: `name`age!("Alice"; 30)
$"Name: ", d[`name]
$"Age: ", $d[`age]

/ Adverbs: Scan (\)
/ Cumulative sum
$+\ 1 2 3 4 5

/ Adverbs: Each (')
/ Iota each
$! ' 2 3 4

/ Reshape (#)
/ Create a 2x3 matrix
m: 2 3 # !6
$m
/ Cyclic take
$10 # 1 2 3

/ Reverse and Rotate (|)
$| 1 2 3 4
/ Rotate left by 1
$1 | 1 2 3 4
/ Rotate right by 1
$-1 | 1 2 3 4

/ Logic and Control Flow
check: {[n] $[n > 0; `pos; `neg]}
$check 10
$check -5
