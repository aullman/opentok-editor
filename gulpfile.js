var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

gulp.task('default', function(){
    gulp.src(['bower_components/ot/dist/ot.js', 'bower_components/ot/lib/server.js', 'src/*.js'])
        .pipe(jshint())
        .pipe(concat('opentok-editor.js'))
        .pipe(gulp.dest('./'))
        .pipe(uglify({preserveComments: "some"}))
        .pipe(rename('opentok-editor.min.js'))
        .pipe(gulp.dest('./'));
});