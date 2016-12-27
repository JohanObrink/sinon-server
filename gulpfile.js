const gulp = require('gulp')
const eslint = require('gulp-eslint')
const mocha = require('gulp-mocha')

const running = {}
const watching = {}
const files = {
  src: ['lib/**/*.js'],
  test: ['test/**/*.js'],
  misc: ['gulpfile.js']
}

gulp.task('lint', () => {
  running.lint = []
    .concat(files.src)
    .concat(files.test)
    .concat(files.misc)
  return gulp.src(running.lint)
    .pipe(eslint())
    .pipe(eslint.format())
})

gulp.task('test', () => {
  running.test = []
    .concat(files.test)
    .concat(files.src)
  return gulp.src(running.test[0])
    .pipe(mocha({reporter: 'spec'}))
})

gulp.task('watch', () => {
  return Object.keys(running)
    .filter(key => !watching[key])
    .map(key => {
      watching[key] = true
      return gulp.watch(running[key], [key])
    })
})
