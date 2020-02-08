'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-karma');
    grunt.registerTask('default', ['clean', 'browserify:dist', 'karma:unit']);

    grunt.initConfig({

        // property for browserified or minified bundle path for Karma
        targetBundle: 'dist/dash-vmn.js',

        clean: ['dist/*'],

        pkg: grunt.file.readJSON('package.json'),

        // browserify VMN to es2016
        browserify: {
            dist: {
                options: {
                    transform: [['babelify', {presets: ['es2016']}]],
                    browserifyOptions: {
                        standalone: 'Bundle'
                    }
                },
                src: ['vmn/index.js'],
                dest: '<%= targetBundle %>'
            }
        },
        // browserify Mocha tests to es2015 in Karma (until Mocha supports es2016 tests)
        karma: {
            unit: {
                options: {
                    basePath: '',
                    frameworks: ['browserify', 'mocha', 'chai'],
                    files: [
                        '<%= targetBundle %>',
                        'dash-core-daps/dashpay/dashpay-client-test.js'
                    ],
                    preprocessors: {
                        'dash-core-daps/dashpay/dashpay-client-test.js': ['browserify']
                    },
                    browserify: {
                        debug: true,
                        transform: [
                            ['babelify']
                        ],
                    },
                    babelPreprocessor: {
                        presets: 'es2015',
                        options: {
                            sourceMap: 'inline'
                        }
                    },
                    client: {
                        mocha: {
                            timeout: 30000
                        }
                    },
                    browserNoActivityTimeout: 30000,
                    reporters: ['mocha'],
                    port: 9876,
                    colors: true,
                    logLevel: 'INFO',
                    autoWatch: false,
                    browsers: ['ChromeHeadless', 'Firefox'],
                    singleRun: true,
                    plugins: [
                        'karma-browserify',
                        'karma-chrome-launcher',
                        'karma-firefox-launcher',
                        'karma-mocha-reporter',
                        'karma-mocha',
                        'karma-chai'
                    ]
                }
            }
        }
    });
};
