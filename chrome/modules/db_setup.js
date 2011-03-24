/*******************************************************************************
 * Code to help setup the database
 *
 ******************************************************************************/

var EXPORTED_SYMBOLS = ["db_setup"];

if (!db_setup) var db_setup = {

    Cc: Components.classes,
    Ci: Components.interfaces,

    FILE: 0,
    DIR: 1,

    /***************************************************************************
     * Prompt the user for the location for a file or a dir
     **************************************************************************/
    _picker: function(file_or_dir, prompt)
    {
        var ifp = this.Ci.nsIFilePicker;
        var file_picker = this.Cc["@mozilla.org/filepicker;1"]
                            .createInstance(ifp);
        // the window used as the parent of the dialog
        var wm = this.Cc["@mozilla.org/appshell/window-mediator;1"]
                    .getService(this.Ci.nsIWindowMediator);
        var browserWindow = wm.getMostRecentWindow("navigator:browser");

        switch (file_or_dir)
        {
            case this.DIR:
                var mode = ifp.modeGetFolder;
                break;
            case this.FILE:
            default:
                var mode = ifp.modeOpen;
                break;
        }

        // configure the file picker dialog
        file_picker.init(browserWindow, prompt, mode);

        var result = file_picker.show();

        if (result == ifp.returnOK)
        {
            return file_picker.file;
        }
        else
        {
            return null;
        }
    },

    /*******************************************************************************
     * prompt user to pick a directory
     ******************************************************************************/
    pick_dir: function(prompt)
    {
        return this._picker(this.DIR, prompt);
    },

    /*******************************************************************************
     * prompt user to pick a sqlite file
     ******************************************************************************/
    pick_file: function(prompt)
    {
        // potential sqlite file
        var db_path = this._picker(this.FILE, prompt);
        if (db_path && this.is_valid_db(db_path))
        {
            return db_path;
        }
        else
        {
            return null;
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

    /***************************************************************************
     * copy default db to new location
     **************************************************************************/
    copy_db: function(path)
    {
        // the default db
        var db = this.Cc["@mozilla.org/file/directory_service;1"]
                    .getService(this.Ci.nsIProperties)
                    .get("DefRt", this.Ci.nsIFile);
        db.append("fooddiary.sqlite");

        alert(typeof(db) + ' ' + db.path);

        db.copyTo(path);
    },
};
