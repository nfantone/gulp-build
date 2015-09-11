var _ = require('lodash');
var path = require('path');

var Config = (function() {
  var self;

  function BuildConfig(options) {
    self = this;
    var config = _.defaults(options || {}, BuildConfig.DEFAULTS);

    // Make source directory relative to root
    config.src.root = this._absolutify(config.root, config.src.root);

    // Make js sources globs relative to source directory
    config.src.js = this._absolutify(config.src.root, config.src.js);

    config.src.html = this._absolutify(config.src.root, config.src.html);

    // Make styles sources globs relative to root directory
    config.src.styles = this._absolutify(config.src.root, config.src.styles);

    // Make fonts and images directories relative to root directory
    config.assets.root = this._absolutify(config.root, config.assets.root);
    config.assets.fonts = this._absolutify(config.assets.root, config.assets.fonts);
    config.assets.images = this._absolutify(config.assets.root, config.assets.images);

    // Make index file relative to source directory
    config.src.index = this._absolutify(config.src.root, config.src.index);

    // Make bower related directories relative to root
    config.bower.directory = this._absolutify(config.root, config.bower.directory);

    config.temp = this._absolutify(config.root, config.temp);
    config.build = this._absolutify(config.root, config.build);

    _.extend(this, config);
  }

  BuildConfig.prototype._joinPath = function(base, pathname) {
    return (/^!/).test(pathname) ? '!' + path.join(base, pathname.substring(1)) :
      path.join(base, pathname);
  };

  BuildConfig.prototype._absolutify = function(base, pathnames) {
    if (Array.isArray(pathnames)) {
      var joins = [];
      pathnames.forEach(function(entry) {
        joins.push(self._joinPath(base, entry));
      });
      return joins;
    } else {
      return self._joinPath(base, pathnames);
    }
  };

  BuildConfig.DEFAULTS = {
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
  };

  return BuildConfig;
})();

module.exports = Config;
