const byteTranslation = {}

byteTranslation.intoGb = (bytes) => {
    return bytes / (1000 ** 3)
}

byteTranslation.intoMb = (bytes) => {
    return bytes / (1000 ** 2)
}

byteTranslation.intoKb = (bytes) => {
    return bytes / 1000
}

byteTranslation.intoBits = (bytes) => {
    return bytes * 8
}

byteTranslation.intoGib = (bytes) => {
    // gib means binary gb (1073741824 B = 1 GiB)
    return bytes / (1024 ** 3)
}

byteTranslation.intoMib = (bytes) => {
    return bytes / (1024 ** 2)
}

byteTranslation

export default byteTranslation