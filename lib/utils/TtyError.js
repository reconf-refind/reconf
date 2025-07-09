class TtyError extends Error {
    constructor(message) {
        super(message)
        this.name = "TtyError"
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TtyError)
        }
    }
}

export default TtyError