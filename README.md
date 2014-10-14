# dimvc

Experimental mvc framework built on top of [express](http://expressjs.com/) using argument name dependency injection ([dependable](https://www.npmjs.org/package/dependable)).

Dependencies are auto created based on the name of the files in several directories.

The structure is as follows:

    + api
    +---+ controllers
        + models
        + services
        + routes.js
    + config
    + public
    + views

Dependencies are created from files in the structure. There are also some default dependencies:

* log (winston)
* mongoose (instance of mongooseQ)

For example a logging service that would be required in as `loggingService` and located in `api/services/logginsService`, would be written:

```javascript
'use strict';
module.export = function(log) {
    // winston is available as log, because I named my argument, "log"
    return function(something) {
        log.info('oh wow, ' + something);
    }
}
```

See the [hello world](https://github.com/pajtai/dimvc-hello-world) for an example.


