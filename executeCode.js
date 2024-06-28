const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const outputPath = path.join(__dirname, 'outputs');

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

const executeCpp = (filePath, input = '') => {
    const jobId = path.basename(filePath).split(".")[0];
    const outPath = path.join(outputPath, `${jobId}.exe`);

    return new Promise((resolve, reject) => {
        exec(`g++ ${filePath} -o ${outPath}`, (error, stdout, stderr) => {
            if (error || stderr) {
                reject({ error: error?.message || '', stderr });
                return;
            }

            const child = spawn(outPath, { cwd: outputPath });
            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    reject({ error: errorOutput });
                } else {
                    resolve(output);
                }
            });

            if (input) {
                child.stdin.write(input);
            }
            child.stdin.end();
        });
    });
};

const executeC = (filePath, input = '') => {
    const jobId = path.basename(filePath).split(".")[0];
    const outPath = path.join(outputPath, `${jobId}.exe`);

    return new Promise((resolve, reject) => {
        exec(`gcc ${filePath} -o ${outPath}`, (error, stdout, stderr) => {
            if (error || stderr) {
                reject({ error: error?.message || '', stderr });
                return;
            }

            const child = spawn(outPath, { cwd: outputPath });
            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    reject({ error: errorOutput });
                } else {
                    resolve(output);
                }
            });

            if (input) {
                child.stdin.write(input);
            }
            child.stdin.end();
        });
    });
};

const executeJava = (filePath, input = '') => {
    const jobId = path.basename(filePath).split(".")[0];

    return new Promise((resolve, reject) => {
        exec(`javac ${filePath}`, (error, stdout, stderr) => {
            if (error || stderr) {
                reject({ error: error?.message || '', stderr });
                return;
            }

            const child = spawn('java', ['-cp', outputPath, jobId], { cwd: outputPath });
            let output = '';
            let errorOutput = '';

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    reject({ error: errorOutput });
                } else {
                    resolve(output);
                }
            });

            if (input) {
                child.stdin.write(input);
            }
            child.stdin.end();
        });
    });
};

const executeJs = (filePath, input = '') => {
    return new Promise((resolve, reject) => {
        exec(`node ${filePath}`, (error, stdout, stderr) => {
            if (error || stderr) {
                reject({ error: error?.message || '', stderr });
                return;
            }
            resolve(stdout);
        });
    });
};

const executePython = (filePath, input = '') => {
    return new Promise((resolve, reject) => {
        exec(`python ${filePath}`, (error, stdout, stderr) => {
            if (error || stderr) {
                reject({ error: error?.message || '', stderr });
                return;
            }
            resolve(stdout);
        });
    });
};

module.exports = {
    executeCpp,
    executeC,
    executeJava,
    executeJs,
    executePython
};
