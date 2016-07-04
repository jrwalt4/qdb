var gulp = require('gulp');
var uglify = require('gulp-uglify')
gulp.task('build', function () {
    return gulp.src('src/qidb.js').pipe(uglify()).pipe(gulp.dest('./dist/'))
})

gulp.task('default', ['build'])