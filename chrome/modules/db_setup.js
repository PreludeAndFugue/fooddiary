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
    
    /*******************************************************************************
     * Prompt the user for the location for a file or a dir
     ******************************************************************************/
    picker: function(file_or_dir, prompt)
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
                mode = ifp.modeGetFolder;
                break;
            case this.FILE:
            default:
                mode = ifp.modeOpen;
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
};
