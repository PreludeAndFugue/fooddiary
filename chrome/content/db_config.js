/*******************************************************************************
 * db config dialog box code
 *
 *
 *
 ******************************************************************************/

// note: importing db_setup.js at bottom of code, after setting up fd_config.

// create namespaces for functions
if (typeof(fd_config) == 'undefined') var fd_config =
{
    /*
    Cc: Components.classes,
    Ci: Components.interfaces,
    */
    Cc: null,
    Ci: null,
    // the path stored in the preferences
    pref_path: null,
    // the textbox which displays the path
    location: null,
    // the location chosen by the user (nsIFileLocal instance)
    path: null,
    // is a new file being created
    new_file: false,
    // results to be passed back to main window
    return_values: null,

    init: function()
    {
        //console.log('hello from db_config.js');
        alert('hello from db_config.js');
    
        this.Cc = Components.classes;
        this.Ci = Components.interfaces;

        this.db_setup.init();

        //window.screenX = (window.screen.width - window.outerWidth)/2;
        //window.screenY = (window.screen.height - window.outerHeight)/2;
        //window.screenX = (window.screen.width - 400)/2;
        //window.screenY = (window.screen.height - 270)/2;
        //window.centerWindowOnScreen();
        this.pref_path = this.get_pref_path();
        this.location = document.getElementById("fd-db-location");
        // capture the return values object from the incoming arguments
        this.return_values = window.arguments[0];
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

    /***************************************************************************
     * Choose a dir to save the new database
     **************************************************************************/
    config_dir: function()
    {
        var strbundle = document.getElementById("fd-strings");
        var choose_dir = strbundle.getString("choose_dir");

        this.path = this.db_setup.pick_dir(choose_dir);

        if (this.path)
        {
            this.path.append("fooddiary.sqlite");
            // fill in the path in the textbox
            this.location.value = this.path.path;
            // creating a new database file
            this.new_file = true;

            // set the return value for the main window
            this.return_values.new_path = this.path;
        }
    },

    /***************************************************************************
     * Choose an existing db file
     **************************************************************************/
    config_file: function()
    {
        var strbundle = document.getElementById("fd-strings");
        var choose_file = strbundle.getString("choose_file");
        // this.path will be null if anything other than a sqlite db is chosen
        this.path = this.db_setup.pick_file(choose_file);

        if (this.path)
        {
            // fill in the textbox
            this.location.value = this.path.path;
            // using an existing file
            this.new_file = false;
            // set the return value for the main window
            this.return_values.new_path = this.path;
        }
    },

    /***************************************************************************
     * save a path to the prefs
     **************************************************************************/
    save_pref_path: function(path)
    {
        var prefs = this.Cc["@mozilla.org/preferences-service;1"].
            getService(this.Ci.nsIPrefService).
            getBranch("extensions.fooddiary.");

        prefs.setComplexValue('db.path', this.Ci.nsILocalFile, path);
    },

    /***************************************************************************
     * get path from prefs
     **************************************************************************/
    get_pref_path: function()
    {
        var prefs = this.Cc["@mozilla.org/preferences-service;1"].
            getService(this.Ci.nsIPrefService).
            getBranch("extensions.fooddiary.");

        try
        {
            var result = prefs.getComplexValue('db.path', this.Ci.nsILocalFile);
        }
        catch (e)
        {
            var result = '';
        }

        return result;
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
        
        //console.log('db_config.js, db path: ', db);
        //alert('copying db to new location');
        //alert('db location: ' + db.path);
        //alert('db exists: ' + db.exists());
        //alert('new path: ' + new_path.path);
        //alert('new path is dir: ' + new_path.isDirectory());

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
Components.utils.import("resource://fooddiary/db_setup.js", fd_config);
