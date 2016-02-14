var gulp = require('gulp')
  , concat = require('gulp-concat')
  , rename = require('gulp-rename')
  , uglify = require('gulp-uglify')
  , uglifycss = require('gulp-uglifycss')

gulp.task('vendor-js', function () {
  var paths = [
    "bower_components/angular/angular.js",
    "bower_components/d3/d3.js",
    "bower_components/nvd3/build/nv.d3.js",
    "bower_components/angular-nvd3/dist/angular-nvd3.js"
  ];
  gulp.src(paths)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('js'))
    .pipe(rename('vendor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('js'));
});

gulp.task('vendor-css', function () {
  var paths = [
    "bower_components/titip/dist/css/titip.css",
    "bower_components/nvd3/build/nv.d3.css"
  ];
  gulp.src(paths)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('css'))
    .pipe(rename('vendor.min.css'))
    .pipe(uglifycss())
    .pipe(gulp.dest('css'));
});

gulp.task('dist', ['vendor-js', 'vendor-css']);
gulp.task('default', ['dist']);
