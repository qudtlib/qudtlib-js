import gulp from 'gulp';
import ts from 'gulp-typescript';
import {deleteAsync} from 'del';
import sourcemaps from 'gulp-sourcemaps';
import uglify from "gulp-uglify";

const tsProject = ts.createProject("tsconfig.json");

gulp.task("clean", function () {
    return deleteAsync(["./dist", "./tmp"]);
})
gulp.task("compress", function() {
    return gulp
        .src("dist/*.js", { sourcemaps: true })
        .pipe(uglify()).pipe(gulp.dest("dist", {
            sourcemaps: '.'
        }));
});
gulp.task('transpile', function() {
    return gulp.src('src/*.ts', { sourcemaps: true })
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(gulp.dest('dist', {
            sourcemaps: '.'
        } ));
});
gulp.task("build", gulp.series("transpile", "compress"));
gulp.task("default", gulp.series("clean", "build"));