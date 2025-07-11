const localeOptions = {
    time: {
        readable: {
            hour12: false, 
            hour: "numeric", 
            minute: "2-digit"
        },

        defaultTwoDigit: {
            hour12: false,
            hour: "2-digit",
                minute: "2-digit"
        },

        secondsReadable: {
            hour12: false,
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit"
        },

        secondsTwoDigit: {
            hour12: false,
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit"
        }
    }
}

export default localeOptions