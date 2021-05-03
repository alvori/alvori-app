#!/usr/bin/env node
const program = require('commander')

program
    .command('dev')
    .description('Compiles and hot-reload for development')
    .option('-m, --mode [value]', 'Build mode', 'spa')
    .action(function (args) {
        console.log(args.mode)
    })

// Create new project
// $ alvori create
program
    .command('prod')
    .description('Run production mode')
    .option('-m, --mode [value]', 'Build mode', 'spa')
    .action(function (args) {
        console.log(args)
    })

// Create new project
// $ alvori create
program
    .command('build')
    .description('Compiles and minifies for production')
    .option('-m, --mode [value]', 'Build mode', 'spa')
    .action(function (args) {
        console.log(args)
    })

program.parse(process.argv)
