/// <binding AfterBuild='scripts' />
var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var es = require('event-stream');

var mvpFiles = [
    "src/mvp/Model",
    "src/mvp/Collection",
    "src/mvp/View",
    "src/mvp/Presenter",
    "src/mvp/install"
];
var routingFiles = [
    "src/routing/UrlHash",
    "src/routing/Route",
    "src/routing/RouteConfig",
    "src/routing/install"
];
var servicesFiles = [
    "src/services/ServiceConfig",
    "src/services/install"
];

gulp.task('scripts', function () {
    return es.merge(
        // mvp
        gulp.src(mvpFiles.map(file => file + '.ts'))
            .pipe(concat('dcore-mvp-1.0.0.ts'))
            .pipe(gulp.dest('dist')),

        gulp.src(mvpFiles.map(file => file + '.js'))
        .pipe(concat('dcore-mvp-1.0.0.js'))
        .pipe(minify({
            ext: { min: '.min.js' },
            mangle: false,
            preserveComments: 'some'
        }))
        .pipe(gulp.dest('dist')),

        // routing
        gulp.src(routingFiles.map(file => file + '.ts'))
            .pipe(concat('dcore-routing-1.0.1.ts'))
            .pipe(gulp.dest('dist')),

        gulp.src(routingFiles.map(file => file + '.js'))
        .pipe(concat('dcore-routing-1.0.1.js'))
        .pipe(minify({
            ext: { min: '.min.js' },
            mangle: false,
            preserveComments: 'some'
        }))
        .pipe(gulp.dest('dist')),

        // services
        gulp.src(servicesFiles.map(file => file + '.ts'))
            .pipe(concat('dcore-services-1.0.0.ts'))
            .pipe(gulp.dest('dist')),

        gulp.src(servicesFiles.map(file => file + '.js'))
        .pipe(concat('dcore-services-1.0.0.js'))
        .pipe(minify({
            ext: { min: '.min.js' },
            mangle: false,
            preserveComments: 'some'
        }))
        .pipe(gulp.dest('dist'))
    );
});