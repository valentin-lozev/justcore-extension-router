/// <binding AfterBuild='scripts' />
var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var es = require('event-stream');

var routingFiles = [
    "src/UrlHash",
    "src/Route",
    "src/RouteConfig",
    "src/install"
];

gulp.task('scripts', function () {
    return es.merge(        
        gulp.src(routingFiles.map(file => file + '.ts'))
            .pipe(concat('dcore-routing.ts'))
            .pipe(gulp.dest('dist')),

        gulp.src(routingFiles.map(file => file + '.js'))
        .pipe(concat('dcore-routing.js'))
        .pipe(minify({
            ext: { min: '.min.js' },
            mangle: false,
            preserveComments: 'some'
        }))
        .pipe(gulp.dest('dist'))
    );
});