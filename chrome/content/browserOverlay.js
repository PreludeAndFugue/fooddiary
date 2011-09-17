if (typeof(fooddiary) == 'undefined')
    var fooddiary = {
        tab: null,
    };

/*******************************************************************************
 * called when the 'Food Diary' menu button in the Tools menu is clicked. Opens
 * the XUL interface in a new tab of the browser.
 ******************************************************************************/
fooddiary.start = function(e) {
    if (this.tab === null) {
        this.tab = gBrowser.addTab("chrome://fooddiary/content/fooddiary.xul");
        gBrowser.selectedTab = this.tab;
    } else {
        /*
        if (gBrowser.selectedTab != this.tab) {
            gBrowser.selectedTab = this.tab;
        */
        if (gBrowser.selectedTab != this.tab) {
            gBrowser.selectedTab = this.tab;
        } else {
            gBrowser.removeTab(this.tab);
            this.tab = null;
        }
    }
}
