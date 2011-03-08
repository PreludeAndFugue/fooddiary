/*******************************************************************************
 * fooddiary.js
 * Gary Kerr
 * March 2011
 *
 *
 ******************************************************************************/

/*
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
*/

// create namespaces for functions
if (!fooddiary)
{
    var fooddiary = {};
    fooddiary.db = {};
}

/*******************************************************************************
 * called when the 'Food Diary' menu button in the Tools menu is clicked. Opens
 * the Xul interface in a new tab of the browser.
 ******************************************************************************/
fooddiary.start = function(e)
{
    gBrowser.addTab("chrome://fooddiary/content/fooddiary.xul");
}

/*******************************************************************************
 * Initialisation - called when the interface has loaded (onload)
 ******************************************************************************/
fooddiary.init = function()
{
    // the days tab
    fooddiary.add_brands_to_menulist('fooddiary-new-brand');
    fooddiary.add_brands_to_menulist('fooddiary-newitem-brand');
    
    // the brands tab
    fooddiary.refresh_brand_treeview()
}

/*******************************************************************************
 * Add all the brands to a menulist's menupopup items
 * Parameters
 *  menulist_id: the id of the menulist
 ******************************************************************************/
fooddiary.add_brands_to_menulist = function(menulist_id)
{
    var menulist = document.getElementById(menulist_id);
    // make sure that existing list items are deleted first
    menulist.removeAllItems();
    
    // now iterate over the brands adding menuitems to the menupopup
    var brands = fooddiary.db.brands();
    for (var i = 0; i < brands.length; i++)
    {
        menulist.appendItem(brands[i]);
    }
}

fooddiary.refresh_brand_treeview = function()
{
    // a list of all brands
    var brands = fooddiary.db.brands();
    
    var treechildren = document.getElementById("brand-children");
    
    // remove any existing child elements
    while(treechildren.hasChildNodes())
    {
        treechildren.removeChild(treechildren.firstChild);
    }
    
    // add the new child elements
    for (var i = 0; i < brands.length; i++)
    {
        var treeitem = document.createElement("treeitem");
        var treerow = document.createElement("treerow");
        var treecell = document.createElement("treecell");
        treecell.setAttribute("label", brands[i]);
        
        treerow.appendChild(treecell);
        treeitem.appendChild(treerow);
        
        treechildren.appendChild(treeitem);
    }
}

/*******************************************************************************
 * Create a new brand and add to the database
 ******************************************************************************/
fooddiary.create_brand = function()
{
    // the text in the new brand text box
    var new_brand = document.getElementById('new-brand-name').value;
    
    if (new_brand == "")
        return;
    
    // a list of brands
    brands = fooddiary.db.brands();
    
    var new_brand_idx = brands.indexOf(new_brand);
    //alert('brand index: ' + new_brand_idx);
    
    if (new_brand_idx != -1)
    {
        // brand already exists in database
        fooddiary.show_message("Brand already exists", "Brand already exists");
    }
    else
    {
        // add new brand to database
        fooddiary.db.new_brand(new_brand);
        // refresh treeview of brands
        fooddiary.refresh_brand_treeview();
        fooddiary.add_brands_to_menulist('fooddiary-new-brand');
        fooddiary.add_brands_to_menulist('fooddiary-newitem-brand');
    }
}

/*******************************************************************************
 * show a message in a pop-up dialog with on OK button.
 * Paramaters
 *  title: the title on the dialog box
 *  message: the message in the dialog box.
 ******************************************************************************/
fooddiary.show_message = function(title, message)
{
    params = {message: message, title: title};
    window.openDialog("chrome://fooddiary/content/message.xul", "bla bla",
        "chrome, dialog, modal", params);
}

/*******************************************************************************
 * database access *************************************************************
 ******************************************************************************/

/*******************************************************************************
 * Get a connection to the sqlite dababase on disk in the extension
 * directory
 ******************************************************************************/
fooddiary.db.get_conn = function()
{
    var file = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService(Components.interfaces.nsIProperties)
                .get("ProfD", Components.interfaces.nsIFile);
    file.append("extensions");
    file.append("fooddiary@preludeandfugue.net");
    file.append("fooddiary.sqlite");

    var storageService = Components.classes["@mozilla.org/storage/service;1"]
                        .getService(Components.interfaces.mozIStorageService);
    // Will also create the file if it does not exist - note that file must be
    // a valid sqlite db
    return storageService.openDatabase(file);
}

/*******************************************************************************
 * Get an array of all the brands in the database
 ******************************************************************************/
fooddiary.db.brands = function()
{
    var db = fooddiary.db.get_conn()
    var statement = db.createStatement("SELECT brand FROM brands ORDER BY brand ASC");
    
    result = [];
    
    while (statement.executeStep())
    {
        result.push(statement.row.brand);
        //result += brand + '\n';
    }
    
    statement.reset();
    // this causes an error - why?
    // TODO: how to close a database connection?
    //db.close();
    
    return result;
}

/*******************************************************************************
 * add a new brand to the database
 ******************************************************************************/
fooddiary.db.new_brand = function(new_brand_name)
{
    var db = fooddiary.db.get_conn();
    var sql = "INSERT INTO brands (brand) VALUES(:brand)";
    var statement = db.createStatement(sql);
    statement.params.brand = new_brand_name;
    statement.execute();
}