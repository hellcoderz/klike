/ Sorting: Grade Up (<) and Grade Down (>)
data: 30 10 50 20
$"Original data:"
$data
$"Indices to sort (Grade Up):"
i: < data
$i
$"Sorted data (indexing with i):"
$data[i]
$"Indices to sort (Grade Down):"
$data[> data]

/ Grouping (=)
$"Group by value (= 1 0 1 1):"
$= 1 0 1 1

/ Enlist (,) and Floor (_)
$"Enlist 10:"
$, 10
$"Floor 10.5:"
$_ 10.5
$"Floor list:"
$_ 1.2 2.9 3.5

/ Built-in Math Functions
$"Sqrt 16:"
$sqrt 16
$"Abs -10 20 -30:"
$abs -10 20 -30
$"Sin of 0 0.5 1 (multiplied by pi approx 3.14):"
$sin 0 1.57 3.14

/ Complex example: Filter and Sort
/ Filter data > 20, then sort descending
prices: 15 42 10 88 23
mask: prices > 20
filtered: prices[& mask]
$"Prices > 20:"
$filtered
$"Sorted descending:"
$filtered[> filtered]
