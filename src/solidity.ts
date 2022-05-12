import fs from 'fs';
import path from 'path';
import parser from '@hq20/solidity-parser-antlr';


export interface ISolDocAST {
    inheritance?: any;
    contract?: any;
    constructor?: any;
    testFile?: any[];
    events: any[];
    functions: any[];
    structs: any[];
    variables: any[];
}
export interface IObjectViewData {
    data: ISolDocAST;
    filename: string;
    folder: string;
    name: string;
    path: string;
}

function extendParamsAstWithNatspec(node: any): null | [any] {
    if (node.parameters === null) {
        return null;
    }
    return node.parameters.map((parameter: any) => (
        {
            ...parameter,
            natspec:
                parameter.name === null ||
                    node.natspec === null ||
                    node.natspec.params === undefined
                    ? ''
                    : node.natspec.params[parameter.name],
        }
    ));
}
function extendReturnParamsAstWithNatspec(node: any): null | [any] {
    if (node.returnParameters === null || node.returnParameters === undefined) {
        return null;
    }
    return node.returnParameters.map(
        (parameter: any) => (
            {
                ...parameter,
                natspec: node.natspec === null ||
                  node.natspec.return === undefined ||
                  parameter.name === null
                    ? ''
                    : node.natspec.return[parameter.name],
            }
        ));
}
function extendStructParamsAstWithNatspec(node: any): null | [any] {
    if (node.members === null) return null;
    return node.members.map((m: any) => {
        if (node.natspec && node.natspec.params) {
            const match: any = node.natspec.params[m.name];
            if (match) m.natspec = match;
        }
        return m;
    })
}

function extendsVisibility(node: any): { external: boolean; internal: boolean; private: boolean; public: boolean } {
    return {
        external: node.visibility === 'external',
        internal: node.visibility === 'internal',
        private: node.visibility === 'private',
        public: node.visibility === 'public',
    };
}

function extendsStateMutability(node: any): { payable: boolean; pure: boolean; view: boolean } {
    return {
        payable: node.stateMutability === 'payable',
        pure: node.stateMutability === 'pure',
        view: node.stateMutability === 'view',
    };
}

/**
 * Prepare for the given file.
 * @param {string} solidityFilePath the file's path to be parsed
 */
export function parseSingleSolidityFile(
    solidityFilePath: string,
    inputPath: string
): IObjectViewData {
    // const folder = path.join(__dirname, '../');
    // console.log(solidityFilePath)
    // console.log(inputPath)
    // console.log(path.relative(inputPath, solidityFilePath))
    const input = fs.readFileSync(solidityFilePath).toString();
    const ast = parser.parse(input, { loc: true });
    let data: ISolDocAST = {
        events: [] as any,
        functions: [] as any,
        structs: [] as any,
        variables: [] as any,
    };
    // we can safely do this, because the contract definition always happenes before methods!
    let currentContractName: string;
    // visit all the methods and add the commands to it
    parser.visit(ast, {
        ContractDefinition: (node: any) => {
            data = {
                contract: node,
                ...data,
            };
            currentContractName = node.name;
        },
        EventDefinition: (node: any) => {
            data.events.push({
                ast: node,
                parameters: extendParamsAstWithNatspec(node),
                returnParameters: extendReturnParamsAstWithNatspec(node),
            });
        },
        FunctionDefinition: (node: any) => {
            if ((node.natspec !== null && node.natspec.dev !== 'soldoc-ignore' ||
                node.natspec === null)) {
                if (node.isConstructor) {
                    data = {
                        constructor: {
                            ast: node,
                            parameters: extendParamsAstWithNatspec(node),
                            returnParameters: extendReturnParamsAstWithNatspec(node),
                        },
                        ...data,
                    };
                } else {
                    data.functions.push({
                        ast: node,
                        hasTests: false,
                        parameters: extendParamsAstWithNatspec(node),
                        returnParameters: extendReturnParamsAstWithNatspec(node),
                        stateMutability: extendsStateMutability(node),
                        tests: undefined,
                        visibility: extendsVisibility(node),
                    });
                }
            }
        },
        InheritanceSpecifier: (node: any) => {
            let currentInheritance = data.inheritance;
            if (currentInheritance !== undefined) {
                currentInheritance.push(node.baseName);
            } else {
                currentInheritance = [node.baseName];
            }
            data = {
                inheritance: currentInheritance,
                ...data,
            };
        },
        StateVariableDeclaration: (node: any) => {
            data.variables.push({
                ast: {
                    ...node,
                    variable: node.variables[0],
                },
                visibility: extendsVisibility(node),
            });
        },
        StructDefinition: (node: any) => {
            data.structs.push({
                ast: node,
                parameters: extendStructParamsAstWithNatspec(node)
            })
        }
    });
    const name = ast.children.filter((child: any) => child.type === 'ContractDefinition')[0].name;
    const relativePath = path.relative(inputPath, solidityFilePath);
    const filename = path.parse(solidityFilePath).name;
    const folder = relativePath.replace(filename, '').replace('.sol', '');
    return {
        data,
        filename,
        folder,
        name,
        path: solidityFilePath,
    };
}
