/ String Join and Split
sep: ","
data: "apple" "banana" "cherry"
$"Original strings:"
$data
$"Joined with comma:"
s: sep / data
$s
$"Split back:"
$sep \ s

/ Function Adverbs: Iterate (n f/ x)
/ Apply {x+2} 5 times starting from 10
$"Iterate {x+2} 5 times from 10:"
$5 {x+2}/ 10

/ Function Adverbs: Converge (f/ x)
/ Keep halving until 0
$"Converge floor x/2 from 100:"
${_ x%2}/ 100

/ Amended Assignment
$"Amended Assignment:"
a: 1 2 3 4 5
$a
a[1]: 20
a[3]: 40
$a
/ Vector amend
a[0 2]: 10 30
$a

/ File I/O
$"File I/O (0:):"
file: "temp_example.txt"
file 0: ("Line 1"; "Line 2"; "Final Line")
content: 0: file
$"Content read from file:"
$content
