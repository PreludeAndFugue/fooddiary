var fooddiary = {};

/*******************************************************************************
 * called when the 'Food Diary' menu button in the Tools menu is clicked. Opens
 * the XUL interface in a new tab of the browser.
 ******************************************************************************/
fooddiary.start = function(e)
{
    var tab = gBrowser.addTab("chrome://fooddiary/content/fooddiary.xul");
    gBrowser.selectedTab = tab;
}