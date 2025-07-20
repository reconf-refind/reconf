import blessed from 'blessed';
import { readFileSync, writeFileSync } from 'fs'

export default function init() {
    const screen = blessed.screen({
        smartCSR: true,
        title: 'reconf',
    });

    const menu = blessed.list({
        parent: screen,
        width: '50%',
        height: '50%',
        top: 'center',
        left: 'center',
        items: ['configure refind', 'exit'],
        keys: true,
        mouse: true,
        border: 'line',
        style: {
            selected: {
                fg: 'red',
            },
            item: {
                hover: {
                    bg: 'white',
                    fg: 'black',
                },
            },
            border: {
                fg: 'white',
            },
        },
        label: 'reconf',
    });

    // focus the list so keys work
    menu.focus();

    // handle select event
    menu.on('select', (item) => {
        const itemName = item.getText
        if (itemName === 'exit') {
            return process.exit(0);
        }
        console.clear();
        process.exit(0);
    });
    screen.key(['escape', 'q', 'e', 'C-c'], () => process.exit(0));

    screen.render();
}
