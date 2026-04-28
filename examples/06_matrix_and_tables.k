/ Matrix and Transpose
m: (1 2 3; 4 5 6)
$"Matrix:"
$m
$"Transposed:"
$+m

/ Deep Indexing
$"Deep Indexing (m . 1 0):"
$m . 1 0

/ Each-Left and Each-Right
$"Each-Left (1 2 3 +\: 10):"
$1 2 3 +\: 10
$"Each-Right (10 +/: 1 2 3):"
$10 +/: 1 2 3

/ Combinations (Matrix multiplication-like or cross product)
$"Each-Left with Each-Right (cross add):"
/ 1 2 3 +\: /: 10 20
/ Wait, our parser handles one adverb at a time.
/ Let's try simple ones.
$(1 2 3) +\: (10 20)

/ Dictionaries and Tables
d: `name`iq!("Alice" "Bob"; 150 120)
$"Dict d:"
$d
$"Keys !d:"
$!d
$"Values .d:"
$.d
$"Flip d (Table):"
$+d

/ Tables are lists of dicts
t: +d
$"Table t[0]:"
$t[0]
$"Name of t[1]:"
$t[1][`name]
