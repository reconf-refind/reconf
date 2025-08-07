import { EventEmitter } from 'events'
import stream from 'stream'
import * as fs from 'fs'

const MODULE = {}
MODULE.public = {}
MODULE._EMITTER = new EventEmitter()
MODULE._CURRENT_STREAM = null

MODULE.public.openStream = (path) => {
  MODULE._CURRENT_STREAM = fs.createWriteStream(path, { flags: 'a' })
  return MODULE._CURRENT_STREAM
}

MODULE.public.closeStream = () => {
  if (MODULE._CURRENT_STREAM) {
    MODULE._CURRENT_STREAM.end()
    MODULE._CURRENT_STREAM = null
  } else {
    throw new Error('No open stream to close')
  }
}

MODULE.public.log = (string, to=MODULE._CURRENT_STREAM) => {
  if (to instanceof stream.Writable) {
    to.write(string)
  } else {
    throw new TypeError('must be writable stream')
  }
}

export default MODULE.public