import { version } from '../../package.json';
import { Router } from 'express';
import {zokrates, cmd} from '../models/zokrates';
import shelljs from 'shelljs';
import fs from 'fs';

export default ({ config, db }) => {
	let api = Router();

    /**
     * The following API enables to send POST requests with a raw body containing the raw ZoKrates code and get regular
     * ZoKrates output back as an asynchronus response
     *
     * @example
     * Example request should look like this:

         POST /api/export-verifier HTTP/1.1
         Host: 127.0.0.1:8080
         Cache-Control: no-cache
         Postman-Token: 6d53a504-672d-eb53-0062-83ef50aa0e2b

         // only using add, no need to flatten
         def main(a):
         b = a + 5
         c = a + b + a + 4
         d = a + c + a + b
         return b + c + d
     */

	// Compile zokrates code into out.code
    api.post('/compile', (req, res) => {
        fs.writeFile("/tmp/test.code", req.body, () => {
            let file = '/tmp/test.code';
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + file, (code, stdout, stderr) => {
                fs.readFile('./out.code', (err, succ) => {
                    res.send(succ.toLocaleString());
                });
            });
		});
    });

    // Compute witness with arguments from the request header
    api.post('/compute-witness', (req, res) => {
        let params = req.query.args;

        fs.writeFile("/tmp/test.code", req.body, () => {
            let file = '/tmp/test.code';
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + file, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.COMPUTEWITNESS + ' -a ' + params, (code, stdout, stderr) => {
                    fs.readFile('./witness', (err, succ) => {
                        res.send(succ.toLocaleString());
                    });
                });
            });
        });
    });

    // Setup verification and proover keys
    api.post('/setup', (req, res) => {
        fs.writeFile("/tmp/test.code", req.body,  () => {
            let file = '/tmp/test.code';
            let keys = {};
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + file, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.SETUP, (code, stdout, stderr) => {
                    fs.readFile('./verification.key', (err, succ) => {
                        keys.verification = succ.toLocaleString();
                        fs.readFile('./proving.key', (err, succ) => {
                            keys.proving = succ.toLocaleString();
                            res.json(keys);
                        });
                    });
                });
            });
        });
    });

    // Export verifier in solidity code
    // TODO: if verifier key sent as an argument, don't generate new pair
    api.post('/export-verifier', (req, res) => {
        fs.writeFile("/tmp/test.code", req.body,  () => {
            let file = '/tmp/test.code';
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + file, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.SETUP, (code, stdout, stderr) => {
                    shelljs.exec(zokrates + ' ' + cmd.EXPORTVERIFIER, (code, stdout, stderr) => {
                        fs.readFile('./verifier.sol', (err, succ) => {
                            res.send(succ.toLocaleString());
                        });
                    });
                });
            });
        });
    });

    // Generate proof
    // TODO: if prover key send as an argument, don't generate new pair
    api.post('/generate-proof', (req, res) => {
        fs.writeFile("/tmp/test.code", req.body,  () => {
            let file = '/tmp/test.code';
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + file, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.SETUP, (code, stdout, stderr) => {
                    shelljs.exec(zokrates + ' ' + cmd.GENERATEPROOF, (code, stdout, stderr) => {
                        fs.readFile('./witness', (err, succ) => {
                            res.send(succ.toLocaleString());
                        });
                    });
                });
            });
        });
    });

    // Returns Zokrates version
    api.get('/version', (req, res) => {
        let version = shelljs.exec(zokrates + ' ' + cmd.VERSION).stdout;
        res.send(version.toLocaleString());
    });

	// Returns API version
	api.get('/', (req, res) => {
		res.json({ version });
	});


	return api;
}
