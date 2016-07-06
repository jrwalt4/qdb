var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap')

var tsProject = ts.createProject('tsconfig.json');

gulp.task('buildjs', function () {
    return gulp.src('src/qdb.js')
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify()).pipe(rename('qidb.min.js')).pipe(gulp.dest('./dist/'))
})

gulp.task('buildts', function() {
    
    return tsProject.src().pipe(concat('qdb-compiled.ts'))
        .pipe(wrap('namespace <%= module.name %>{<%= module.contents %>}',
            {name:'qdb'}, 
            {variable:'module'}))
        .pipe(ts(tsProject)).js
        .pipe(gulp.dest('./src'));
})

gulp.task('default', ['buildjs'])