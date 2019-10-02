// jshint esversion: 6
// jshint node: true
"use strict";

// package vars
const pkg = require("./package.json");

// gulp
const gulp = require('gulp');

// load all plugins in "devDependencies" into the variable $
const $ = require("gulp-load-plugins")({
    pattern: ["*"],
    scope: ["devDependencies"]
});

// load browsersync and initiate
const browsersync = require("browser-sync").create();
const print = require('gulp-print').default;

// Critical CSS array
const criticalCssArray = pkg.globs.critical;

// Downloads array
const downloadsArray = pkg.globs.download;

// error logging
const onError = (err) => {
    console.log(err);
};

// MacOs username
var userName = 'mattpalmer';

// Banner
const banner = (function() {
    let result = "";
    try {
        result = [
            "/**",
            " * @project        <%= pkg.name %>",
            " * @author         <%= pkg.author %>",
            " * @build          " + $.moment().format("llll") + " ET",
            " * @release        " + $.gitRevSync.long() + " [" + $.gitRevSync.branch() + "]",
            " * @copyright      Copyright (c) " + $.moment().format("YYYY") + ", <%= pkg.copyright %>",
            " *",
            " */",
            ""
        ].join("\n");
    }
    catch (err) {
    }
    return result;
})();

// Compile sass and generate sourcemaps
function sassTask() {
    $.fancyLog("-> Compiling scss");
    return gulp.src(pkg.paths.src.scss + pkg.vars.scssName)
        .pipe($.plumber({errorHandler: onError}))
        .pipe($.sourcemaps.init({loadMaps: true}))
        .pipe($.sass({
            includePaths: pkg.paths.scss
          })
          .on("error", $.sass.logError))
        .pipe($.autoprefixer())
        .pipe($.sourcemaps.write('./'))
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe(gulp.dest(pkg.paths.build.css));
}

// Combine distribution css and minimize into public css folder and add banner
function cssTask() {
    $.fancyLog("-> Building css");
    return gulp.src(pkg.globs.distCss)
        .pipe($.plumber({errorHandler: onError}))
        .pipe($.newer({dest: pkg.paths.dist.css}))
        .pipe(print())
        .pipe($.sourcemaps.init({loadMaps: true}))
        .pipe($.concat(pkg.vars.siteCssName))
        .pipe($.if(process.env.NODE_ENV === "production",
            $.cssnano({
                discardComments: {
                    removeAll: true
                },
                discardDuplicates: true,
                discardEmpty: true,
                minifyFontValues: true,
                minifySelectors: true
            })
        ))
        .pipe($.header(banner, {pkg: pkg}))
        .pipe($.sourcemaps.write("./"))
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe(gulp.dest(pkg.paths.dist.css))
        .pipe($.filter("**/*.css"))
        // Add browsersync stream pipe after compilation
        .pipe($.browserSync.stream());
}

// tailwind task - build the Tailwind CSS
function tailwind() {
  $.fancyLog("-> Compiling tailwind css");
  return gulp.src(pkg.paths.tailwindcss.src)
      .pipe($.postcss([
          $.tailwindcss(pkg.paths.tailwindcss.conf),
          require("autoprefixer"),
      ]))
      .pipe($.if(process.env.NODE_ENV === "production",
          $.purgecss({
              extractors: [{
                  extractor: TailwindExtractor,
                  extensions: ["html", "twig", "css", "js"]
              }],
              whitelist: pkg.globs.purgecssWhitelist,
              content: pkg.globs.purgecss
          })
      ))
      .pipe(gulp.dest(pkg.paths.build.css));
}

// Custom PurgeCSS extractor for Tailwind that allows special characters in
// class names.
//
// https://github.com/FullHuman/purgecss#extractor
class TailwindExtractor {
    static extract(content) {
        return content.match(/[A-z0-9-:\/]+/g);
    }
}

