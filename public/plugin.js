var extension = new window.RemixExtension();
var P;
window.onload = function () {

    /*
     * LOAD PLUGIN
     */
    $('#tabs li:first-child').show();

    $.ajax({
        type: 'GET',
        url: '/api/version',
    })
        .done((res) => {
            $('#ZKv').text(res);
        })
        .fail((res) => {
            $('#ZKv').text("ZoKrates N/A");
            error.log(res);

        });

    $.ajax({
        type: 'GET',
        url: '/api/',
    })
        .done((res) => {
            $('#ZKPv').text("Plugin " + res.version);
        })
        .fail((res) => {
            $('#ZKPv').text("Plugin N/A");
            error.log(res);
        });

    extension.listen('compiler', 'compilationFinished', function () {
        console.log(arguments)
    });

    setInterval(function () {
        extension.call('app', 'detectNetWork', [], function (error, result) {
            console.log(error, result)
        })
    }, 5000);

    /*
     *  Nav bar simple/stupid handling of tabs (tbchanged to vue components in future)
     */

    $('.nav-item a').click(function () {
        $('.nav-item').attr('class', 'nav-item');
        $(this).parent('li').attr('class', 'nav-item active');
        $('.tab-item').hide();
        var n = $(this).parent('li').index() + 1;
        $('#tabs ' + 'li:nth-child(' + n + ')').show();
    });

    /*
     *  Create ZoKrates config folder in Remix
     *  TODO: Write README with instructions
     */
    extension.call('config', 'setConfig', ['README.md', '*proof of initiation*'],
        function (error, result) {
            console.log(error, result);
        });

    /*
     *  API triggers
     *  Instruction: When adding new API call please allways keep the request data bundle as first
     *  component of the trigger
     */

    /*
     * COMPILE
     */

    $('#btn-compile').click(async () => {
        var bundle = {
            code: code
        };

        $('#output-develop').hide();
        var reqID = Math.random().toString(36).substring(2);
        bundle.code = $('#code').val();

        $.ajax({
            type: 'POST',
            url: '/api/compile',
            headers: {
                session: reqID,
            },
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(bundle)
        })
            .done((res) => {
                if (res.suc == true) {
                    var out = res.out
                    extension.call('config', 'setConfig', ['out', res.out],
                        function (error, result) {
                            console.log(error, result);
                        });
                    extension.call('config', 'setConfig', ['out.code', res.outCode],
                        function (error, result) {
                            console.log(error, result);
                        });
                    $('#output-develop').text("Compiled successfuly!");
                    $('#output-develop').attr('class', 'msg success');
                    $('#output-develop').show();
                } else {
                    $('#output-develop').text(res.msg);
                    $('#output-develop').attr('class', 'msg error');
                    $('#output-develop').show();
                }
            })
            .fail((res) => {
                error.log(res);
                $('#output-develop').text(res);
                $('#output-develop').attr('class', 'msg error');
                $('#output-develop').show();
            });
    });

    /*
     *  SETUP
     */
    $('#btn-setup').click(async () => {
        var bundle = {
            out: '',
            outCode: ''
        };

        $("#output-develop").hide();
        var reqID = Math.random().toString(36).substring(2);

        extension.call('config', 'getConfig', ['out'], (err, res) => {
            if (err != null) {
                $("#output-develop").text('Compiled out file not found, please compile first!')
                $("#output-develop").attr('class', 'msg error');
                $("#output-develop").show();
                error.log(err);
            } else {
                $("#output-develop").text('Compiled code found!');
                $("#output-develop").attr('class', 'msg success');
                $("#output-develop").show();
                bundle.out = res;
                extension.call('config', 'getConfig', ['out.code'], (err, res) => {
                    if (err != null) {
                        $("#output-develop").text('Compiled out.code not found, please compile first!')
                        $("#output-develop").attr('class', 'msg error');
                        error.log(err);
                    } else {
                        $("#output-develop").text('Compiled code found!');
                        $("#output-develop").attr('class', 'msg success');
                        bundle.outCode = res;

                        $.ajax({
                            type: 'POST',
                            url: '/api/setup',
                            headers: {
                                session: reqID,
                            },
                            contentType: 'application/json',
                            dataType: 'json',
                            data: JSON.stringify(bundle)
                        })
                            .done((res) => {
                                if (res.suc == true) {
                                    //TODO: *This is just a stupid fix of an encoding issue, TO BE REMOVED asap
                                    $('#pkey').text(res.proving);
                                    extension.call('config', 'setConfig', ['verification.key', res.verification],
                                        function (error, result) {
                                            console.log(error, result);
                                        });
                                    extension.call('config', 'setConfig', ['proving.key', res.proving],
                                        function (error, result) {
                                            console.log(error, result);
                                        });
                                    extension.call('config', 'setConfig', ['variables.inf', res.variables],
                                        function (error, result) {
                                            console.log(error, result);
                                        });
                                    $('#output-develop').text('KEYs loaded in Remix!');
                                    $('#output-develop').attr('class', 'msg success');
                                } else {
                                    $('#output-develop').text(res.msg);
                                    $('#output-develop').attr('class', 'msg error');
                                    console.log("error setup");
                                }
                            })
                            .fail((res) => {
                                error.log(res);
                                $('#output-develop').text(res);
                                $('#output-develop').attr('class', 'msg error');
                            });
                    }
                });
            }
        });
    });

    /*
     *  COMPUTE WITNESS
     */
    $('#btn-witness').click(async () => {
        var bundle = {
            out: '',
            outCode: '',
            params: ''
        };

        $("#output-prove").hide();
        var reqID = Math.random().toString(36).substring(2);
        var args = $('#arguments').val().split('\n');
        for (i = 0; i < args.length; i++) {
            bundle.params += args[i].trim() + ' ';
        }
        bundle.params = bundle.params.trim();


        extension.call('config', 'getConfig', ['out'], (err, res) => {
            if (err != null) {
                $("#output-prove").text('Compiled out file not found, please repeat the previous step!')
                $("#output-prove").attr('class', 'msg error');
                $("#output-prove").show();
                error.log(err);
            } else {
                $("#output-prove").text('Compiled code found!');
                $("#output-prove").attr('class', 'msg success');
                $("#output-prove").show();
                bundle.out = res;
                extension.call('config', 'getConfig', ['out.code'], (err, res) => {
                    if (err != null) {
                        $("#output-prove").text('Compiled out.code not found, please repeat the previous step!')
                        $("#output-prove").attr('class', 'msg error');
                        $("#output-prove").show();
                        error.log(err);
                    } else {
                        $("#output-prove").text('Compiled code found!');
                        $("#output-prove").attr('class', 'msg success');
                        $("#output-prove").show();
                        bundle.outCode = res;

                        $.ajax({
                            type: 'POST',
                            url: '/api/compute-witness',
                            headers: {
                                session: reqID,
                            },
                            contentType: 'application/json',
                            dataType: 'json',
                            data: JSON.stringify(bundle)
                        })
                            .done((res) => {
                                if (res.suc == true) {
                                    extension.call('config', 'setConfig', ['witness', res.witness],
                                        function (error, result) {
                                            console.log(error, result);
                                            $("#output-prove").text('WITNESS loaded in Remix!');
                                            $("#output-prove").attr('class', 'msg success');
                                        });
                                } else {
                                    $("#output-prove").text(res.msg);
                                    $("#output-prove").attr('class', 'msg error');
                                    console.log("error witness");
                                }
                            })
                            .fail((res) => {
                                error.log(res);
                                $('#output-prove').text(res);
                                $('#output-prove').attr('class', 'msg error');
                            });
                    }
                });
            }
        });
    });

    /*
     *  EXPORT VERIFIER
     */
    $('#btn-verifier').click(async () => {
        var bundle = {
            out: '',
            outCode: '',
            verification: ''
        };

        $("#output-prove").hide();
        var reqID = Math.random().toString(36).substring(2);

        extension.call('config', 'getConfig', ['out'], (err, res) => {
            if (err != null) {
                $("#output-prove").text('Compiled OUT file not found, please repeat the previous step!')
                $("#output-prove").attr('class', 'msg error');
                $("#output-prove").show();
                error.log(err);
            } else {
                $("#output-prove").text('Compiled OUT file found!');
                $("#output-prove").attr('class', 'msg success');
                $("#output-prove").show();
                bundle.out = res;
                extension.call('config', 'getConfig', ['out.code'], (err, res) => {
                    if (err != null) {
                        $("#output-prove").text('Compiled OUT.CODE not found, please repeat the previous step!')
                        $("#output-prove").attr('class', 'msg error');
                        error.log(err);
                    } else {
                        $("#output-prove").text('Compiled OUT.CODE found!');
                        $("#output-prove").attr('class', 'msg success');
                        bundle.outCode = res;
                        extension.call('config', 'getConfig', ['verification.key'], (err, res) => {
                            if (err != null) {
                                $("#output-prove").text('VERIFICATION.KEY not found, please repeat the previous step!')
                                $("#output-prove").attr('class', 'msg error');
                                error.log(err);
                            } else {
                                $("#output-prove").text('VERIFICATION.KEY found!');
                                $("#output-prove").attr('class', 'msg success');
                                bundle.verification = res;

                                $.ajax({
                                    type: 'POST',
                                    url: '/api/export-verifier',
                                    headers: {
                                        session: reqID,
                                    },
                                    contentType: 'application/json',
                                    dataType: 'json',
                                    data: JSON.stringify(bundle)
                                })
                                    .done((res) => {
                                        if (res.suc == true) {
                                            extension.call('editor', 'setFile', ['browser/verifier.sol', res.verifier],
                                                function (error, result) {
                                                    console.log(error, result)
                                                });
                                            $("#output-prove").text('VERIFIER.sol loaded in Remix!');
                                            $("#output-prove").attr('class', 'msg success');
                                        } else {
                                            $("#output-prove").text(res.msg);
                                            $("#output-prove").attr('class', 'msg error');
                                            console.log("error verifier");
                                        }
                                    })
                                    .fail((res) => {
                                        error.log(res);
                                        $('#output-prove').text(res);
                                        $('#output-prove').attr('class', 'msg error');
                                    });
                            }
                        });
                    }
                });
            }
        });
    });

    /*
     *  EXPORT VERIFIER
     */
    $('#btn-proof').click(async () => {
        var bundle = {
            out: '',
            outCode: '',
            proving: '',
            witness: '',
            variables: ''
        };

        $("#output-prove").hide();
        var reqID = Math.random().toString(36).substring(2);

        extension.call('config', 'getConfig', ['out'], (err, res) => {
            if (err != null) {
                $("#output-prove").text('Compiled OUT file not found, please repeat the previous step!')
                $("#output-prove").attr('class', 'msg error');
                $("#output-prove").show();
                error.log(err);
            } else {
                $("#output-prove").text('Compiled OUT file found!');
                $("#output-prove").attr('class', 'msg success');
                $("#output-prove").show();
                bundle.out = res;
                extension.call('config', 'getConfig', ['out.code'], (err, res) => {
                    if (err != null) {
                        $("#output-prove").text('Compiled OUT.CODE not found, please repeat the previous step!')
                        $("#output-prove").attr('class', 'msg error');
                        error.log(err);
                    } else {
                        $("#output-prove").text('Compiled OUT.CODE found!');
                        $("#output-prove").attr('class', 'msg success');
                        bundle.outCode = res;
                        extension.call('config', 'getConfig', ['proving.key'], (err, res) => {
                            if ((err != null) || (res = '')) {
                                $("#output-prove").text('PROVING.KEY not found, please repeat the previous step!')
                                $("#output-prove").attr('class', 'msg error');
                                error.log(err);
                            } else {
                                $("#output-prove").text('PROVING.KEY found!');
                                $("#output-prove").attr('class', 'msg success');
                                // bundle.proving = res;
                                // TODO: This is just a stupid fix of an encoding issue, TO BE REMOVED asap
                                bundle.proving = $('#pkey').text();
                                extension.call('config', 'getConfig', ['witness'], (err, res) => {
                                    if (err != null) {
                                        $("#output-prove").text('WITNESS not found, please repeat the previous step!')
                                        $("#output-prove").attr('class', 'msg error');
                                        error.log(err);
                                    } else {
                                        $("#output-prove").text('WITNESS found!');
                                        $("#output-prove").attr('class', 'msg success');
                                        bundle.witness = res;
                                        extension.call('config', 'getConfig', ['variables.inf'], (err, res) => {
                                            if (err != null) {
                                                $("#output-prove").text('VARIABLES.INF not found, please repeat the previous step!')
                                                $("#output-prove").attr('class', 'msg error');
                                                error.log(err);
                                            } else {
                                                $("#output-prove").text('VARIABLES.INF found!');
                                                $("#output-prove").attr('class', 'msg success');
                                                bundle.variables = res;

                                                $.ajax({
                                                    type: 'POST',
                                                    url: '/api/generate-proof',
                                                    headers: {
                                                        session: reqID,
                                                    },
                                                    contentType: 'application/json',
                                                    dataType: 'json',
                                                    data: JSON.stringify(bundle)
                                                })
                                                    .done((res) => {
                                                        if (res.suc == true) {
                                                            extension.call('config', 'setConfig', ['proof', res.proof],
                                                                function (error, result) {
                                                                    console.log(error, result)
                                                                });
                                                            $("#output-prove").text('PROOF loaded in Remix!');
                                                            $("#output-prove").attr('class', 'msg success');
                                                        } else {
                                                            $("#output-prove").text(res.msg);
                                                            $("#output-prove").attr('class', 'msg error');
                                                            console.log("error verifier");
                                                        }
                                                    })
                                                    .fail((res) => {
                                                        error.log(res);
                                                        $('#output-prove').text(res);
                                                        $('#output-prove').attr('class', 'msg error');
                                                    });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}


//TODO: test buffer outup from setup call straight to gen-proof call
