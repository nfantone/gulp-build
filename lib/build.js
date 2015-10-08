var args = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var $ = require('gulp-load-plugins')({
  rename: {
    'gulp-log2': 'log'
  }
});
var rimport = require('rework-import');
var path = require('path');
var del = require('del');
var _ = require('lodash');

var Builder = (function() {
  var self;

  function GulpBuilder(config) {
    self = this;
    this.config = config;
  }

  /**
   * Delete all files in a given path
   * @param  {Array}   path - array of paths to delete
   */
  GulpBuilder.prototype.cleanFiles = function(paths) {
    $.log('Cleaning: ' + paths);
    del.sync(paths);
  };

  /**
   * Wire-up the bower dependencies
   * @return {Stream}
   */
  GulpBuilder.prototype.wiredep = function wiredep() {
    var wdep = require('wiredep').stream;
    var options = {
      bowerJson: require(path.resolve(path.join(self.config.root, 'bower.json'))),
      directory: self.config.bower.directory,
      ignorePath: self.config.bower.ignorePath
    };
    return gulp
      .src(self.config.src.index)
      .pipe($.log('Wiring "main" bower dependencies into html', {
        title: 'gulp-build'
      }))
      .pipe(wdep(options))
      .pipe($.inject(
        gulp.src(self.config.src.js)
        .pipe($.naturalSort())
        .pipe($.angularFilesort()), {
          ignorePath: self.config.src.root
        }))
      .pipe(gulp.dest(self.config.src.root));
  };

  GulpBuilder.prototype.injectCSS = function injectcss() {
    return gulp
      .src(self.config.src.index)
      .pipe($.log('Wiring compiled css into html', {
        title: 'gulp-build'
      }))
      .pipe($.inject(gulp.src(path.join(self.config.temp, '**/*.css'), {
        read: false
      }), {
        ignorePath: self.config.temp
      }))
      .pipe(gulp.dest(self.config.src.root));
  };

  /**
   * Compile less to css
   * @return {Stream}
   */
  GulpBuilder.prototype.styles = function styles() {
    var files = [].concat(
      path.join(self.config.temp, '/**/*.css'),
      path.join(self.config.build, '/**/*.css')
    );
    self.cleanFiles(files);

    return gulp
      .src(self.config.src.styles)
      .pipe($.log('Compiling [.less, .styl, .scss] -> .css', {
        title: 'gulp-build'
      }))
      // exit gracefully if something fails after this
      .pipe($.plumber())
      .pipe($.if(/[.]less$/, $.less()))
      .pipe($.if(/[.]scss$/, $.scss()))
      .pipe($.if(/[.]styl$/, $.styl(rimport())))
      .pipe($.autoprefixer({
        browsers: ['last 2 version', '> 5%']
      }))
      .pipe(gulp.dest(self.config.temp));
  };

  /**
   * Copy and rev bower and custom fonts.
   * @return {Stream}
   */
  GulpBuilder.prototype.fonts = function fonts() {
    self.cleanFiles(path.join(self.config.build, '**/*.{eot, svg, woff, woff2, ttf}'));
    var bowerFonts = require('main-bower-files')({
      filter: '**/*.{eot,svg,ttf,woff,woff2}'
    });
    return gulp
      .src(self.config.assets.fonts, {
        base: self.config.assets.root
      })
      .pipe($.addSrc(bowerFonts))
      .pipe($.rev())
      .pipe($.log('Moving fonts', {
        title: 'gulp-build'
      }))
      .pipe($.if(new RegExp(self.config.assets.root), gulp.dest(self.config.build), gulp.dest(path.join(self.config.build, 'fonts'))))
      .pipe($.rev.manifest(path.join(self.config.build, 'rev-manifest.json'), {
        base: path.join(process.cwd(), self.config.build),
        merge: true
      }))
      .pipe(gulp.dest(self.config.build));
  };

  /**
   * Compress and rev images
   * @return {Stream}
   */
  GulpBuilder.prototype.images = function images() {
    self.cleanFiles(path.join(self.config.build, '/**/*.{jpg, jpeg, gif, png, svg}'));

    return gulp
      .src(self.config.assets.images, {
        base: self.config.assets.root
      })
      .pipe($.rev())
      .pipe($.log('Optimizing and moving images', {
        title: 'gulp-build'
      }))
      .pipe($.imagemin({
        optimizationLevel: 4
      }))
      .pipe(gulp.dest(self.config.build))
      .pipe($.rev.manifest(path.join(self.config.build, 'rev-manifest.json'), {
        base: path.join(process.cwd(), self.config.build),
        merge: true
      }))
      .pipe(gulp.dest(self.config.build));
  };

  /**
   * Formatter for bytediff to display the size changes after processing
   * @param  {Object} data - byte data
   * @return {String}      Difference in bytes, formatted
   */
  GulpBuilder.prototype._byteDiffFormatter = function(data) {
    var difference = data.savings > 0 ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
      (data.startSize / 1000).toFixed(2) + ' kB to ' +
      (data.endSize / 1000).toFixed(2) + ' kB and is ' +
      ((1 - data.percent) * 100).toFixed(2) + '%' + difference;
  };

  /**
   * Create $templateCache from the html templates
   * @return {Stream}
   */
  GulpBuilder.prototype.templateCache = function templatecache() {
    var templateOptions = _.defaults(self.config.templateCache.options, {
      root: self.config.src.root
    });
    self.cleanFiles(path.join(self.config.temp, '/**/*.js'));
    var htmls = [].concat(self.config.src.html, '!' + self.config.src.index);
    return gulp
      .src(htmls)
      .pipe($.log('Creating an AngularJS $templateCache'))
      .pipe($.if(args.verbose, $.bytediff.start()))
      .pipe($.minifyHtml({
        empty: true,
        quotes: true
      }))
      .pipe($.if(args.verbose, $.bytediff.stop(self._byteDiffFormatter)))
      .pipe($.angularTemplatecache(
        self.config.templateCache.file,
        templateOptions
      ))
      .pipe(gulp.dest(self.config.temp));

  };

  GulpBuilder.prototype.injectTemplateCache = function injecttemplates() {
    var templateCache = path.join(self.config.temp, self.config.templateCache.file);
    return gulp
      .src(self.config.src.index)
      .pipe($.log('Wiring templates into html', {
        title: 'gulp-build'
      }))
      .pipe($.inject(gulp.src(templateCache, {
        read: false
      }), {
        name: 'inject:templates',
        ignorePath: self.config.temp
      }))
      .pipe(gulp.dest(self.config.src.root));
  };

  /**
   * Format and return the header for files
   * @return {String} Formatted file header
   */
  GulpBuilder.prototype._writeHeader = function() {
    var template = ['/**',
      ' * <%= pkg.name %> - <%= pkg.description %>',
      ' * @authors <%= pkg.authors %>',
      ' * @version v<%= pkg.version %>',
      ' * @link <%= pkg.homepage %>',
      ' * @license <%= pkg.license %>',
      ' */',
      ''
    ].join('\n');
    return $.header(template, {
      pkg: require(path.resolve(path.join(self.config.root, 'package.json')))
    });
  };

  /**
   * Replace previously revisioned assets names and paths
   * on js and css sources.
   */
  GulpBuilder.prototype.assets = function assets() {
    var manifest = gulp.src(path.join(self.config.build, 'rev-manifest.json'));
    return gulp.src(path.join(self.config.build, '/**/*.{js,css}'))
      .pipe($.plumber())
      .pipe($.revReplace({
        manifest: manifest
      }))
      .pipe(gulp.dest(self.config.build));
  };

  /**
   * Optimize all files, move to a build folder,
   * and inject them into the new index.html
   * @return {Stream}
   */
  GulpBuilder.prototype.optimize = function optimize() {
    var assets = $.useref.assets({
      searchPath: [self.config.src.root,
        self.config.bower.directory, self.config.temp
      ],
      noconcat: !self.config.optimize.concat
    });
    // Filters are named for the gulp-useref path
    var cssFilter = $.filter('**/*.css', {
      restore: true
    });
    var jsAppFilter = $.filter('**/' + self.config.optimize.app, {
      restore: true
    });
    var jslibFilter = $.filter('**/' + self.config.optimize.vendors, {
      restore: true
    });
    var customFilter = $.filter(self.config.optimize.filter);

    self.cleanFiles([].concat(
      path.join(self.config.build, '**/*.js'),
      path.join(self.config.build, '**/*.html')
    ));

    return gulp
      .src(self.config.src.index)
      .pipe($.log('Optimizing js, css, and html'))
      .pipe($.plumber())
      .pipe(assets) // Gather all assets from the html with useref
      // Get the css
      .pipe(cssFilter)
      .pipe($.csso())
      .pipe(cssFilter.restore)
      // Get the custom javascript
      .pipe(jsAppFilter)
      .pipe($.if(self.config.optimize.ngAnnotate,
        $.ngAnnotate({
          add: true
        })))
      .pipe($.if(self.config.optimize.uglify, $.uglify()))
      .pipe(self._writeHeader())
      .pipe(jsAppFilter.restore)
      // Get the vendor javascript
      .pipe(jslibFilter)
      .pipe($.if(self.config.optimize.uglify, $.uglify())) // another option is to override wiredep to use min files
      .pipe(jslibFilter.restore)
      // Take inventory of the file names for future rev numbers
      .pipe($.if(self.config.optimize.rev, $.rev()))
      // Apply the concat and file replacement with useref
      .pipe(assets.restore())
      .pipe($.if(self.config.optimize.useref, $.useref()))
      // Replace the file names in the html with rev numbers
      .pipe($.if(self.config.optimize.rev, $.revReplace()))
      .pipe(customFilter)
      .pipe(gulp.dest(self.config.build));
  };

  /**
   * Move arbitrary files to dest directory without any
   * processing
   * @return {Stream}
   */
  GulpBuilder.prototype.resources = function resources() {
    return gulp
      .src(self.config.resources)
      .pipe($.log('Moving resources', {
        title: 'gulp-build'
      }))
      .pipe($.print())
      .pipe(gulp.dest(self.config.build));
  };

  return GulpBuilder;
})();

module.exports = Builder;
