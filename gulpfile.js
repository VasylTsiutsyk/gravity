const projectFolder = 'dist';
const srcFolder = 'src';

const path = {
    build: {
        html: projectFolder + '/',
        css: projectFolder + '/css/',
        js: projectFolder + '/js/',
        img: projectFolder + '/img/',
        fonts: projectFolder + '/fonts/'
    },
    src: {
        html: [srcFolder + '/*.html', '!' + srcFolder + '/_*.html'],
        css: srcFolder + '/scss/style.scss',
        js: srcFolder + '/js/script.js',
        img: srcFolder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
        fonts: srcFolder + '/fonts/*.ttf'
    },
    watch: {
        html: srcFolder + '/**/*.html',
        css: srcFolder + '/scss/**/*.scss',
        js: srcFolder + '/js/**/*.js',
        img: srcFolder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
    },
    clean: './' + projectFolder + '/'
}

const fs = require('fs');
const gulp = require('gulp');
const { src, dest } = require('gulp');
const browsersync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const groupmedia = require('gulp-group-css-media-queries');
const cleancss = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const webpcss = require('gulp-webp-css');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require("vinyl-source-stream");
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');



function browserSync() {
    browsersync.init({
        server: {
            baseDir: './' + projectFolder + '/'
        },
        port: 3000,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(scss({
            outputStyle: 'expanded'
        }))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 5 versions'],
            cascade: true
        }))
        .pipe(groupmedia())
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(cleancss())
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return browserify({ entries: [path.src.js] })
        .transform(babelify.configure({
            presets: ['@babel/env']
        }))
        .bundle()
        .pipe(source("script.js"))
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(sourcemaps.init())
        .pipe(uglify({
            toplevel: true
        }))
        .pipe(sourcemaps.write('./maps'))
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}


function images() {
    return src(path.src.img)
        .pipe(webp({
            qualify: 70
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imagemin({
            progressive: true,
            optimizationLevel: 3
        }))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', function() {
    return src([srcFolder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(srcFolder + '/fonts/'))
})



function fontsStyle() {

    const fileContent = fs.readFileSync(srcFolder + '/scss/fonts.scss');
    if (fileContent == '') {
        fs.writeFile(srcFolder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function(err, items) {
            if (items) {
                let cFontName;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (cFontName != fontname) {
                        fs.appendFile(srcFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    cFontName = fontname;
                }
            }
        })
    }
}

function cb() {}

function watchFiles() {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], images)
}

function clean() {
    return del(path.clean)
}


const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browserSync);


exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.html = html;
exports.css = css;
exports.js = js;

exports.build = build;
exports.watch = watch;
exports.default = watch;