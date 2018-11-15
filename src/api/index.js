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

         // only using add, no need to flatten
         def main(a):
             b = a + 5
             c = a + b + a + 4
             d = a + c + a + b
             return b + c + d
     */

	// Compile zokrates code into out.code
    api.post('/compile', (req, res) => {
        var path = '/tmp/' + req.headers.session;
        var filePath = path + '/input.code';

        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }

        fs.writeFile(filePath, req.body, (suc,err) => {
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + filePath, (code, stdout, stderr) => {
                shelljs.exec('mv ./out.code ' + path + '/out.code');
                fs.readFile(path + '/out.code', (err, succ) => {
                    res.send(succ.toLocaleString());
                    shelljs.exec('rm -rf ' + path);
                });
            });
		});
    });

    // Compute witness with arguments from the request header
    api.post('/compute-witness', (req, res) => {
        var path = '/tmp/' + req.headers.session;
        var filePath = path + '/input.code';

        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }

        let params = req.query.args;

        fs.writeFile(filePath, req.body, () => {
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + filePath, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.COMPUTEWITNESS + ' -a ' + params, (code, stdout, stderr) => {
                    shelljs.exec('mv ./witness ' + path + '/witness');
                    fs.readFile(path + '/witness', (err, succ) => {
                        res.send(succ.toLocaleString());
                        shelljs.exec('rm -rf ' + path);
                    });
                });
            });
        });
    });

    // Setup verification and proover keys
    api.post('/setup', (req, res) => {
        var path = '/tmp/' + req.headers.session;
        var filePath = path + '/input.code';

        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }

        fs.writeFile(filePath, req.body,  () => {
            var keys = {};
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + filePath, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.SETUP, (code, stdout, stderr) => {
                    shelljs.exec('mv ./verification.key ' + path + '/verification.key');
                    shelljs.exec('mv ./proving.key ' + path + '/proving.key');
                    fs.readFile(path + '/verification.key', (err, succ) => {
                        keys.verification = succ.toLocaleString();
                        fs.readFile(path + '/proving.key', (err, succ) => {
                            keys.proving = succ.toLocaleString();
                            res.json(keys);
                            shelljs.exec('rm -rf ' + path);
                        });
                    });
                });
            });
        });
    });

    // Export verifier in solidity code
    // TODO: if verifier key sent as an argument, don't generate new pair
    api.post('/export-verifier', (req, res) => {
        var path = '/tmp/' + req.headers.session;
        var filePath = path + '/input.code';

        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }

        console.log(req.body);

        fs.writeFile(filePath, req.body,  () => {
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + filePath, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.SETUP, (code, stdout, stderr) => {
                    shelljs.exec(zokrates + ' ' + cmd.EXPORTVERIFIER, (code, stdout, stderr) => {
                        shelljs.exec('mv ./verifier.sol ' + path + '/verifier.sol');
                        fs.readFile(path + '/verifier.sol', (err, succ) => {
                            res.send(succ.toLocaleString());
                            shelljs.exec('rm -rf ' + path);
                        });
                    });
                });
            });
        });
    });

    // Generate proof
    // TODO: if prover key send as an argument, don't generate new pair
    api.post('/generate-proof', (req, res) => {
        var path = '/tmp/' + req.headers.session;
        var filePath = path + '/input.code';

        if (!fs.existsSync(path)){
            fs.mkdirSync(path);
        }

        fs.writeFile(filePath, req.body,  () => {
            shelljs.exec(zokrates + ' ' + cmd.COMPILE + ' -i ' + filePath, (code, stdout, stderr) => {
                shelljs.exec(zokrates + ' ' + cmd.SETUP, (code, stdout, stderr) => {
                    shelljs.exec(zokrates + ' ' + cmd.GENERATEPROOF, (code, stdout, stderr) => {
                        shelljs.exec('mv ./witness ' + path + '/witness');
                        fs.readFile(path + '/witness', (err, succ) => {
                            console.log(err)
                            res.send(succ.toLocaleString());

                            shelljs.exec('rm -rf ' + path);
                        });
                    });
                });
            });
        });
    });

    // Returns Zokrates version
    api.get('/version', (req, res) => {
        var version = shelljs.exec(zokrates + ' ' + cmd.VERSION).stdout;
        res.send(version.toLocaleString());
    });

	// Returns API version
	api.get('/', (req, res) => {
		res.json({ version });
	});


	return api;
}
