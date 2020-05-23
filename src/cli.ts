#!/usr/bin/env node

import { Console } from 'console';
import meow from 'meow';
import fs from 'fs';
import path from 'path';

import { generate } from './index';

const helpMessage = `
🐼️ .- hello friend, here's what I have. Thanks to use soldoc.

Usage
    $ soldoc [options] <output-folder> <file(s)>

Options
    --help, -h  To get help
    --output -o The output type [gitbook/docsify] default: gitbook
    --ignore -i An array of files to ignore
    --baseLocation -bl Base location, used to render test files link. Default: repository url

Examples
    $ soldoc docs/ contracts/Sample.sol
    $ soldoc docs/ contracts/
    $ soldoc --tests ./mytests docs/ Sample.sol
    $ soldoc --output gitbook --ignore Migrations.sol docs/ Sample.sol
`;

const packagePath = path.join(process.cwd(), 'package.json');
const defaultBaseLocation = (
    fs.existsSync(packagePath) &&
    JSON.parse(fs.readFileSync(packagePath).toString()).repository?.url?.replace('git+', '')
) || process.cwd();

const cli = meow(helpMessage, {
    flags: {
        baseLocation: {
            alias: 'bl',
            default: defaultBaseLocation,
            type: 'string',
        },
        ignore: {
            alias: 'i',
            type: 'string',
        },
        output: {
            alias: 'o',
            default: 'gitbook',
            type: 'string',
        }
    },
});
const terminalConsole = new Console(process.stdout, process.stderr);

const main = (): number => {
    if (cli.input.length !== 2) {
        terminalConsole.error(
            'You must be doing something wrong. There\'s a 🐼️ available to help you, '
            + 'just write \'soldoc --help\'.\r\n\r\n\t🐼 ️🐼️ are really cool! Aren\'t they?',
        );
        return 1;
    }

    let ignoreList: string[] = [];
    if (cli.flags.ignore && cli.flags.ignore.length > 0) {
        const commaPosition = cli.flags.ignore.indexOf(',');
        if (commaPosition >= -1) {
            ignoreList = cli.flags.ignore.split(',');
        }
    }
    return generate(
        cli.flags.output,
        ignoreList,
        String(cli.input[0]),
        String(cli.input[1]),
        cli.flags.baseLocation
    );
};

main();
