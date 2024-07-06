# tests/integration/post-fragments-charset.hurl

# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments

# We're sending a plain text fragment
Content-Type: text/plain; charset=utf-8

# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1

# Body of the request goes in ```...``` when it's a string
```This is a fragment!```

# 1. We expect to get back an HTTP 201
HTTP/1.1 201

[Asserts]
jsonpath "$.fragment.type" == "text/plain; charset=utf-8"
