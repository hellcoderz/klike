/ JSON Parsing and Stringifying (5:)

/ Sample JSON string
json: "{\"name\":\"Alice\",\"scores\":[10,20,30],\"meta\":{\"id\":123}}"
$"Original JSON:"
$json

/ Parse JSON into a K structure (dictionaries and lists)
$"Parsed K structure:"
data: 5: json
$data

/ Access data
$"Name: ", data[`name]
$"Last Score: ", $data[`scores][2]
$"Meta ID: ", $data[`meta][`id]

/ Modify data
data[`name]: "Bob"
data[`scores][0]: 99

/ Stringify back to JSON
$"Modified JSON:"
$data 5: ""

/ Real-world use case: Parsing HTTP responses
$"Fetching and parsing from httpbin..."
url: "https://httpbin.org/get"
resp: 3: url
presp: 5: resp
$"Origin IP: ", presp[`origin]
$"Headers Keys: ", $!presp[`headers]
