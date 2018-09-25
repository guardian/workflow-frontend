# Troubleshooting

## AWS Auth
Are you seeing `Unable to load AWS credentials from any provider in the chain` on app start?

Workflow looks up AWS resources by tag on app start. This requires the internet. If you're connected to GNM-Guest, 
ensure you're logged in otherwise any calls the AWS SDK makes will get trapped by the login portal! 🤪

```console
14:38:46.003 [run-main-0] WARN com.amazonaws.util.EC2MetadataUtils - Unable to parse EC2 instance info (<HTML><HEAD><TITLE> Web Authentication Redirect</TITLE><META http-equiv="Cache-control" content="no-cache"><META http-equiv="Pragma" content="no-cache"><META http-equiv="Expires" content="-1"><META http-equiv="refresh" content="1; URL=https://gnmguest.theguardian.com/fs/customwebauth/login.html?switch_url=https://gnmguest.theguardian.com/login.html&ap_mac=64:12:25:2c:ee:30&client_mac=6c:40:08:90:8d:e6&wlan=GNM-Guest&redirect=169.254.169.254/latest/dynamic/instance-identity/document"></HEAD></HTML>
) : Unexpected character ('<' (code 60)): expected a valid value (number, String, array, object, 'true', 'false' or 'null')
 at [Source: [B@14459d55; line: 1, column: 2]
com.fasterxml.jackson.core.JsonParseException: Unexpected character ('<' (code 60)): expected a valid value (number, String, array, object, 'true', 'false' or 'null')
 at [Source: [B@14459d55; line: 1, column: 2]
```

Alternatively, just use an ethernet. 
