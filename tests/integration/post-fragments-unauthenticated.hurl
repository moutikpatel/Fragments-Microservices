# tests/integration/post-fragments-unauthenticated.hurl

# UNAUTHENTICATED POST REQ
POST http://localhost:8080/v1/fragments
# We're sending a plain text fragment
Content-Type: text/plain
# Body of the request goes in ```...``` when it's a string
```This is a fragment!```

# We expect a 401 Unauthorized response
HTTP/1.1 401