// Favicons generator
function faviconsGenerate() {
    $.fancyLog("-> Generating favicons");
    return gulp.src(pkg.paths.favicon.src)
        .pipe($.favicons({
            appName: pkg.name,
            appDescription: pkg.description,
            developerName: pkg.author,
            developerURL: pkg.urls.live,
            background: "#FFFFFF",
            path: pkg.paths.favicon.path,
            url: pkg.site_url,
            display: "standalone",
            orientation: "portrait",
            version: pkg.version,
            logging: false,
            online: false,
            html: pkg.paths.build.html + "favicons.html",
            pipeHTML: true,
            replace: true,
            icons: {
                android: false, // Create Android homescreen icon. `boolean`
                appleIcon: true, // Create Apple touch icons. `boolean`
                appleStartup: false, // Create Apple startup images. `boolean`
                coast: true, // Create Opera Coast icon. `boolean`
                favicons: true, // Create regular favicons. `boolean`
                firefox: true, // Create Firefox OS icons. `boolean`
                opengraph: false, // Create Facebook OpenGraph image. `boolean`
                twitter: false, // Create Twitter Summary Card image. `boolean`
                windows: true, // Create Windows 8 tile icons. `boolean`
                yandex: true // Create Yandex browser icon. `boolean`
                }
            }))
      .pipe(gulp.dest(pkg.paths.favicon.dest));
}

// Copy favicon
function copyFavicon() {
    $.fancyLog("-> Copying favicon.ico");
    return gulp.src(pkg.globs.siteIcon)
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe(gulp.dest(pkg.paths.dist.base));
}

// Imagemin minimize images
function imageMin() {
    $.fancyLog("-> Minimizing images in " + pkg.paths.src.img);
    return gulp.src(pkg.paths.src.img + "**/*.{png,jpg,jpeg,gif,svg}")
        .pipe($.imagemin({
            progressive: true,
            interlaced: true,
            optimizationLevel: 7,
            svgoPlugins: [{removeViewBox: false}],
            verbose: true,
            use: []
        }))
        .pipe(gulp.dest(pkg.paths.dist.img));
}

// Set the node environment to development
async function setDevNodeEnv() {
    $.fancyLog("-> Setting NODE_ENV to development");
    return process.env.NODE_ENV = "development";
}

// set the node environment to production
async function setProdNodeEnv() {
    $.fancyLog("-> Setting NODE_ENV to production");
    return process.env.NODE_ENV = "production";
}

// Static assets version increase
function staticAssetsVersion() {
  return gulp.src(pkg.paths.craftConfig + "general.php")
      .pipe($.replace(/'staticAssetsVersion' => (\d+),/g, function(match, p1, offset, string) {
          p1++;
          $.fancyLog("-> Changed staticAssetsVersion to " + p1);
          return "'staticAssetsVersion' => " + p1 + ",";
      }))
      .pipe(gulp.dest(pkg.paths.craftConfig));
}

