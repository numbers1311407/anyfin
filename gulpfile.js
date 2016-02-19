var gulp = require("gulp")
  , concat = require("gulp-concat")
  , rename = require("gulp-rename")
  , uglify = require("gulp-uglify")
  , sass = require("gulp-sass")
  , order = require("gulp-order")

gulp.task("vendor-js", function () {
  var paths = [
    "bower_components/angular/angular.js",
    "bower_components/angular/angular.js",
    "bower_components/d3/d3.js",
    "bower_components/jquery/dist/jquery.js",
    "bower_components/bootstrap-sass/assets/javascripts/bootstrap/transition.js",
    "bower_components/bootstrap-sass/assets/javascripts/bootstrap/collapse.js",
    "bower_components/bootstrap-sass/assets/javascripts/bootstrap/dropdown.js",
    "bower_components/nvd3/build/nv.d3.js",
    "bower_components/angular-nvd3/dist/angular-nvd3.js",
    "bower_components/underscore/underscore.js"
  ];
  gulp.src(paths)
    .pipe(concat("vendor.js"))
    .pipe(gulp.dest("dist/js"))
    .pipe(rename("vendor.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("dist/js"));
});

gulp.task("vendor-css", function () {
  gulp.src("src/scss/vendor.scss")
    .pipe(sass({
      includePaths:[ "bower_components"]
    }).on("error", sass.logError))
    .pipe(gulp.dest("dist/css/"))
    .pipe(rename("vendor.min.css"))
    .pipe(sass({
      includePaths:[ "bower_components"],
      outputStyle: "compressed"
    }).on("error", sass.logError))
    .pipe(gulp.dest("dist/css"))
});

gulp.task("app-js", function () {
  gulp.src("src/js/**/*.js")
    .pipe(order([
      "helpers.js",
      "models/*.js",
      "app.js"
    ], {base: "src/js"}))
    .pipe(concat("app.js"))
    .pipe(gulp.dest("dist/js"));
});

gulp.task("app-css", function () {
  gulp.src("src/scss/style.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("./dist/css/"))
});

gulp.task("watch", function () {
  gulp.watch("src/scss/**/*.scss", ["app-css"]);
  gulp.watch("src/js/**/*.js", ["app-js"]);
});

gulp.task("vendor", ["vendor-js", "vendor-css"]);
gulp.task("dist", ["vendor", "app-js", "app-css"]);
gulp.task("default", ["dist"]);
