import fs from 'fs';
import path from 'path';

import dirTree, { DirectoryTree } from 'directory-tree';

import {
    IObjectViewData, parseSingleSolidityFile,
} from './solidity';

// import { parseTestsComments } from './tests';
import { splitByHeader, SplitResult } from './markdown';

/**
 * TODO: to write!
 */
export class Generate {
    private lineBreak = '\r\n';
    private contracts: IObjectViewData[] = [];
    private inputPathStructure: DirectoryTree;
    private outputPath: string;
    private hasLICENSE: boolean;
    private useFullFunctionSignature = true;

    public constructor(
        files: string[],
        exclude: string[],
        inputPath: string,
        outputPath: string,
        baseLocation: string
    ) {
        files.forEach((file) => this.contracts.push(parseSingleSolidityFile(file, inputPath)));
        this.outputPath = outputPath;
        this.inputPathStructure = dirTree(inputPath, { exclude: exclude.map((i) => new RegExp(i)) });
        this.hasLICENSE = fs.existsSync(path.join(process.cwd(), 'LICENSE'));
    }

    private getLink(_path: string, line?: number): string {
        if (_path.startsWith('.')) _path = _path.slice(1);
        const url = line ? `${_path}#L${line}` : _path;
        return `[🔗](${url})`
    }

    public gitbook(): void {
        this.renderContracts();
        // generate summary file (essential in gitbook)
        let SUMMARYContent = `# Summary\r\n* WELCOME${this.lineBreak}`;
        SUMMARYContent = this.renderDocumentationIndex(
            SUMMARYContent,
        );
        // create summary file
        fs.writeFileSync(
            path.join(process.cwd(), this.outputPath, 'SUMMARY.md'),
            SUMMARYContent,
        );
    }

