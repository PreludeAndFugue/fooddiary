/*******************************************************************************
 * fooddiary.js
 * Gary Kerr
 * March 2011
 *
 * Core functionality for the fooddiary extension.
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
    // namespace for database functions
    fooddiary.db = {};
}

/*******************************************************************************
 * called when the 'Food Diary' menu button in the Tools menu is clicked. Opens
 * the Xul interface in a new tab of the browser.
 ******************************************************************************/
fooddiary.start = function(e)
{
    var tab = gBrowser.addTab("chrome://fooddiary/content/fooddiary.xul");
    
    
}

/*******************************************************************************
 * Initialisation - called when the interface has loaded (onload)
 ******************************************************************************/
fooddiary.init = function()
{
    // the days tab
    fooddiary.add_brands_to_menulist('fooddiary-new-brand');
    fooddiary.add_brands_to_menulist('fooddiary-newitem-brand');
    fooddiary.refresh_day_treeview();

    // the brands tab
    fooddiary.refresh_brand_treeview();

    // the foods tab
    fooddiary.refresh_food_treeview();
}

/*******************************************************************************
 * update the Days tab when the date is changed in the datepicker.
 ******************************************************************************/
fooddiary.change_day = function()
{
    fooddiary.refresh_day_treeview();
}

/*******************************************************************************
 * update the items on the treeview in the days tab
 ******************************************************************************/
fooddiary.refresh_day_treeview = function()
{
    var datepicker = document.getElementById('fooddiary-datepicker');
    var day = datepicker.value;
    
    data = fooddiary.db.diary(day);
    // database colnames to insert into xul doc
    col_names = ['day_id', 'brand_id', 'brand', 'name', 'amount', 'prot',
        'fat', 'carb', 'salt', 'calories'];
    fooddiary.refresh_treeview('diary-children', data, col_names);
}

/*******************************************************************************
 * Add or update an item in the food diary
 ******************************************************************************/
fooddiary.diary_add_item = function()
{
    // the item
    var item_id = document.getElementById('fooddiary-new-item').value;
    if (!item_id)
        return;
        
    // the amount
    var amount = document.getElementById('fooddiary-new-amount').valueNumber;
    
    // the current day
    var datepicker = document.getElementById('fooddiary-datepicker');
    var day = datepicker.value;
    var day_id = fooddiary.db.is_day_in_db(day);
    
    if (!day_id)
    {
        // if no record for day in db, then create one and add new diary item
        day_id = fooddiary.db.new_day(day);
        fooddiary.db.new_diary_item(day_id, item_id, amount);
    }
    else
    {
        if (fooddiary.db.is_item_in_diary(day_id, item_id))
        {
            // when the day exists and item already in diary then just update
            // the amount for this record
            fooddiary.db.update_diary_item(day_id, item_id, amount);
        }
        else
        {
            // otherwise create a record for this item
            fooddiary.db.new_diary_item(day_id, item_id, amount);
        }
    }
    
    // refresh the treeview
    fooddiary.refresh_day_treeview();
}

/*******************************************************************************
 * Add all the brands to a menulist's menupopup items
 * Parameters
 *  menulist_id: the id of the menulist
 ******************************************************************************/
fooddiary.add_brands_to_menulist = function(menulist_id)
{
    var data = fooddiary.db.brands();
    col_names = ['brand', 'brand_id'];
    fooddiary.add_to_menulist(menulist_id, data, col_names);
}

/*******************************************************************************
 * Update the contents of the treeview on the Brands tab
 ******************************************************************************/
fooddiary.refresh_brand_treeview = function()
{
    data = fooddiary.db.brands();
    col_names = ['brand_id', 'brand'];
    fooddiary.refresh_treeview('brand-children', data, col_names);
}

/*******************************************************************************
 * called when the brand menulist on the days tab is changed. Updates the items
 * in the Items menulist
 ******************************************************************************/
