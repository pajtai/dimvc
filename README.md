# dimvc

## Usage

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

## Testing

dimvc was built with testing in mind. Dependency injection makes testing easy.

Use `dimvc.test()` to run tests. The test method returns a dependable container with all the dependencies hooked up.
This means mocks can be easilly injected at test time.

For example to test userController that depends on UserModel (this example is in the [hello world](https://github.com/pajtai/dimvc-hello-world) )

```javascript
dimvc
    .test(root)
    // .test returns a dependable container, so we can mock out dependencies at resolve time:
    .resolve({
        UserModel : MockUserModel
    }, function(userController) {
        userController.showUser()(req, function() {}, function() {});
        findOneStub.should.have.been.calledWith({
            _id: '007'
        });
        done();
    });
```

See the [hello world](https://github.com/pajtai/dimvc-hello-world) for an example.


* 2014-10-17 0.0.0 Unit and integration test support
* 2014-10-15 0.0.0-beta.3 Adding github info to pkg.json
* 2014-10-15 0.0.0-beta.2 Work around models and added body parse
* 2014-10-14 0.0.0-beta.1 Initial release
