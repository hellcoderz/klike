/ HTTP GET
$"Fetching from httpbin.org/get..."
url: "https://httpbin.org/get"
resp: 3: url
$"Response size: ", $#resp
/ Print first 100 chars
$100 # resp

/ HTTP POST
$"Posting to httpbin.org/post..."
data: "name=Alice&age=30"
posturl: "https://httpbin.org/post"
resp2: data 3: posturl
$"POST Response size: ", $#resp2
$100 # resp2
