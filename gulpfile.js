import gulp from 'gulp';
import ts from 'gulp-typescript';
import {deleteAsync} from 'del';

var tsProject = ts.createProject("tsconfig.json");
gulp.task("build", function () {
    return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"));
});
gulp.task("clean", function () {
    return deleteAsync(["./dist", "./tmp"]);
})
gulp.task("default", gulp.series("clean", "build"));