/*******************************************************************************
 * initialisation code
 ******************************************************************************/
function init()
{
    params = window.arguments[0];
    document.title = params.title
    document.getElementById('main-message').value = params.message;
    // centre the dialog on the screen
    window.screenX = (window.screen.width - window.outerWidth)/2;
    window.screenY = (window.screen.height - window.outerHeight)/2;
}

function accept()
{
    params = window.arguments[0];
    params.accept = true;
}

function cancel()
{
    params = window.arguments[0];
    params.accept = false;
}