// BrowserSync
function browserSync(done) {
  $.fancyLog("-> BrowserSync listening for changes");
  browsersync.init({
    proxy: 'https://' + pkg.name + '.test',
        host: pkg.name + '.test',
        open: 'external',
        port: 8000,
        https: {
            key:
                '/Users/' +
                userName +
                '/.config/valet/Certificates/' +
                pkg.name +
                '.test.key',
            cert:
                '/Users/' +
                userName +
                '/.config/valet/Certificates/' +
                pkg.name +
                '.test.crt'
        }
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Process the critical path CSS one at a time
function processCriticalCSS(done) {
  const tasks = criticalCssArray.map(criticalCssArray => {
    return (taskDone) => {
      // [Omitted] Do stuff ...
      const criticalSrc = pkg.urls.critical + criticalCssArray.url;
      const criticalDest = pkg.paths.templates + criticalCssArray.template + "_critical.min.css";

      let criticalWidth = 1200;
      let criticalHeight = 1200;
      if (criticalCssArray.template.indexOf("amp_") !== -1) {
        criticalWidth = 600;
        criticalHeight = 19200;
      }

      $.fancyLog("-> Generating critical CSS: " + $.chalk.cyan(criticalSrc) + " -> " + $.chalk.magenta(criticalDest));

      $.critical.generate({
          src: criticalSrc,
          dest: criticalDest,
          penthouse: {
              blockJSRequests: false,
              forceInclude: pkg.globs.criticalWhitelist
          },
          inline: false,
          ignore: [],
          css: [
              pkg.paths.dist.css + pkg.vars.siteCssName,
          ],
          minify: true,
          width: criticalWidth,
          height: criticalHeight
      }, (err, output) => {
          if (err) {
              $.fancyLog($.chalk.magenta(err));
          }
        });
      taskDone();
    }
  });

  return gulp.series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

// babel js task - transpile our Javascript into the build directory
function jsBabel() {
  $.fancyLog("-> Transpiling Javascript via Babel...");
  return gulp.src(pkg.globs.babelJs)
      .pipe($.plumber({errorHandler: onError}))
      .pipe($.newer({dest: pkg.paths.build.js}))
      .pipe($.babel({
            presets: ['@babel/env']
      }))
      .pipe($.size({gzip: true, showFiles: true}))
      .pipe(gulp.dest(pkg.paths.build.js));
}

// inline js task - minimize the inline Javascript into _inlinejs in the templates path
function jsInline() {
    $.fancyLog("-> Copying inline js");
    return gulp.src(pkg.globs.inlineJs)
        .pipe($.plumber({errorHandler: onError}))
        .pipe($.if(["*.js", "!*.min.js"],
            $.newer({dest: pkg.paths.templates + "_inlinejs", ext: ".min.js"}),
            $.newer({dest: pkg.paths.templates + "_inlinejs"})
        ))
        .pipe($.if(["*.js", "!*.min.js"],
            $.uglify()
        ))
        .pipe($.if(["*.js", "!*.min.js"],
            $.rename({suffix: ".min"})
        ))
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe(gulp.dest(pkg.paths.templates + "_inlinejs"))
        .pipe($.filter("**/*.js"))
        // Add browsersync stream pipe after compilation
        .pipe($.browserSync.stream());
}

// js task - minimize any distribution Javascript into the public js folder, and add our banner to it
function jsBuild() {
    $.fancyLog("-> Building js");
    return gulp.src(pkg.globs.distJs)
        .pipe($.plumber({errorHandler: onError}))
        .pipe($.if(["*.js", "!*.min.js"],
            $.newer({dest: pkg.paths.dist.js, ext: ".min.js"}),
            $.newer({dest: pkg.paths.dist.js})
        ))
        .pipe($.if(["*.js", "!*.min.js"],
            $.uglify()
        ))
        .pipe($.if(["*.js", "!*.min.js"],
            $.rename({suffix: ".min"})
        ))
        .pipe($.header(banner, {pkg: pkg}))
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe(gulp.dest(pkg.paths.dist.js))
        .pipe($.filter("**/*.js"))
        .pipe($.browserSync.stream());
}

// Download external assets to server
function downloadFiles(done) {
  const tasks = downloadsArray.map(downloadsArray => {
    return (taskDone) => {
      // [Omitted] Do stuff ...
      const downloadSrc = downloadsArray.url;
      const downloadDest = downloadsArray.dest;

      $.fancyLog("-> Downloading URL: " + $.chalk.cyan(downloadSrc) + " -> " + $.chalk.magenta(downloadDest));
      $.download(downloadSrc)
          .pipe(gulp.dest(downloadDest));
      taskDone();
    }
  });

  return gulp.series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

// Watch files
function watchFiles() {
    gulp.watch([pkg.paths.src.scss + "**/*.scss"], gulp.series(tailwind, sassTask, cssTask, browserSyncReload));
    gulp.watch([pkg.paths.src.css + "**/*.css"], gulp.series(tailwind, sassTask, cssTask, browserSyncReload));
    gulp.watch(["tailwind.config.js"], gulp.series(tailwind, sassTask, cssTask, browserSyncReload));
    gulp.watch([pkg.paths.src.js + "**/*.js"], gulp.series(jsBabel, jsInline, jsBuild, browserSyncReload));
    gulp.watch([pkg.paths.templates + "**/*.{html,htm,twig}"], browserSyncReload);
}

// Copy fonts task
function fonts() {
  return gulp.src(pkg.globs.fonts)
      .pipe(gulp.dest(pkg.paths.dist.fonts));
}

// Default task, compile css and js, and initiate browserSync
exports.default = gulp.series(setDevNodeEnv, gulp.parallel(gulp.series(tailwind, sassTask, cssTask), gulp.series(jsBabel, jsInline, jsBuild)), gulp.parallel(watchFiles, browserSync));
exports.css = gulp.series(tailwind, sassTask, cssTask);

// Build task
exports.build = gulp.series(setProdNodeEnv, staticAssetsVersion, downloadFiles, faviconsGenerate, copyFavicon, imageMin, fonts, processCriticalCSS);
