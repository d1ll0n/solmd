const fs = require('fs');
const path = require('path');
const { generate } = require('../dist/index');

describe('Render MD - ERC20', () => {
    describe('Using contract.md mixin', () => {
        let mdResultFile1;
        let mdExpectFile1;

        beforeAll(async () => {
            jest.setTimeout(20000);
            // first render
            // can be docsify or gitbook, they generate the same result
            const files = fs.readdirSync(path.join(process.cwd(), '/docs/merged-md'));
            for (let file of files) fs.unlinkSync(
                path.join(process.cwd(), '/docs/merged-md', file)
            )
            fs.rmdirSync(path.join(process.cwd(), '/docs/merged-md'));
            generate('gitbook', [], './docs/merged-md', './test/merged-md/test1', './test', 'xyz', process.cwd());
            // now let's test the result
            mdResultFile1 = (fs.readFileSync(path.join(process.cwd(), '/docs/merged-md/TesterContract.md'))).toString();
            mdExpectFile1 = (fs.readFileSync(path.join(__dirname, 'merged-md', 'expected-output', 'TesterContract.md'))).toString();
            mdExpectFile1 = mdExpectFile1.replace(/test2\/TesterContract/g, 'test1/TesterContract')
        });

        test('Should have correct md output', async (done) => {
            expect(mdResultFile1).toBe(mdExpectFile1)
            done();
        })
    })

    describe('Using README.md mixin', () => {
        let mdResultFile1, mdResultFile2;
        let mdExpectFile1, mdExpectFile2;

        beforeAll(async () => {
            jest.setTimeout(20000);
            // first render
            // can be docsify or gitbook, they generate the same result
            const files = fs.readdirSync(path.join(process.cwd(), '/docs/merged-md'));
            for (let file of files) fs.unlinkSync(
                path.join(process.cwd(), '/docs/merged-md', file)
            )
            fs.rmdirSync(path.join(process.cwd(), '/docs/merged-md'));
            generate('gitbook', [], './docs/merged-md', './test/merged-md/test2', './test', 'xyz', process.cwd());
            // now let's test the result
            mdResultFile1 = (fs.readFileSync(path.join(process.cwd(), '/docs/merged-md/TesterContract.md'))).toString();
            mdResultFile2 = (fs.readFileSync(path.join(process.cwd(), '/docs/merged-md/TesterContract2.md'))).toString();
            mdExpectFile1 = (fs.readFileSync(path.join(__dirname, 'merged-md', 'expected-output', 'TesterContract.md'))).toString();
            mdExpectFile2 = (fs.readFileSync(path.join(__dirname, 'merged-md', 'expected-output', 'TesterContract2.md'))).toString();

        });

        test('Should have correct md outputs', async (done) => {
            expect(mdResultFile1).toBe(mdExpectFile1)
            expect(mdResultFile2).toBe(mdExpectFile2)
            done();
        })
    })
});
