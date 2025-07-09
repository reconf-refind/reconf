// reconf [0.0.1-alpha]
// reconf bootstrapper by isoextension

// import main from "./lib/main/main.js"
// ^ THIS IS COMMENTED FOR DEBUG PURPOSES
const args = process.argv.slice(2);
import TtyError from './lib/utils/TtyError.js'
import localeOptions from './lib/utils/LocaleOptions.js';
import generateDump from './lib/utils/dump.js'
import constants from './lib/utils/constants.js'
const VERSION = constants.VERSION

process.on("uncaughtException", (err) => {
    let type
    let severity
    const verbose = args.includes('-V') || args.includes('--verbose')
    const debug = args.includes('-d') || args.includes('--debug')
    console.clear()
    if (!verbose) {
        switch(err.name) {
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
    console.log('[reconf][v0.0.1]')
    if (severity >= 4) {
        console.log(`[alpha CRASH   ]`)
        process.exitCode = 2
    } else {
        console.log(`[alpha ERROR   ]`)
        process.exitCode = 1
    }
    console.log(`[   ${new Date().toLocaleTimeString(undefined, localeOptions.time.secondsTwoDigit)}   ]`)
    console.log(`${verbose ? err.name : type}: ${err.message}`)
    if (verbose) {
        console.log((err.stack || 'no stack trace...'))
    }
    if (debug) {
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
const noTTYOverride = args.includes('-t') || args.includes('--no-tty')
if (!noTTYOverride && !(isTTY.stdin && isTTY.stdout && isTTY.stderr)) {
    throw new TtyError('RECONF DOES NOT WORK IN PIPES!')
} else if (stdin.isTTY) {
    stdin.setRawMode(true);
} else {
    console.warn("[!] stdin/out/err is being piped into/out, but reconf does not work in pipes. the program will now exit");
    await setTimeout(1000)
    throw new TtyError()
}