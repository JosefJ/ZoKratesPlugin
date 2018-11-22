import { version } from '../../package.json';
import { Router } from 'express';
import {zokrates, cmd} from '../models/zokrates';
import shelljs from 'shelljs';
import fs from 'fs';

export default ({ config, db }) => {
	let api = Router();

	// DEFINE A SETUP - TODO: later add to config file
	let SESSION_ROOT = '/tmp/zokrates/';

    /*
     *  Helper function for R/W
     */

    const readFile = (path, opts = 'utf8') =>
        new Promise((res, rej) => {
            fs.readFile(path, opts, (err, data) => {
                if (err) rej(err)
                else res(data)
            })
        });

    const readKey = (path, opts = 'base64') =>
        new Promise((res, rej) => {
            fs.readFile(path, opts, (err, data) => {
                if (err) rej(err)
                else res(data)
            })
        });

    const writeFile = (path, data, opts = 'utf8') =>
        new Promise((res, rej) => {
            fs.writeFile(path, data, opts, (err) => {
                if (err) rej(err)
                else res()
            })
        });

    const writeKey = (path, data, opts = 'base64') =>
        new Promise((res, rej) => {
            fs.writeFile(path, data, opts, (err) => {
                if (err) rej(err)
                else res()
            })
        });

    const clearPath = (path) => {
        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        } else {
            shelljs.exec('rm -rf ' + path);
            fs.mkdirSync(path);
        }
    };

    const erasePath = (path) => {
        shelljs.exec('rm -rf ' + path);
    };

    /**
     * The following API enables to send POST requests with a raw body containing the raw ZoKrates code and get regular
     * ZoKrates output back as an asynchronus response
     *
     * @example
     * Example request should look like this:

         POST /api/export-verifier HTTP/1.1
         Host: 127.0.0.1:8080
         Cache-Control: no-cache

         // only using add, no need to flatten
         def main(a):
             b = a + 5
             c = a + b + a + 4
             d = a + c + a + b
             return b + c + d
     */

	// Compile zokrates code into out.code
    api.post('/compile', async (req, res) => {
        // Response definition
        var response = {
            suc: false,
            out: '',
            outCode: '',
            msg: ''
        };

        // Session specific
        var path = SESSION_ROOT + req.headers.session;
        var filePath = path + '/input.code';
        clearPath(path);

        // Task action
        await writeFile(filePath, req.body.code);
        await shelljs.exec('cd ' + path +' && ' + zokrates + ' ' + cmd.COMPILE + ' -i ' + 'input.code', async (code, stdout, stderr) => {
            if (stderr != '') {
                response.msg = stderr;
                res.json(response);
                erasePath(path);
            } else {
                response.suc = true;
                response.out = await readFile(path + '/out'); // thse to return data not promise
                response.outCode = await readFile(path + '/out.code');
                res.json(response);
                erasePath(path);
            };
        });
    });

    // Compute witness with arguments from the request header
    api.post('/compute-witness', async (req, res) => {
        // Response definition
        var response = {
            suc: false,
            out: '',
            msg: ''
        };

        // Session specific
        var path = SESSION_ROOT + req.headers.session;
        clearPath(path);

        // Task specific variables
        var outCode = req.body.outCode;
        var out = req.body.out;
        var params = req.body.params;

        // Task action
        await writeFile(path + '/out.code', outCode);
        await writeFile(path + '/out', out);
        await shelljs.exec('cd ' + path +' &&' + zokrates + ' ' + cmd.COMPUTEWITNESS + ' -a ' + params, async (code, stdout, stderr) => {
            if (stderr != '') {
                response.msg = stderr;
                res.json(response);
                erasePath(path);
            } else {
                response.witness = await readFile(path + '/witness');
                response.suc = true;
                res.json(response);
                erasePath(path);
            }
        });
    });

    // Setup verification and prover keys
    api.post('/setup', async (req, res) => {
        // Response definition
        var response = {
            suc: false,
            verification: '',
            proving: '',
            msg: ''
        };

        // Session specific
        var path = SESSION_ROOT + req.headers.session;
        clearPath(path);

        // Task specific variables
        var outCode = req.body.outCode;
        var out = req.body.out;

        // Task action
        await writeFile(path + '/out.code', outCode);
        await writeFile(path + '/out', out);
        await shelljs.exec('cd ' + path +' && ' + zokrates + ' ' + cmd.SETUP, async (code, stdout, stderr) => {
            if (stderr != '') {
                response.msg = stderr;
                res.json(response);
                erasePath(path);
            } else {
                response.verification = await readFile(path + '/verification.key');
                response.variables = await readFile(path + '/variables.inf');
                response.proving = await readKey(path + '/proving.key');
                response.suc = true;
                res.json(response);
                erasePath(path);
            }
        });
    });

    // Setup verification and proover keys
    api.post('/export-verifier', async (req, res) => {
        // Response definition
        var response = {
            suc: false,
            verifier: '',
            msg: ''
        };

        // Session specific
        var path = SESSION_ROOT + req.headers.session;
        clearPath(path);

        // Task specific variables
        var outCode = req.body.outCode;
        var out = req.body.out;
        var verification = req.body.verification;

        // Task action
        await writeFile(path + '/out.code', outCode);
        await writeFile(path + '/out', out);
        await writeFile(path + '/verification.key', verification);
        await shelljs.exec('cd ' + path +' && ' + zokrates + ' ' + cmd.EXPORTVERIFIER, async (code, stdout, stderr) => {
            if (stderr != '') {
                response.msg = stderr;
                res.json(response);
                erasePath(path);
            } else {
                response.verifier = await readFile(path + '/verifier.sol');
                response.suc = true;
                res.json(response);
                erasePath(path);
            }
        });
    });

    // Generate proof
    // Setup verification and proover keys
    api.post('/generate-proof', async (req, res) => {
        // Response definition
        var response = {
            suc: false,
            proof: '',
            msg: ''
        };

        // Session specific
        var path = SESSION_ROOT + req.headers.session;
        clearPath(path);

        // Task specific variables
        var outCode = req.body.outCode;
        var out = req.body.out;
        var proving = req.body.proving;
        var witness = req.body.witness;
        var variables = req.body.variables;

        // Task action
        await writeFile(path + '/out.code', outCode);
        await writeFile(path + '/out', out);
        await writeFile(path + '/witness', witness);
        await writeFile(path + '/variables.inf', variables);
        await writeKey(path + '/proving.key', proving);
        await shelljs.exec('cd ' + path +' && ' + zokrates + ' ' + cmd.GENERATEPROOF, async (code, stdout, stderr) => {
            if (stderr != '') {
                response.msg = stderr;
                res.json(response);
                erasePath(path);
            } else {
                response.proof = await readFile(path + '/proof.json');
                response.suc = true;
                res.json(response);ls
                erasePath(path);
            }
        });
    });

    // Returns Zokrates version
    api.get('/version', async (req, res) => {
        var version = shelljs.exec(zokrates + ' ' + cmd.VERSION).stdout;
        res.send(version.toLocaleString());
    });

	// Returns API version
	api.get('/', (req, res) => {
		res.json({ version });
	});

	// Just a testing space
    api.get('/test', async (req, res) => {
        res.send('test');
    });

	return api;
}
