var extension = new window.RemixExtension()

window.onload = function () {
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
        $.ajax({
            type: 'POST',
            url: '/api/export-verifier',
            contentType: 'text/html',
            processData: false,
            data: code
        }).done((res) => {
            var codeName = $('#codeName').val();
            if (codeName.substring(-4,-1) !== '.sol') {
                codeName = codeName + '.sol';
            }
            extension.call('editor', 'setFile',['browser/test.sol', res],
                function (error, result) { console.log(error, result) });
        });
    });

}
