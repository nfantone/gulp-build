'use strict';

var util = require('util');
var GulpBuilder = require('./lib/build');
var BuildConfig = require('./lib/config');
var DefaultRegistry = require('undertaker-registry');

var BuildRegistry = (function () {

	function BuildRegistry(options) {
		this.options = options;
		DefaultRegistry.call(this);
	}

	util.inherits(BuildRegistry, DefaultRegistry);

	BuildRegistry.prototype.init = function init(taker) {
		var builder = new GulpBuilder(new BuildConfig(this.options));

		var recipes = {};
		recipes.inject = taker.series(taker.parallel(builder.wiredep, builder.styles, builder.templateCache),
			builder.injectCSS, builder.injectTemplateCache);
		recipes.build = taker.series(taker.parallel(builder.images, builder.fonts, recipes.inject),
			builder.optimize, builder.assets);

		taker.task('inject', recipes.inject);
		taker.task('build', recipes.build);
	};

	return BuildRegistry;
})();

module.exports = BuildRegistry;
