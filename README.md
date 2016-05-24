##Firebase listener

NodeJS server with the purpose of listening to certain Firebase events.

###Generating the code
Run the transform.sh script, which will generate the main application code. Items are somewhat special, and some code needs to be fixed manually:

```javascript
//line 12
//var itemRef = ref.child("items"); should be
var itemRef = ref.child("items").child("alert");
```

