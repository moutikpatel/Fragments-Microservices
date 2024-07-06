# tests/integration/post-fragments-unsupported-type.hurl

# Authenticated POST to /v1/fragments
POST http://localhost:8080/v1/fragments

# SENDING UNSUPPORTED TYPE
Content-Type: audio/ogg

# Include HTTP Basic Auth credentials
[BasicAuth]
user1@email.com:password1

# Body of the request goes in ```...``` when it's a string
```Some audio```

# EXPECTED 415 - UNSUPPORTED MEDIA TYPE
HTTP/1.1 415
