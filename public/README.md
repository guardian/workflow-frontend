# Workflow Public static assets
Assets organised as follows:

    workflow
    ├── public
    │   ├── app.js     - application bootstrap.
    │   ├── components - common self contained components sharable across multiple pages.
    │   ├── layouts    - whole page layouts (grids, templates, etc), and the core layout.
    │   ├── lib        - shared JavaScript service libraries.


## Package management
Uses [webpack](https://webpack.github.io/) for client-side external dependencies. This is configured in conf/webpack.conf.js.

The `../scripts/setup.sh` script will install all node modules (including webpack) locally, then use webpack to bundle dependencies.

[yarn](https://yarnpkg.com/en/) is used for declarative package management.

## Stylesheets
Workflow uses [Sass](http://sass-lang.com) for CSS pre-processing.

Any .scss or .css file will be bundled using webpack.

Classes should be specified in [Block Element Modifier (BEM)](http://bem.info/).

    .[block]--[element]__[modifier]

General style guidelines:
- Each element should always have a single distinct class to represent it. Avoid multiple
  classes on a single element.
- Styles should only be applied to classes and not HTML elements. Pseudo-classes
  and elements are fine.
- Styles common to multiple elements should extend from a placeholder, or mixin.
- Avoid nesting classes for specifity.

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
    yarn install
    yarn test

> Note: Currently having issues when running with phantomjs, but works well in Chrome.
> When the runner has started, visit http://localhost:9876/ in a browser to attach it as a test runner.
