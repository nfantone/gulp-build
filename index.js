var util = require('util');
var GulpBuilder = require('./lib/build');
var BuildConfig = require('./lib/config');
var DefaultRegistry = require('undertaker-registry');

var Registry = (function() {

  function BuildRegistry(options) {
    this.options = options;
    DefaultRegistry.call(this);
  }

  util.inherits(BuildRegistry, DefaultRegistry);

  BuildRegistry.prototype.init = function init(taker) {
    var config = new BuildConfig(this.options);
    var builder = new GulpBuilder(config);

    var recipes = {};
    recipes.inject = taker.series(taker.parallel(builder.wiredep, builder.styles, builder.templateCache),
      builder.injectCSS, builder.injectTemplateCache);
    recipes.build = taker.series(taker.parallel(builder.images, builder.fonts, recipes.inject),
      builder.optimize, builder.assets);

    taker.task(config.tasks.inject, recipes.inject);
    taker.task(config.tasks.build, recipes.build);
  };

  return BuildRegistry;
})();

module.exports = Registry;
