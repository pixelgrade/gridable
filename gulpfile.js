var plugin = 'gridable',
	source_SCSS = { admin: './admin/scss/**/*.scss', public: './public/scss/**/*.scss'},
	dest_CSS = { admin:'./admin/css/', public: './public/css/'},

	gulp 		= require( 'gulp-help' )( require( 'gulp' ) ),
    plugins = require( 'gulp-load-plugins' )(),
    fs = require('fs'),
    del = require('del');

var u = plugins.util,
    c = plugins.util.colors,
    log = plugins.util.log;

require('es6-promise').polyfill();


var options = {
	silent: true,
	continueOnError: true // default: false
};

function logError( err, res ) {
    log( c.red( 'Sass failed to compile' ) );
    log( c.red( '> ' ) + err.file.split( '/' )[err.file.split( '/' ).length - 1] + ' ' + c.underline( 'line ' + err.line ) + ': ' + err.message );
}

// -----------------------------------------------------------------------------
// Stylesheets
// -----------------------------------------------------------------------------

function stylesAdmin() {
    return gulp.src( source_SCSS.admin )
        .pipe( plugins.sass( {'sourcemap': false, style: 'compact'} ).on( 'error', logError ) )
        .pipe( plugins.autoprefixer( "last 1 version", "> 1%", "ie 8", "ie 7" ) )
        .pipe( gulp.dest( dest_CSS.admin ) );
}
stylesAdmin.description = 'Compiles admin css files';
gulp.task( 'styles-admin', stylesAdmin );

function stylesPublic() {
    return gulp.src( source_SCSS.public )
        .pipe( plugins.sass( {'sourcemap': false, style: 'compact'} ).on( 'error', logError ) )
        .pipe( plugins.autoprefixer( "last 1 version", "> 1%", "ie 8", "ie 7" ) )
        .pipe( gulp.dest( dest_CSS.public ) );
}
stylesPublic.description = 'Compiles frontend/public css files';
gulp.task( 'styles-public', stylesPublic );

function stylesSequence(cb) {
    return gulp.parallel( 'styles-admin', 'styles-public' )(cb);
}
stylesSequence.description = 'Compile styles';
gulp.task( 'styles', stylesSequence );

gulp.task('watch-admin', function () {
	return gulp.watch(source_SCSS.admin, stylesAdmin );
});

gulp.task('watch-public', function () {
	return gulp.watch(source_SCSS.public, stylesPublic );
});

// -----------------------------------------------------------------------------
// Scripts
// -----------------------------------------------------------------------------



// -----------------------------------------------------------------------------
// Build
// -----------------------------------------------------------------------------

/**
 * Copy plugin folder outside in a build folder, recreate styles before that
 */
function copyFolder() {
    var dir = process.cwd();
    return gulp.src( './*' )
        .pipe( plugins.exec( 'rm -Rf ./../build; mkdir -p ./../build/' + plugin + ';', {
            silent: true,
            continueOnError: true // default: false
        } ) )
        .pipe( plugins.rsync({
            root: dir,
            destination: '../build/' + plugin + '/',
            // archive: true,
            progress: false,
            silent: false,
            compress: false,
            recursive: true,
            emptyDirectories: true,
            clean: true,
            exclude: ['node_modules']
        }));
}
gulp.task( 'copy-folder', copyFolder );

/**
 * Clean the folder of unneeded files and folders
 */
function removeUnneededFiles( done ) {

    // files that should not be present in build zip
    var files_to_remove = [
        '**/codekit-config.json',
        'node_modules',
        'bin',
        'tests',
        '.travis.yml',
        '.babelrc',
        '.gitignore',
        '.codeclimate.yml',
        '.csslintrc',
        '.eslintignore',
        '.eslintrc',
        'circle.yml',
        'phpunit.xml.dist',
        '.sass-cache',
        'config.rb',
        'gulpfile.js',
        'webpack.config.js',
        'package.json',
        'package-lock.json',
        'pxg.json',
        'build',
        '.idea',
        '**/*.css.map',
        '**/.git*',
        '*.sublime-project',
        '.DS_Store',
        '**/.DS_Store',
        '__MACOSX',
        '**/__MACOSX',
        '+development.rb',
        '+production.rb',
        'README.md',
        'admin/src',
        'admin/scss',
        'admin/js/**/*.map',
        'admin/css/**/*.map',
        '.csscomb',
        '.csscomb.json',
        '.codeclimate.yml',
        'tests',
        'circle.yml',
        '.circleci',
        '.labels',
        '.jscsrc',
        '.jshintignore',
        'browserslist'
    ];

    files_to_remove.forEach( function( e, k ) {
        files_to_remove[k] = '../build/' + plugin + '/' + e;
    } );

    del.sync(files_to_remove, {force: true});

    done();
}
gulp.task( 'remove-files', removeUnneededFiles );

/**
 * Create a zip archive out of the cleaned folder and delete the folder
 */
function createZipFile() {
    var versionString = '';
    // get plugin version from the main plugin file
    var contents = fs.readFileSync("./" + plugin + ".php", "utf8");

    // split it by lines
    var lines = contents.split(/[\r\n]/);

    function checkIfVersionLine(value, index, ar) {
        var myRegEx = /^[\s\*]*[Vv]ersion:/;
        if (myRegEx.test(value)) {
            return true;
        }
        return false;
    }

    // apply the filter
    var versionLine = lines.filter(checkIfVersionLine);

    versionString = versionLine[0].replace(/^[\s\*]*[Vv]ersion:/, '').trim();
    versionString = '-' + versionString.replace(/\./g, '-');

    return gulp.src('./')
        .pipe( plugins.exec('cd ./../; rm -rf ' + plugin[0].toUpperCase() + plugin.slice(1) + '*.zip; cd ./build/; zip -r -X ./../' + plugin[0].toUpperCase() + plugin.slice(1) + versionString + '.zip ./; cd ./../; rm -rf build'));

}
gulp.task( 'make-zip', createZipFile );

function buildSequence(cb) {
    return gulp.series( 'copy-folder', 'remove-files' )(cb);
}
buildSequence.description = 'Sets up the build folder';
gulp.task( 'build', buildSequence );

function zipSequence(cb) {
    return gulp.series( 'build', 'make-zip' )(cb);
}
zipSequence.description = 'Creates the zip file';
gulp.task( 'zip', zipSequence  );
