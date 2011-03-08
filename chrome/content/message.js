/*******************************************************************************
 * initialisation code
 ******************************************************************************/
function init()
{
    params = window.arguments[0];
    document.title = params.title
    document.getElementById('main-message').value = params.message;
    // centre the dialog on the screen
    window.screenX = window.screen.width/2;
    window.screenY = window.screen.height/2;
}