gulp-build
==========

[![Greenkeeper badge](https://badges.greenkeeper.io/nfantone/gulp-build.svg)](https://greenkeeper.io/)

A [GulpJS](https://github.com/gulpjs) plugin that allows creating a production-ready build for your [AngularJS](http://angularjs.org) application.

> While this plugin is intended to be used along Angular applications, it is not specific to it and can be used with
> other types of projects, provided they are organized in a similar fashion.

This is somewhat based on build tasks included in [John Papa's gulpfile patterns](https://github.com/johnpapa/gulp-patterns/blob/gulp4/gulpfile.js).


## Installation

`gulp-build` is a **Gulp 4.0+ plugin**. It defines a `CustomRegistry` that groups common build-related tasks, such as
 uglyfying, minification, rebasing of assets references and revisioning.


```bash
git clone http://github.com/nfantone/gulp-build.git
cd gulp-build
npm install
```

### Requirements

* Gulp 4.0+
* npm 2.12+

To install ~0.12 Node.js/npm on Ubuntu/Debian/Mint:

```bash
# Note setup script name for Node.js v0.12
curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -

# Then install with:
sudo apt-get install -y nodejs
```

> GulpJS 4.0 is yet to be publicly released. For now, use the `gulpjs/gulp#4.0` branch or follow [this](https://demisx.github.io/gulp4/2015/01/15/install-gulp4.html) guide.


## Usage

### Simple

In your `gulpfile.js` declare:

```javascript
var gulp = require('gulp');
var GulpBuild = require('gulp-build');

gulp.registry(new GulpBuild());
```

And then, you can call in all the tasks described in the API below, such as:

```bash
gulp build
```

### Advanced

You may pass in an `options` configuration object to `GulpBuild` to override some or all of the default
settings.

```javascript
var gulp = require('gulp');
var GulpBuild = require('gulp-build');

gulp.registry(new GulpBuild({
    build: './build'  
}));
```

You can check out a sample `config.json` file [here](http://github.com/nfantone/gulp-build/master/config.json).

## Scaffolding

`gulp-build` doesn't impose many restrictions on how your application should be structured. However, some minimal
rules regarding directories should be followed. If you are following [Google Angular App Structure Recommendations](https://docs.google.com/document/d/1XXMvReO8-Awi1EZXAXS4PzDzdNvV6pGcuaF4Q9821Es/pub)
or [John Papa's Angular style guide](https://github.com/johnpapa/angular-styleguide), you are already set up.

* There must be a single sources (`.js`, `.css`, `.less`, `.html`) root folder. E.g.: `src/app`
* There must be an assets (fonts and images) root folder, separated from the sources. E.g.: `src/assets`
* You must be using [bower](https://bower.io) to manage your project's dependencies. E.g.: `bower_components`


## API

### `new GulpBuild([options])`

Constructs a new Gulp [custom registry](https://github.com/phated/undertaker/blob/master/README.md#custom-registries), ready
to be added to the existing registry via `gulp.registry`.

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
	optimize: {
		vendors: 'vendors.min.js',
		app: 'app.min.js'
	}
}
```

All paths must be relative to the `root` property of the object that contains them (where applicable), which in turn, are
relative to the `root` property of their parent. For instance, `assets.fonts` and `assets.images` globs are relative to
`assets.root`, while `assets.root` is relative to `root`.

### `inject`

Wires `bower` dependencies, `js` and styles into HTML index. Also, builds and injects an [Angular template cache](https://docs.angularjs.org/api/ng/service/$templateCache).

```bash
gulp inject
```

### `build`

Performs `inject`, after optimization/minification/uglyfication and revisioning of `.js`, compiled `.css` and assets
files. Moves everything to `build` directory.

```bash
gulp build
```

> Names of both tasks can be changed to whatever you want by configuring `tasks.build` and/or `tasks.inject` properties.

## License

MIT
