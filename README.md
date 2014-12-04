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


##Documentation

The whole library is JSdoc compliant. If you clone the package, you can run:

    npm run-script docs

Inside the package folder, and it will create all the documentation structure
inside `./docs/`

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
