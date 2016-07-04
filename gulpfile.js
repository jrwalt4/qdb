var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('build', function () {
    return gulp.src('src/qidb.js')
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify()).pipe(rename('qidb.min.js')).pipe(gulp.dest('./dist/'))
})

gulp.task('default', ['build'])