class ByteTranslation {
    constructor() {
        this.intoGb = (bytes) => bytes / (1000 ** 3)

        this.intoMb = (bytes) => bytes / (1000 ** 2)

        this.intoKb = (bytes) => bytes / 1000

        this.intoGib = (bytes) => bytes / (1024 ** 3)

        this.intoMib = (bytes) => bytes / (1024 ** 2)

        this.intoKib = (bytes) => bytes / 1024

        this.intoBits = (bytes) => bytes * 8

        this.intoBytes = function (value, unit) {
            const factor = this.conversions[unit]
            if (factor === undefined) {
                throw new TypeError(`invalid or unsupported unit "${unit}"`)
            }

            return value * factor
        }
    }
}

const byteConversion = new ByteTranslation()

export default byteConversion
export { ByteTranslation }