if (typeof(fooddiary) == 'undefined')
    var fooddiary = {
        tab: null,
        container: null,
        shut: null,
    };

/*******************************************************************************
 * called when the 'Food Diary' menu button in the Tools menu is clicked. Opens
 * the XUL interface in a new tab of the browser.
 ******************************************************************************/
fooddiary.start = function(e) {
    if (this.container === null) {
        this.container = gBrowser.tabContainer;
    }

    if (this.shut === null) {
        this_fd = this;
        this.shut = function(event) {
            if (this_fd.tab === event.target) {
                this_fd.container.removeEventListener('TabClose', this_fd.shut, false);
                this_fd.tab = null;
            }
        };
    }

    if (this.tab === null) {
        this.tab = gBrowser.addTab("chrome://fooddiary/content/fooddiary.xul");
        gBrowser.selectedTab = this.tab;
        this.container.addEventListener('TabClose', this.shut, false);

    } else {
        if (gBrowser.selectedTab != this.tab) {
            gBrowser.selectedTab = this.tab;
        } else {
            gBrowser.removeTab(this.tab);
        }
    }
};
