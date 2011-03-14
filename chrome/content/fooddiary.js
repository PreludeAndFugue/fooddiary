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
    
    // import database functions from js resource file into the fooddiary
    // namespace
    Components.utils.import("resource://fooddiary/db.js", fooddiary);
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
    
    // add event listener to the select event for the fooddiary-food
    // treeview
    var food = document.getElementById('fooddiary-food');
    food.addEventListener('select', fooddiary.food_select,false);
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
fooddiary.food_select = function(event)
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