    private fixNatSpec(str: string): string {
        const lines = str.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.startsWith('* ')) {
                lines[i] = `${this.lineBreak.repeat(2)}${line.slice(2)}`;
            }
            line = lines[i];
            if (line.endsWith('.') || line.endsWith(':')) {
                lines[i] = `${line.trimEnd()}${this.lineBreak.repeat(2)}`;
            }
            line = lines[i]
            if (i > 0 && !(lines[i-1].endsWith(this.lineBreak))) {
                if (line.startsWith('-')) {
                    lines[i] = `${this.lineBreak}${line.trimStart()}`;
                } else {
                    lines[i] = ` ${line}`;
                }
            }
        }
        return lines.join('');
    }


    private getMarkDown(filePath: string, contractName: string): SplitResult[] {
        let fP = filePath.replace('.sol', '.md');
        if (!fs.existsSync(fP)) fP = filePath.replace(`${contractName}.sol`, 'README.md');
        if (fs.existsSync(fP)) {
            const file = fs.readFileSync(fP, 'utf8');
            return splitByHeader(file, 1);
        }
        return [];
    }

    private functionName = (f: any): string => {
        if (this.useFullFunctionSignature) {
            // const _returns = f.returnParameters?.map((r: any) => r.typeName.name);
            return [
                '`',
                f.ast.name,
                '(',
                f.parameters.map(
                    (p: any) => `${p.typeName.name || p.typeName.namePath} ${p.name}`
                ).join(', '),
                ')',
                // (_returns ? ` -> (${_returns.join(', ')})` : ''),
                '`'
            ].join('');
        }
        return f.ast.name;
    }

    private parameter = (p: any): string => {
        if (this.useFullFunctionSignature) {
            return `* \`${p.name}\` ${p.natspec}${this.lineBreak}`;
        }
        return `* \`${p.typeName.name || p.typeName.namePath} ${p.name}\` ${p.natspec}${this.lineBreak}`;
    }

    private makeDirectoryStructure(folder: string) {
        const subDirs = folder.split('/').filter(x => x);
        subDirs.reduce((curPath: string, nextSubDir: string) => {
            const relPath = path.join(curPath, nextSubDir);
            if (!fs.existsSync(relPath)) fs.mkdirSync(relPath);
            return relPath;
        }, path.join(process.cwd(), this.outputPath));
    }

    private renderContracts(): void {
        this.contracts.forEach((contract) => {
            // transform the template
            const { body: mdBody, children: mdData } = this.getMarkDown(contract.path, contract.filename).filter(
                (_md) => _md.title.includes(`# ${contract.name}`)
            )[0] || {};
            const contractLink = this.getLink(contract.path, contract.data.contract.loc.start.line);
            let MDContent = `# ${contractLink} ${contract.name}${this.lineBreak}`;

            if (contract.data.contract?.natspec?.author) {
                MDContent += `**Author** _${
                    contract.data.contract.natspec.author.trim()
                }_${
                    this.lineBreak.repeat(2)
                }`;
            }

            if (mdBody) MDContent += `${mdBody.trim()}${this.lineBreak.repeat(2)}`;

            if (contract.data.contract !== undefined) {
                if (contract.data.contract.natspec?.dev) {
                    MDContent += `${this.fixNatSpec(contract.data.contract.natspec.dev)}${this.lineBreak.repeat(2)}`;
                }
                if (contract.data.contract.natspec?.notice) {
                    MDContent += `${this.fixNatSpec(contract.data.contract.natspec.notice)}${this.lineBreak}`;
                }
            }
            if (contract.data.structs.length) {
                MDContent += `# Data Structures${this.lineBreak}`
            }
            contract.data.structs.forEach((d) => {
                const { start: { line }} = d.ast.loc;
                const link = this.getLink(contract.path, line);
                const name = d.ast.name;
                MDContent += `## ${link} ${name}${this.lineBreak}`;
                if (d.natspec && d.natspec.dev) MDContent += `${d.natspec.dev}${this.lineBreak}`;
                MDContent += `### Properties${this.lineBreak}`;
                d.parameters.forEach((m: any) => {
                    const mType = m.typeName.name || m.typeName.namePath;
                    const mName = m.name;
                    const devdoc = m.natspec;
                    MDContent += `- \`${mType} ${mName}\`${devdoc ? ` - ${devdoc}` : ''}${this.lineBreak}`
                });

            })
            if (contract.data.functions.length) {
                MDContent += `# Functions${this.lineBreak}`;
            }
            contract.data.functions.forEach((f) => {
                const { start: { line }} = f.ast.loc;
                const fnLink = this.getLink(contract.path, line);
                const fnName = this.functionName(f);
                MDContent += `## ${fnLink} ${fnName}${this.lineBreak.repeat(2)}`;
                const existingMD = mdData?.filter(
                    (m) => m.title.includes(fnName) || m.title == `## ${f.ast.name}`
                )[0];
                if (existingMD) MDContent += `${existingMD.body.trim()}${this.lineBreak.repeat(2)}`;
                if (f.ast.natspec === null) return;
                if (f.ast.natspec.dev) {
                    if (existingMD) MDContent += `### Developer Notes${this.lineBreak.repeat(2)}`;
                    MDContent += `${this.fixNatSpec(f.ast.natspec.dev)}${this.lineBreak.repeat(2)}`;
                }
                if (f.ast.natspec.notice) {
                    if (existingMD) MDContent += `### User Notes${this.lineBreak.repeat(2)}`
                    MDContent += `${this.fixNatSpec(f.ast.natspec.notice)}${this.lineBreak.repeat(2)}`;
                }
                if (f.parameters.length > 0) {
                    MDContent += `${this.lineBreak}### Parameters${this.lineBreak}`;
                    f.parameters.map((p: any) => (MDContent += this.parameter(p)));
                }
                if (f.returnParameters !== null && f.returnParameters.length > 0) {
                    MDContent += `### Returns${this.lineBreak}`;
                    f.returnParameters.forEach((p: any) => {
                        MDContent += `* \`${p.typeName.name || p.typeName.namePath}${p.name ? ` ${p.name}` : ''}\`${p.natspec ? ` ${p.natspec}` : ''}${this.lineBreak}`;
                    });
                }
                MDContent += this.lineBreak;
            });
            // const outputDir = path.join(process.cwd(), this.outputPath, contract.folder);
            // if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
            this.makeDirectoryStructure(contract.folder);
            fs.writeFileSync(
                path.join(process.cwd(), this.outputPath, contract.folder, `${contract.filename}.md`),
                MDContent,
            );
        });
    }

    private renderDocumentationIndex(
        content: string,
    ): string {
        let documentationIndexContent = content;
        if (this.hasLICENSE) {
            documentationIndexContent += `\t* [LICENSE](LICENSE.md)${this.lineBreak}`;
            fs.copyFileSync(
                path.join(process.cwd(), 'LICENSE'),
                path.join(process.cwd(), this.outputPath, 'LICENSE.md'),
            );
        }
        documentationIndexContent += `* CONTRACTS${this.lineBreak}`;
        this.contracts.forEach((s) => {
            const contractPath = path.join(s.folder, s.name, '.md')
            documentationIndexContent += `\t* [${s.name}](${contractPath})${this.lineBreak}`;
        });
        return documentationIndexContent;
    }
}
