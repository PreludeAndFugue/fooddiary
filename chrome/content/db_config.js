/*******************************************************************************
 * db config dialog box code
 *
 *
 *
 ******************************************************************************/

// note: importing db_setup.js at bottom of code, after setting up fd.

// create namespaces for functions
if (!fd) var fd =
{
    Cc: Components.classes,
    Ci: Components.interfaces,
    // the path stored in the preferences
    pref_path: null,
    // the textbox which displays the path
    location: null,
    // the location chosen by the user
    path: null,
    // the accept button
    button_accept: null,
    // the cancel button
    button_cancel: null,

    init: function()
    {
        //window.screenX = (window.screen.width - window.outerWidth)/2;
        //window.screenY = (window.screen.height - window.outerHeight)/2;
        window.centerWindowOnScreen();
        this.pref_path = Application.prefs.get('extensions.fooddiary.db.path');
        this.location = document.getElementById("fd-db-location");
        // set the accept and cancel buttons
        this.button_accept = document.documentElement.getButton("accept");
        this.button_cancel = document.documentElement.getButton("cancel");
        // disable the accept and cancel buttons
        this.button_accept.disabled = true;
        this.button_cancel.disabled = true;
    },

    accept: function()
    {
        alert('ok');
        // set default path to new location


        return this.path;
    },

    cancel: function()
    {
        alert('cancel');
        return null;
    },

    /***********************************************************************
     * Choose a dir to save the new database
     **********************************************************************/
    config_dir: function()
    {
        this.path = this.db_setup.pick_dir("Choose a directory in which to save the database.");

        if (this.path)
        {
            this.path.append("fooddiary.sqlite");
            this.location.value = this.path.path;
        }
    },

    /***********************************************************************
     * Choose an existing db file
     **********************************************************************/
    config_file: function()
    {
        this.path = this.db_setup.pick_file("Choose an existing food diary database.");

        if (this.path && this.is_valid_db(this.path))
        {
            this.location.value = this.path.path;
        }
    },

    /***************************************************************************
     * Is a path object a valid sqlite database
     **************************************************************************/
    is_valid_db: function(path)
    {
        var storageService = this.Cc["@mozilla.org/storage/service;1"]
                        .getService(this.Ci.mozIStorageService);
        try
        {
            var db = storageService.openDatabase(path);
        }
        catch (e)
        {
            // error will be thrown when path is not a valid sqlite file
            return false;
        }
        // no error thrown so close database
        db.close();
        return true;
    },
};

// module to help with the database setup
Components.utils.import("resource://fooddiary/db_setup.js", fd);
