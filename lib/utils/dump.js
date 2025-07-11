function generateDump(err, isVerbose = false) {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-'); // safe for filenames
    const filename = `reconf-dump-${timestamp}.log`;
  
    const lines = [];
    lines.push(`[reconf][${VERSION}]`);
    lines.push(`--CRASH DUMP--`)
    lines.
    lines.push('');
    lines.push(`Error: ${err.name}`);
    lines.push(`Message: ${err.message}`);
    lines.push('');
  
    lines.push('TTY Info:');
    lines.push(`  stdin: ${process.stdin.isTTY}`);
    lines.push(`  stdout: ${process.stdout.isTTY}`);
    lines.push(`  stderr: ${process.stderr.isTTY}`);
    lines.push('');
  
    const mem = process.memoryUsage();
    lines.push('Memory:');
    lines.push(`  heapUsed: ${formatBytesBinary(mem.heapUsed)}`);
    lines.push(`  heapTotal: ${formatBytesBinary(mem.heapTotal)}`);
    lines.push('');
  
    if (isVerbose || err.stack) {
      lines.push('Stack Trace:');
      lines.push(err.stack || 'no stack trace available');
    }
  
    fs.writeFileSync(filename, lines.join('\n'));
    return filename;
}

export default generateDump