/ Rich Web Tables

/ Sample dataset
data: `name`iq`city!("Alice" "Bob" "Charlie"; 145 120 135; "NY" "LDN" "SF")

$"Raw Dictionary:"
$data

$"Formatted as HTML Table:"
$data 6: "html"

$"Formatted as Markdown Table:"
$data 6: "md"

/ Large dataset for cyclic take
rows: 10 # data
$"10 Rows Table:"
$rows 6: "html"