fooddiary.change_brand_on_day = function()
{
    var brand = document.getElementById('fooddiary-new-brand');
    var brand_id = brand.selectedItem.value;
    
    // update the menulist of items
    data = fooddiary.db.food(brand_id);
    col_names = ['name', 'food_id'];
    fooddiary.add_to_menulist('fooddiary-new-item', data, col_names);
    
    // if there are no items in the list, then make sure the list is disabled
    var new_item = document.getElementById('fooddiary-new-item');
    if (new_item.itemCount == 0)
    {
        new_item.disabled = true;
    }
    else
    {
        new_item.disabled = false;
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

    // trim leading and trailing whitespace
    new_brand = new_brand.trim();

    var brand_exists = fooddiary.db.is_brand_in_db(new_brand);

    if (brand_exists)
    {
        // brand already exists in database
        fooddiary.show_message("Brand already exists", "Brand already exists");
    }
    else
    {
        // add new brand to database
        fooddiary.db.new_brand(new_brand);
        // refresh treeview and menulists of brands
        fooddiary.refresh_brand_treeview();
        fooddiary.add_brands_to_menulist('fooddiary-new-brand');
        fooddiary.add_brands_to_menulist('fooddiary-newitem-brand');
    }
}

/*******************************************************************************
 * Rename a brand
 ******************************************************************************/
fooddiary.rename_brand = function()
{
    // the text in the new brand text box
    var new_brand = document.getElementById('new-brand-name').value;

    if (new_brand == "")
        return;
        
    // trim whitespace from brand name
    new_brand = new_brand.trim();
    
    var brand_exists = fooddiary.db.is_brand_in_db(new_brand);

    if (brand_exists)
    {
        // brand already exists in database
        fooddiary.show_message("Brand already exists", "Brand already exists");
    }
    else
    {
        // get brand id from treeview
        var tree = document.getElementById('fooddiary-brands');
        var view = tree.view;
        var row_idx = tree.currentIndex;
        var cols = tree.columns;
        var id_col = cols.getNamedColumn('brand-id');
        var brand_id = view.getCellText(row_idx, id_col);
        
        // update brand name in db
        fooddiary.db.rename_brand(brand_id, new_brand);
        
        // refresh menulists and treeviews
        fooddiary.refresh_brand_treeview();
        fooddiary.refresh_day_treeview();
        fooddiary.refresh_food_treeview();
        fooddiary.add_brands_to_menulist('fooddiary-new-brand');
        fooddiary.add_brands_to_menulist('fooddiary-newitem-brand');
    }
}

/*******************************************************************************
 * Update the contents of the treeview on the Foods tab
 ******************************************************************************/
fooddiary.refresh_food_treeview = function()
{
    data = fooddiary.db.food();
    col_names = ['food_id', 'brand', 'name', 'prot', 'fat', 'carb', 'salt'];
    fooddiary.refresh_treeview('food-children', data, col_names);
}


/*******************************************************************************
 * create a new food item and add to foods table
 ******************************************************************************/
fooddiary.create_food_item = function()
{
    // the brand id
    var brand = document.getElementById('fooddiary-newitem-brand');
    var brand_id = brand.value;
    // only continue if a brand is selected
    if (!brand_id)
        return;
        
    // the new item name
    var item = document.getElementById('fooddiary-newitem-name');
    var item_name = item.value.trim();
    // only continue if a name has been entered
    if (!item_name)
        return;
        
    // protein
    var prot = document.getElementById('fooddiary-newitem-protein').valueNumber;
    // fat
    var fat = document.getElementById('fooddiary-newitem-fat').valueNumber;
    // carb
    var carb = document.getElementById('fooddiary-newitem-carbs').valueNumber;
    // salt
    var salt = document.getElementById('fooddiary-newitem-salt').valueNumber;
        
    var food_id = fooddiary.db.is_food_in_db(brand_id, item_name);
    //alert('food in db: ' + food_id);
    
    if (food_id)
    {
        if (fooddiary.show_confirm("Update food item", "You are about to modify an existing food item. Do you want to continue?"))
        {
            fooddiary.db.update_food(food_id, prot, fat, carb, salt);
        }
    }
    else
    {
        fooddiary.db.create_food(brand_id, item_name, prot, fat, carb, salt);
    }
    
    // once the item has been added or change, need to refresh the treeview
    fooddiary.refresh_food_treeview();
}

/*******************************************************************************
 * when an item in the food treeview of the food tab is selected its data is
 * entered in the 'add and modify food items' group
 ******************************************************************************/
fooddiary.food_select = function()
{
    var tree = document.getElementById('fooddiary-food');
    var view = tree.view;
    var row_idx = tree.currentIndex;
    var cols = tree.columns;
    var id_col = cols.getNamedColumn('food-id');
    var food_id = view.getCellText(row_idx, id_col);
    // get the record for this food item from the database
    // this is an object with attributes
    var row = fooddiary.db.food_by_id(food_id);

    textbox_names = ['fooddiary-newitem-name', 'fooddiary-newitem-protein',
        'fooddiary-newitem-fat', 'fooddiary-newitem-carbs',
        'fooddiary-newitem-salt'];
    col_names = ['name', 'prot', 'fat', 'carb', 'salt'];
    
    for (var i = 0; i < col_names.length; i++)
    {
        var item = document.getElementById(textbox_names[i]);
        item.value = row[col_names[i]];
    }
    
    var brand_list = document.getElementById('fooddiary-newitem-brand');
    //alert(brand_list.selectedItem);
    brand_list.value = row['brand_id'];
}

/*******************************************************************************
 * General function for updating the contents of a treeview
 * Parameters:
 *  childname: the id of the treechildren element in xul doc
 *  data: the data rows from the db
 *  col_names: an array of strings of the names of the data cols in the data
 *             that will be added to the treeview.
 ******************************************************************************/
fooddiary.refresh_treeview = function(childname, data, col_names)
{
    var treechildren = document.getElementById(childname);

    // remove any existing child elements
    while(treechildren.hasChildNodes())
    {
        treechildren.removeChild(treechildren.firstChild);
    }

    for (var row in data)
    {
        var treeitem = document.createElement("treeitem");
        var treerow = document.createElement("treerow");

        for (var i in col_names)
        {
            var treecell = document.createElement("treecell");
            var col_name = col_names[i];
            var col_data = row[col_name];
            treecell.setAttribute('label', col_data);
            treerow.appendChild(treecell);
        }

        treeitem.appendChild(treerow);
        treechildren.appendChild(treeitem);
    }
}

/*******************************************************************************
 * General function for updating the contents of a menulist
 * Parameters
 *  menulist_id: the id of the menulist
 *  data: rows from the database
 *  col_names: an array of strings of the cols db data
 ******************************************************************************/
fooddiary.add_to_menulist = function(menulist_id, data, col_names)
{
    var menulist = document.getElementById(menulist_id);
    // make sure that existing list items are deleted first
    menulist.removeAllItems();

    // now iterate over the brands adding menuitems to the menupopup
    for (var row in data)
    {
        // label and value of list item
        var label = col_names[0];
        var value = col_names[1];
        menulist.appendItem(row[label], row[value]);
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

fooddiary.show_confirm = function(title, message)
{
    params = {message: message, title: title};
    window.openDialog("chrome://fooddiary/content/confirm.xul",
        "bla bla", "chrome, dialog, modal", params);
    
    return params.accept;
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
    var statement = db.createStatement("SELECT brand_id, brand FROM brands ORDER BY brand ASC");

    while (statement.executeStep())
    {
        yield statement.row;
    }

    statement.reset();
    // this causes an error - why?
    // TODO: how to close a database connection?
    //db.close();
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

/*******************************************************************************
 * rename a brand
 ******************************************************************************/
fooddiary.db.rename_brand = function(brand_id, new_name)
{
    var db = fooddiary.db.get_conn();
    var sql = "UPDATE brands SET brand = :new_name WHERE brand_id = :brand_id";
    var statement = db.createStatement(sql);
    statement.params.brand_id = brand_id;
    statement.params.new_name = new_name;
    statement.execute();
}

/*******************************************************************************
 * Does the brand name already exist in the database
 * Parameter:
 *  brand_name (string): the name of the brand
 ******************************************************************************/
fooddiary.db.is_brand_in_db = function(brand_name)
{
    var db = fooddiary.db.get_conn();
    var sql = "SELECT brand FROM brands WHERE brand = :brand_name";
    var statement = db.createStatement(sql);
    statement.params.brand_name = brand_name;

    // will be true if there is at least one row returned by query
    var result = statement.step();

    statement.reset();

    return result;
}

/*******************************************************************************
 * Get an array of all the foods in the database
 * Parameter:
 *  brand_id - (optional) used to filter the results for a particular brand.
 ******************************************************************************/
fooddiary.db.food = function(brand_id)
{
    var db = fooddiary.db.get_conn();
    var statement;
    var sql = "SELECT food.brand_id, brand, food_id, name, prot, fat, carb, " +
                "salt FROM food INNER JOIN brands ON food.brand_id = " +
                "brands.brand_id ";

    if (brand_id == null)
    {
        sql += "ORDER BY brand, name";
        statement = db.createStatement(sql);
    }
    else
    {
        sql += "WHERE food.brand_id = :brand_id ORDER BY brand, name";
        statement = db.createStatement(sql);
        statement.params.brand_id = brand_id;
    }

    while (statement.executeStep())
    {
        yield statement.row;
    }

    statement.reset();
}

/*******************************************************************************
 * Get a particular food item row by food_id
 ******************************************************************************/
fooddiary.db.food_by_id = function(food_id)
{
    var db = fooddiary.db.get_conn();
    var sql = "SELECT food.brand_id, brand, food_id, name, prot, fat, carb, " +
                "salt FROM food INNER JOIN brands ON food.brand_id = " +
                "brands.brand_id WHERE food_id = :food_id";
    var statement = db.createStatement(sql);
    statement.params.food_id = food_id;
    
    result = {};
    cols = ['brand_id', 'brand', 'food_id', 'name', 'prot', 'fat', 'carb', 'salt'];
    
    statement.executeStep();
    
    for (var idx in cols)
    {
        var col_name = cols[idx];
        result[col_name] = statement.row[col_name];
    }
    
    statement.reset();
    
    return result
}

/*******************************************************************************
 * Does the food item already exist in the database
 * Parameter:
 *  brand_id (integer): the id of the brand
 *  food_name (string): the name of the food item
 * Return value:
 *  the id of the food item if it is in the db, null otherwise
 ******************************************************************************/
fooddiary.db.is_food_in_db = function(brand_id, food_name)
{
    var db = fooddiary.db.get_conn();
    var sql = "SELECT food_id FROM food WHERE brand_id = :brand_id AND " +
              "name = :food_name";
    var statement = db.createStatement(sql);
    statement.params.brand_id = brand_id;
    statement.params.food_name = food_name;

    // will be true if there is at least one row returned by query
    if (statement.step())
    {
        var result = statement.row.food_id;
    }
    else
    {
        var result = null;
    }

    statement.reset();

    return result;
}

/*******************************************************************************
 * update a food item in the food table
 ******************************************************************************/
fooddiary.db.update_food = function(food_id, prot, fat, carb, salt)
{
    //alert('updating');
    var db = fooddiary.db.get_conn();
    var sql = "UPDATE food SET prot = :prot, fat = :fat, carb = :carb, " +
              "salt = :salt WHERE food_id = :food_id";
    var statement = db.createStatement(sql);
    statement.params.prot = prot;
    statement.params.fat = fat;
    statement.params.carb = carb;
    statement.params.salt = salt;
    statement.params.food_id = food_id;
    
    statement.execute();
}

/*******************************************************************************
 * create a new food item in the food table
 ******************************************************************************/
fooddiary.db.create_food = function(brand_id, food_name, prot, fat, carb, salt)
{
    //alert('creating');
    var db = fooddiary.db.get_conn();
    var sql = "INSERT INTO food (brand_id, name, prot, fat, carb, salt) " +
              "VALUES (:brand_id, :food_name, :prot, :fat, :carb, :salt)";
    var statement = db.createStatement(sql);
    statement.params.brand_id = brand_id;
    statement.params.food_name = food_name;
    statement.params.prot = prot;
    statement.params.fat = fat;
    statement.params.carb = carb;
    statement.params.salt = salt;
    
    statement.execute();
}

/*******************************************************************************
 * get the diary items for a particular day
 * Parameter:
 *  day (string): in the form 'yyyy-mm-dd'
 ******************************************************************************/
fooddiary.db.diary = function(day)
{
    var db = fooddiary.db.get_conn();
    var sql = 'SELECT diary.day_id, date, diary.food_id, amount, ' +
              'name, prot, ' +
              'fat, carb, salt, brand, food.brand_id, ' +
              '(4.1*(prot + carb) + 9.4*fat)*amount AS calories ' +
              'FROM diary ' +
              'LEFT JOIN days ON diary.day_id = days.day_id ' +
              'LEFT JOIN food ON diary.food_id = food.food_id ' +
              'LEFT JOIN brands ON food.brand_id = brands.brand_id ' +
              'WHERE date = :day ' +
              'ORDER BY brand, name';
    var statement = db.createStatement(sql);
    statement.params.day = day;
    
    while (statement.executeStep())
    {
        yield statement.row;
    }
    
    statement.reset();
}

/*******************************************************************************
 * Has a particular food item been added to a particular day in the diary.
 * Paramaters:
 *  day_id (integer): the id of the day
 *  item_id (integer): the id of the food item
 * Return:
 *  boolean
 ******************************************************************************/
fooddiary.db.is_item_in_diary = function(day_id, item_id)
{
    var db = fooddiary.db.get_conn();
    var sql = "SELECT rowid FROM diary WHERE day_id = :day_id AND " +
                "food_id = :item_id";
    var statement = db.createStatement(sql);
    statement.params.day_id = day_id;
    statement.params.item_id = item_id;
    
    var result = statement.step();
    statement.reset();
    
    return result
}

/*******************************************************************************
 * add a new item to the diary or update an existing one
 * Parameters:
 *  day_id (integer): the id of the day
 *  item_id (integer): the id of the food item
 *  amount (float): the amount
 ******************************************************************************/
fooddiary.db.new_diary_item = function(day_id, item_id, amount)
{
    var db = fooddiary.db.get_conn();
    var sql = "INSERT INTO diary (day_id, food_id, amount) " +
                "VALUES (:day_id, :item_id, :amount)";
    var statement = db.createStatement(sql);
    statement.params.day_id = day_id;
    statement.params.item_id = item_id;
    statement.params.amount = amount;
    statement.execute();
}

fooddiary.db.update_diary_item = function(day_id, item_id, amount)
{
    var db = fooddiary.db.get_conn();
    var sql = "UPDATE diary SET amount = :amount WHERE day_id = :day_id " +
                "AND food_id = :item_id";
    var statement = db.createStatement(sql);
    statement.params.day_id = day_id;
    statement.params.item_id = item_id;
    statement.params.amount = amount;
    statement.execute();
}

/*******************************************************************************
 * does a particular day already have a record in the database
 * Parameter:
 *  day (string): the day in format 'yyyy-mm-dd'
 * Return value:
 *  the day_id if the day exists, otherwise null
 ******************************************************************************/
fooddiary.db.is_day_in_db = function(day)
{
    var db = fooddiary.db.get_conn();
    var sql = "SELECT day_id, date FROM days WHERE date = :day";
    var statement = db.createStatement(sql);
    statement.params.day = day;

    // will be true if there is at least one row returned by query
    if (statement.step())
    {
        var result = statement.row.day_id;
    }
    else
    {
        var result = null;
    }

    statement.reset();

    return result;
}

/*******************************************************************************
 * add a new day to the database
 * Parameters:
 *  day (string): 'yyyy-mm-dd'
 * Return value:
 *  the id of the new record
 ******************************************************************************/
fooddiary.db.new_day = function(day)
{
    var db = fooddiary.db.get_conn();
    var sql = "INSERT INTO days (date) VALUES(:date)";
    var statement = db.createStatement(sql);
    statement.params.date = day;
    statement.execute();
    
    // should return the id of the new record that has been created
    statement = db.createStatement('SELECT last_insert_rowid() AS rowid');
    statement.step();
    var result = statement.row.rowid;
    statement.reset();
    
    return result;
}