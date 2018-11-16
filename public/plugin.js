var extension = new window.RemixExtension()

window.onload = function () {

    $.ajax({
        type: 'GET',
        url: '/api/version',
    }).done((res) => {
        $('#ZKv').text(res);
    });

    $.ajax({
        type: 'GET',
        url: '/api/',
    }).done((res) => {
        $('#ZKPv').text("Plugin " + res.version);
    });

    extension.listen('compiler', 'compilationFinished', function () {
        console.log(arguments)
    })

    setInterval(function () {
        extension.call('app', 'detectNetWork', [], function (error, result) {
            console.log(error, result)
        })
    }, 5000)


    $('#comp').click(function() {
        var code = $('#code').val();
        var reqID = Math.random().toString(36).substring(2);
        $.ajax({
            type: 'POST',
            url: '/api/export-verifier',
            headers: {
                session: reqID,
            },
            contentType: 'text/html',
            processData: false,
            data: code
        }).done((res) => {
            if (res.indexOf("pragma") != 0) {
                $('#compile-error-msg').text(res);
                $('#compile-error-msg').show();
            }
            else {
                var codeName = $('#codeName').val();
                if (codeName.substring(codeName.length - 4) != '.sol') {
                    codeName = codeName + '.sol';
                }

                extension.call('editor', 'getFile',['browser/'+codeName] ,
                    function (error, result) {
                        console.log(error, result)
                        if (result != '') {
                            codeName = codeName.substr(0, codeName.indexOf('.'))+'_new.sol';
                            $('#codeName').val(codeName);
                        }

                    extension.call('editor', 'setFile',['browser/'+codeName, res],
                        function (error, result) { console.log(error, result) });
                });
                $('#compile-error-msg').text("all good");
                $('#compile-error-msg').hide();
            }

        });
    });

}
