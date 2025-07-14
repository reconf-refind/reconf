#!/usr/bin/env node
// reconf [0.0.1-alpha]
// reconf bootstrapper by isoextension 'iso-reconfboot'
// uses new .reconf extension

// import main from "./lib/main/main.js"
// ^ THIS IS COMMENTED FOR DEBUG PURPOSES
const args = process.argv.slice(2);
import TtyError from './lib/other/TtyError.js'
import localeOptions from './lib/other/LocaleOptions.js';
import generateDump from './lib/utils/dump.js'
import constants from './lib/utils/constants.js'
const VERSION = constants.VERSION

process.on("uncaughtException", (err) => {
    let type
    let severity
    const verbose = args.includes('-V') || args.includes('--verbose')
    const debug = args.includes('-d') || args.includes('--debug')
    const both = args.includes('-Vd') || args.includes('-dV') || (verbose && debug)
    console.clear()
    if (!verbose) {
        switch (err.name) {
            case 'Error':
                type = "generic error"
                severity = 1
                break
            case 'TypeError':
                type = "typing error"
                severity = 4
                break
            case 'ReferenceError':
                type = 'pointer error'
                severity = 4
                break
            case 'RangeError':
                type = 'over/underflow'
                severity = 3
                break
            case 'AggregateError':
                type = 'multiple errors'
                severity = 4
                break
            case 'TtyError':
                type = 'terminal error'
                severity = 5
                break
            default:
                type = "unknown error"
                severity = 0
                break
        }
    }
    console.log('[reconf][v0.0.1-alpha]')
    if (severity >= 4) {
        console.log(`[       CRASH        ]`)
        process.exitCode = 2
    } else {
        console.log(`[       ERROR        ]`)
        process.exitCode = 1
    }
    console.log(`[   ${new Date().toLocaleTimeString(undefined, localeOptions.time.secondsTwoDigit)}   ]`)
    console.log(`${verbose ? err.name : type}: ${err.message}`)
    const stack = err.stack.split('\n')
    stack[0] = "↓ stack trace\x1b[37;1m"
    if (verbose || both) {
        console.log((stack.join('\n') || 'no stack trace...'))
        process.stdout.write('\x1b[0m')
    }
    if (debug || both) {
        const filename = generateDump(err, verbose)
        console.log(`dumped into ${filename}`)
    }

    process.exit()
})

const isTTY = {
    stdin: process.stdin.isTTY,
    stdout: process.stdout.isTTY,
    stderr: process.stderr.isTTY
};

const { stdin, stdout, stderr } = isTTY

const noTTYOverride = false
// args.includes('-t') || args.includes('--no-tty')
if (!noTTYOverride && !(isTTY.stdin && isTTY.stdout && isTTY.stderr)) {
    throw new TtyError('RECONF DOES NOT WORK IN PIPES!')
} else if (stdin.isTTY) {
    stdin.setRawMode(true);
}