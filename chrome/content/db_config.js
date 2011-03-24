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
    // the location chosen by the user (nsIFileLocal instance)
    path: null,
    // is a new file being created
    new_file: false,

    init: function()
    {
        //window.screenX = (window.screen.width - window.outerWidth)/2;
        //window.screenY = (window.screen.height - window.outerHeight)/2;
        window.screenX = (window.screen.width - 400)/2;
        window.screenY = (window.screen.height - 270)/2;
        //window.centerWindowOnScreen();
        this.pref_path = this.get_pref_path();
        this.location = document.getElementById("fd-db-location");
    },

    accept: function()
    {
        // set default path to new location
        this.save_pref_path(this.path);

        if (this.new_file)
        {
            // copy default db to new location
            this.copy_db(this.path.parent);
        }
    },

    /***********************************************************************
     * Choose a dir to save the new database
     **********************************************************************/
    config_dir: function()
    {
        var prompt = "Choose a directory in which to save the database.";
        this.path = this.db_setup.pick_dir(prompt);

        if (this.path)
        {
            this.path.append("fooddiary.sqlite");
            // fill in the path in the textbox
            this.location.value = this.path.path;
            // creating a new database file
            this.new_file = true;
        }
    },

    /***********************************************************************
     * Choose an existing db file
     **********************************************************************/
    config_file: function()
    {
        var prompt = "Choose an existing food diary database.";
        // this.path will be null if anything other than a sqlite db is chosen
        this.path = this.db_setup.pick_file(prompt);

        if (this.path)
        {
            // fill in the textbox
            this.location.value = this.path.path;
            // using an existing file
            this.new_file = false;
        }
    },

    /*******************************************************************************
     * save a path to the prefs
     ******************************************************************************/
    save_pref_path: function(path)
    {
        var prefs = this.Cc["@mozilla.org/preferences-service;1"].
            getService(this.Ci.nsIPrefService).
            getBranch("extensions.fooddiary.");

        prefs.setComplexValue('db.path', this.Ci.nsILocalFile, path);
    },
    
    /*******************************************************************************
     * get path from prefs
     ******************************************************************************/
    get_pref_path: function()
    {
        var prefs = this.Cc["@mozilla.org/preferences-service;1"].
            getService(this.Ci.nsIPrefService).
            getBranch("extensions.fooddiary.");

        return prefs.getComplexValue('db.path', this.Ci.nsILocalFile);
    },

    /***************************************************************************
     * copy default db to new location
     **************************************************************************/
    copy_db: function(new_path)
    {
        // the default db
        var db = this.Cc["@mozilla.org/file/directory_service;1"]
                    .getService(this.Ci.nsIProperties)
                    .get("ProfD", this.Ci.nsIFile);
        db.append('extensions');
        db.append('fooddiary@preludeandfugue.net');
        db.append('defaults');
        db.append("fooddiary.sqlite");

        try
        {
            db.copyTo(new_path, null);
        }
        catch (e)
        {
            // what should happen here?
            //alert(e);
        }
    },
};

// module to help with the database setup
Components.utils.import("resource://fooddiary/db_setup.js", fd);
