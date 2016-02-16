'use strict';

var sequence = require('gulp-sequence');
var GulpBuilder = require('./lib/build');
var BuildConfig = require('./lib/config');

var Registry = (function() {
  function BuildRegistry(options) {
    this.options = options;
  }

  BuildRegistry.prototype.init = function init(taker) {
    var config = new BuildConfig(this.options);
    var builder = new GulpBuilder(config);

    var recipes = {};

    taker.task('wiredep', builder.wiredep);
    taker.task('styles', builder.styles);
    taker.task('templates', builder.templateCache);
    taker.task('inject:css', builder.injectCSS);
    taker.task('inject:templates', builder.injectTemplateCache);
    taker.task('images', builder.images);
    taker.task('fonts', builder.fonts);
    taker.task('optimize', builder.optimize);
    taker.task('assets', builder.assets);
    taker.task('resources', builder.resources);
    taker.task('cleanup', builder.cleanup);

    if (config.templateCache.enabled) {
      recipes.inject = sequence(['wiredep', 'styles', 'templates'],
        'inject:css', 'inject:templates');
    } else {
      recipes.inject = sequence(['wiredep', 'styles'], 'inject:css');
    }

    recipes.build = sequence(['images', 'fonts', config.tasks.inject],
      'optimize', 'assets', 'resources', 'cleanup');

    taker.task(config.tasks.build, recipes.build);
    taker.task(config.tasks.inject, recipes.inject);
    taker.task(config.tasks.package, [config.tasks.build], builder.package);
  };

  return BuildRegistry;
})();

module.exports = {
  register: function(taker, options) {
    var registry = new Registry(options);
    registry.init(taker);
  }
};
