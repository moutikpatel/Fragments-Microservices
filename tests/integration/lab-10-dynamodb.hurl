
# == TEST 1 ==
# ===========================================================================
# ** POST ** a new text fragment to http://localhost:8080 as an authorized user
# he fragment's body should be the JSON value, { "service": "DynamoDB" }.
# ===========================================================================

POST http://localhost:8080/v1/fragments

Content-Type: application/json

[BasicAuth]
user1@email.com:password1 

{ "service": "DynamoDB" }

HTTP/1.1 201

[Captures]
fragment1_url: header "Location"
fragment1_id: jsonpath "$.fragment.id"

# == TEST 2 ==
# ===========================================================================
# GET the fragment info (i.e., metadata) for the fragment you just created using 
# the Location URL/info as an authorized user and confirm that the server 
# returns a 200 and that all of the metadata properties match what you expect.
# ===========================================================================

GET {{fragment1_url}}/info

[BasicAuth]
user1@email.com:password1 

HTTP/1.1 200

[Asserts]
jsonpath "$.fragment.id" == {{fragment1_id}}
jsonpath "$.fragment.type" == "application/json"


# == TEST 3 ==
# ===========================================================================
# POST a second Markdown fragment to http://localhost:8080 as the same authorized user.
# The fragment's body should be the Markdown value, DynamoDB is **great**.
# ===========================================================================

POST http://localhost:8080/v1/fragments

Content-Type: text/markdown

[BasicAuth]
user1@email.com:password1

```DynamoDB is **great**.```

HTTP/1.1 201

[Captures]
fragment2_url: header "Location"
fragment2_id: jsonpath "$.fragment.id"

# == TEST 4 ==
# ===========================================================================
# GET the fragment info (i.e., metadata) you just created using the url/info
# as an authorized user and confirm that the server returns a 200 
# and that all of the metadata properties match what you expect.
# ===========================================================================

GET {{fragment2_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.fragment.id" == {{fragment2_id}}
jsonpath "$.fragment.type" == "text/markdown"

# == TEST 5 ==
# ===========================================================================
# GET all of the fragments for the same authorized user without expanding them
# (i.e., just get back the IDs) and confirm that the list of fragments 
# includes the two id values you captured above
# ===========================================================================

GET http://localhost:8080/v1/fragments

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.fragments" includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}

# == TEST 6 ==
# ===========================================================================
# DELETE the first fragment you created above and confirm it returns 200
# ===========================================================================

DELETE {{fragment1_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

# == TEST 7 ==
# ===========================================================================
# GET the first fragment again using the url you captured above as the authorized user.
# ===========================================================================

GET {{fragment1_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

# == TEST 8 ==
# ===========================================================================
# GET all of the fragments for the same authorized user without expanding them
# (i.e., just get back the IDs) a second time, and confirm that the first id
# is NOT included but that the second id is (i.e., that the second was deleted).
# ===========================================================================

GET http://localhost:8080/v1/fragments

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.fragments" not includes {{fragment1_id}}
jsonpath "$.fragments" includes {{fragment2_id}}
