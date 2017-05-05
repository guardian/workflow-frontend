# Workflow Public static assets
Assets organised as follows:

    workflow
    ├── public
    │   ├── app.js     - application bootstrap.
    │   ├── components - common self contained components sharable across multiple pages.
    │   ├── layouts    - whole page layouts (grids, templates, etc), and the core layout.
    │   ├── lib        - shared JavaScript service libraries.


## Package management
Uses [jspm](http://jspm.io) for client-side external dependencies.

The `../scripts/setup.sh` script will install jspm locally via `npm` and then use
jspm to install all client-side dependencies in the `jspm_packages` directory.

[System.js](https://github.com/systemjs/systemjs) is used for client-side
module loading. Its a universal module loader, enabling loading of ES6 modules,
AMD, CommonJS and global scripts.

[`config.js`](config.js) configures System.js by mapping package names to the
packages installed with `jspm`.

The [jspm-cli](https://github.com/jspm/jspm-cli) tool can be used for
including new dependencies, or upgrading packages.

## Stylesheets
Workflow uses [Sass](http://sass-lang.com) for CSS pre-processing.

Stylesheets within `prototype/public/**/*.scss` will be automatically compiled
in SBT as part of the build process when building in TeamCity or when running
locally in development mode. Source maps are generated also.

Classes should be specified in [Block Element Modifier (BEM)](http://bem.info/).

    .[block]--[element]__[modifier]

General style guidelines:
- Each element should always have a single distinct class to represent it. Avoid multiple
  classes on a single element.
- Styles should only be applied to classes and not HTML elements. Pseudo-classes
  and elements are fine.
- Styles common to multiple elements should extend from a placeholder, or mixin.
- Avoid nesting classes for specifity.

Running Sass build manually:

    sbt "project prototype" web-assets:sass

## SVG Icons
Icons in Workflow are SVG files. At the moment, they are combined into a single concatenated SVG manually (`components/icons/icons.svg`). Each icon is declared in the `<defs>` element and given its own group (`<g>`) with a unique identifier. This identifier is used by the icon directive defined in `components/icons/icons.js`, which re-uses each icon using the `<use>` element, referencing the icon's unique ID.



Example Icon Sprite file:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
        <g id="example">
            <path d="..." />
        </g>
    </defs>
</svg>
```


Icon directive
```html
<i wf-icon="example" />
```
Appends SVG:
```xml
<svg class="wf-icon--active wf-icon-type--example" viewBox="0 0 128 128">
    <use xlink:href="#icon-example"></use>
</svg>
```


## Javascript unit tests
- Tests written in [mocha](http://visionmedia.github.io/mocha/)
- [chai](http://chaijs.com/) for assertions
- [sinon](http://sinonjs.org/) for stubs/mocks
- [angular-mock](https://code.angularjs.org/1.2.20/docs/api/ngMock) for mocking angular dependencies
- Test runner using [Karma](http://karma-runner.github.io/)

To run tests:

    cd /home/workflow/prototype
    npm install
    npm test

> Note: Currently having issues when running with phantomjs, but works well in Chrome.
> When the runner has started, visit http://localhost:9876/ in a browser to attach it as a test runner.
