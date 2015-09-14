module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            files: ['**/*.html', '**/*.js', '**/*.css'],
            options: {
                livereload: {
                    port: 9011
                }
            }
        },
        copy: {
            js: {
                files:[{
                    src: ['node_modules/js-md5/build/md5.min.js', 
                    'node_modules/pixel-color-cruncher/js/pixel-cruncher.js'],
                    dest: 'js/vendor/',
                    expand: true,
                    flatten: true
                }]

            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-serve');
}