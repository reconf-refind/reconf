const { stdin, stdout, stderr } = process

import { setTimeout } from 'timers/promises';
import readline from 'readline';

const menuItems = ['shell', 'configure refind', 'exit'];
let selected = 0;

const init = () => {
    stdin.setRawMode(true);
    stdin.resume();
    readline.emitKeypressEvents(stdin);

    console.clear();
    drawMenu();
}

stdin.on('keypress', (_, key) => {
    if (key.name === 'up') {
        selected = (selected - 1 + menuItems.length) % menuItems.length;
        drawMenu();
    } else if (key.name === 'down') {
        selected = (selected + 1) % menuItems.length;
        drawMenu();
    } else if (key.name === 'return') {
        handleSelection(menuItems[selected]);
    } else if (key.ctrl && key.name === 'c') {
        process.exit();
    }
});

function drawMenu() {
    console.clear();
    console.log('[reconf][v0.0.1-alpha]');

    const maxItemLength = Math.max(...menuItems.map(item => item.length));
    const bracketedWidth = maxItemLength + 3; // 3 = prefix like '[> '

    menuItems.forEach((item, index) => {
        const prefix = index === selected ? '[> ' : '[  ';
        const paddedItem = item.padEnd(maxItemLength, ' ');
        console.log(`${prefix}${paddedItem} ]`);
    });
}


function shell(callback) {
    stdin.setRawMode(false)
    console.clear();
    console.log('[reconf][v0.0.1-alpha]');
    console.log('| welcome! type help to see all available commands');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '| reconf> ',
    });

    rl.prompt();

    rl.on('line', (line) => {
        const input = line.trim().toLowerCase();

        rl.prompt();
    });
    rl.on("close", () => { callback() })
}

function handleSelection(choice) {
    console.clear();
    if (choice === 'exit') {
        process.exit(0);
    } else if (choice == null) {
        throw new TypeError("how the FU")
    } else if (choice === 'shell') {
        shell(() => {
            stdin.setRawMode(true)
            readline.emitKeypressEvents(stdin)
            drawMenu()
        })
    } else {
        console.log(`you selected: ${choice}`);
        process.exit(); // for now, exit after selection
    }
}

export default init