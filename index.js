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
    recipes.inject = sequence([builder.wiredep, builder.styles, builder.templateCache],
      builder.injectCSS, builder.injectTemplateCache);
    recipes.build = sequence([builder.images, builder.fonts, recipes.inject], builder.optimize, builder.assets);

    taker.task(config.tasks.inject, recipes.inject);
    taker.task(config.tasks.build, recipes.build);
  };

  return BuildRegistry;
})();

module.exports = {
  register: function(taker, options) {
    var registry = new Registry(options);
    registry.init(taker);
  }
};
