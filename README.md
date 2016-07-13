# gulp-build
A [GulpJS](https://github.com/gulpjs) plugin that allows creating a production-ready build for your [AngularJS](http://angularjs.org) application.

> While this plugin is intended to be used along Angular applications, it is not specific to it and can be used with other types of projects, provided they are organized in a similar fashion.

[![js-semistandard-style](https://cdn.rawgit.com/flet/semistandard/master/badge.svg)](https://github.com/Flet/semistandard)

This is somewhat based on build tasks included in [John Papa's gulpfile patterns](https://github.com/johnpapa/gulp-patterns/blob/gulp4/gulpfile.js).

## Installation
`gulp-build` is a **Gulp 3.9.x plugin**. It defines a `CustomRegistry` that groups common build-related tasks, such as uglyfying, minification, rebasing of assets references and revisioning.

```bash
git clone http://github.com/nfantone/gulp-build.git
cd gulp-build
npm install
```

### Requirements
- Gulp 3.9.x
- npm 3.6.0+

To install ~4.0.0 Node.js/npm on Ubuntu/Debian/Mint:

```bash
# Note setup script name for Node.js v4.x
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -

# Then install with:
sudo apt-get install -y nodejs
```

> The branch you are viewing this on, intends to support Gulp ~3.9 by emulating features already available in Gulp 4.0+. For a Gulp 4.0+ ready version, please use any of the tagged releases.

## Usage
### Simple
In your `gulpfile.js` declare:

```javascript
var gulp = require('gulp');
require('gulp-build').register(gulp);
```

And then, you can call in all the tasks described in the API below, such as:

```bash
gulp build
```

### Advanced
You may pass in an `options` configuration object to `gulp-build` to override some or all of the default settings.

```javascript
var gulp = require('gulp');
require('gulp-build').register(gulp, {
    build: './build'  
});
```

You can check out a sample `config.json` file [here](http://github.com/nfantone/gulp-build/master/config.json).
- Actions performed by the build can be switched on or off to accommodate to your needs. For example, if you don't care about revisioning of files you can override `optimize` settings like so:

```javascript
const gulp = require('gulp');
const reworkUrl = require('rework-plugin-url');

require('gulp-build').register(gulp, {
    build: './build',
    optimize: {
      vendors: 'vendors.min.js',
      app: 'app.min.js',
      rev: false,
      ngAnnotate: true,
      uglify: true,
      useref: true // applies concatenation of files
  },
  // Arguments to be passed to gulp-rework on CSS files
  rework: [reworkUrl((url) => {
    // Make all fonts URLs on .css relative to root
    return url
      .replace(/^[./]*\/fonts/, '../fonts')
      .replace(/^[./]*\/images/, '../images');
  })];
});
```

> All `optimize` actions are enabled by default.

- Use `resources` setting to move any custom files excluded from the build (i.e.: anything not specifically described by globs in `src` or `assets`) to the `dist` directory. Resources will be moved as is, without any modification or optimization. For example, if you want to include a `favicon.ico` in your output, you way do so this way:

```javascript
const gulp = require('gulp');
require('gulp-build').register(gulp, {
    resources: 'src/app/favicon.ico' // Can also be an Array or Object (see below)
});
```

> `resources` accept the same arguments as `gulp.src`, but bear into mind that [only globs will preserve directory structure](https://github.com/gulpjs/gulp/issues/151#issuecomment-32341841) in the output.

You can also explicitly indicate a base directory by using the following alternative syntax, which can be used interchangeably:

```javascript
const gulp = require('gulp');
require('gulp-build').register(gulp, {
    resources: [{
      root: '.',
      patterns: 'icons/hi-def/thump-up.cls'
    }, 'src/app/favicon.ico']
});
```


## Scaffolding
`gulp-build` doesn't impose many restrictions on how your application should be structured. However, some minimal rules regarding directories should be followed. If you are following [Google Angular App Structure Recommendations](https://docs.google.com/document/d/1XXMvReO8-Awi1EZXAXS4PzDzdNvV6pGcuaF4Q9821Es/pub) or [John Papa's Angular style guide](https://github.com/johnpapa/angular-styleguide), you are already set up.
- There must be a single sources (`.js`, `.css`, `.less`, `.html`) root folder. E.g.: `src/app`
- There must be an assets (fonts and images) root folder, separated from the sources. E.g.: `src/assets`
- You must be using [bower](https://bower.io) to manage your project's dependencies. E.g.: `bower_components`

## API
### `register(gulpInst, [options])`
Declares `inject` and `build` recipes as tasks to the `gulp` instance passed as argument.

`options` is an optional object that can be defined to override the following sensible defaults:

```javascript
{
  tasks: {
    build: 'build',
    inject: 'inject'
  },
    root: './',
    src: {
        root: 'src/app',
        js: [
            '**/*.js',
            '!**/*{test,.spec}.js'
        ],
        html: '**/*.html',
        styles: '**/*.css',
        index: 'index.html'
    },
    temp: './.tmp',
    build: './dist',
    assets: {
        root: 'src/assets',
        fonts: 'fonts/**/*.*',
        images: 'images/**/*.*'
    },
    bower: {
        directory: 'bower_components',
        ignorePath: '../../bower_components'
    },
    templateCache: {
        file: 'app.templates.js',
        options: {
            module: 'app.core',
            standAlone: false,
            moduleSystem: 'IIFE',
            root: '/'
        }
    },
    rework: [],
    optimize: {
      vendors: 'vendors.min.js',
      app: 'app.min.js',
      rev: true,
      ngAnnotate: true,
      uglify: true,
      useref: true
    }
}
```

All paths must be relative to the `root` property of the object that contains them (where applicable), which in turn, are relative to the `root` property of their parent. For instance, `assets.fonts` and `assets.images` globs are relative to `assets.root`, while `assets.root` is relative to `root`.

### `inject`
Wires `bower` dependencies, `js` and styles into HTML index. Also, builds and injects an [Angular template cache](https://docs.angularjs.org/api/ng/service/$templateCache).

```bash
gulp inject
```

### `build`
Performs `inject`, after optimization/minification/uglyfication and revisioning of `.js`, compiled `.css` and assets files. Moves everything to `build` directory, including arbitrary resources and files defined by `"resources"`.

```bash
gulp build
```

### `package`
Performs `build` and generates a `tar.gz` file named after the `"name"` and `"version"` on `package.json` with the contents of the `config.build` directory (`./dist`, by default). It deletes any previous file with the same name and path before compressing.

```bash
gulp package
```

> Names of tasks can be changed to whatever you want by configuring `tasks.build`, `task.package` and/or `tasks.inject` properties.

## License
MIT
