
if (typeof(fd_message) == 'undefined') var fd_message =
{
    init: function()
    {
        var params = window.arguments[0];
        document.title = params.title
        document.getElementById('main-message').value = params.message;
        // centre the dialog on the screen
        //window.screenX = (window.screen.width - window.outerWidth)/2;
        //window.screenY = (window.screen.height - window.outerHeight)/2;
    },

    accept: function()
    {
        var params = window.arguments[0];
        params.accept = true;
    },

    cancel: function()
    {
        var params = window.arguments[0];
        params.accept = false;
    },
};
