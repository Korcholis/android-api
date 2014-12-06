Android API
===========

##Overview

Android API is a Node package that lets you connect to the `adb` and `android`
command lines with a simple interface.

It is meant to be _promise based_, and let you do common tasks available to the
Android command lines, such as:

- Create a project, either Gradle or Ant compliant.
- Compile it as a debuggable or releasable `apk`.
- Connect to one, or many, devices or emulators.
- Install an `apk` or push any file to any of your devices.

##Promise based - _almost_

The library uses promises to make almost every calls.

There is one single exception. Since promises are meant to be started and ended relatively fast, logcat (a long running process) gets new logs from your applications through a callback. You can see more on the `examples.js` file.

##Examples

There's a file which contains a lot of chained examples of app usage. It's also a quick example on how to chain calls to get the best results.

##Procedure to follow

_Note: Make sure you have `adb` and `android` commands accessible from your command line._

1. Always start calling `android_api.init()`. With this call, you ensure the `adb` command is accessible and the server is started.
2. create a `then` response to this, and call inside the next process, for instance, `android.logcat`. Don't forget to return the promise to the calling function.
3. Give it "1", an object `{ output : 'json' }` and a callback, which returns the logcat new logs. "1" notes you want the first device, but it could be a device id in the form of an array: `[device_id]`. The output marked in json returns each logcat entry as a json entry, instead of plain text.
4. Put a `catch` method afterwards, so it gets any previous error.
5. Finally, mark the end of this procedure with `done`.

Here it is, also available in the `examples.js` file.

       android.init()
        .then(function() {
          return android.logcat(
            "1",
            { output : 'json' },
            function(logcat_data) {
              console.log(logcat_data);
            });
          }
        )
        .catch(function(err) {
          console.error(err);
        })
        .done();


##What's working, already?

The library currently lets you:

- Init `adb` server.
- Get the connected devices to the computer.
- Compile an `ant` based project.
- Start listening to logcats.

##Documentation

The whole library is JSdoc compliant. If you clone the package, you can run:

    npm run-script docs

Inside the package folder, and it will create all the documentation structure
into `./docs/`. You can change the path to where it is stored by modifying the
`package.json` file.


##Collaboration

The library is still in **alpha**, and multiple methods are defined but empty. If you
wish to collaborate and make them, don't hesitate to make a pull request!

##Testing

Awwwww! I started coding blindlessly. I've been testing with my devices but I
have not deeply tested it, unfortunately. If you wish to start testing it, I'm actually free to suggestions in terms of libraries and procedures.

##License

Copyright (c) 2014, Sergi Juanola <korcholis@gmail.com>

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
