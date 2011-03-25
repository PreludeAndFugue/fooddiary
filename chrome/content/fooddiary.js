/*******************************************************************************
 * fooddiary.js
 * Gary Kerr
 * March 2011
 *
 * Core functionality for the fooddiary extension.
 ******************************************************************************/

/*
const Cr = Components.results;
const Cu = Components.utils;
*/

// create namespaces for functions
if (!fooddiary) var fooddiary = {

    Cc: Components.classes,
    Ci: Components.interfaces,
    Cu: Components.utils,
    
    // nsILocalFile
    db_path: null,

    /***************************************************************************
     * Initialisation - called when the interface has loaded (onload)
     **************************************************************************/
    init: function()
    {
        // get the current value of the database on disk
        var prefs = this.Cc["@mozilla.org/preferences-service;1"].
                getService(this.Ci.nsIPrefService).
                getBranch("extensions.fooddiary.");
        try
        {
            this.db_path = prefs.getComplexValue("db.path", this.Ci.nsILocalFile);
        }
        catch (e)
        {
            // do nothing
        }
        
        // check the db exists, etc
        this.db_check();

        // initialise db
        this.db.init(this.db_path);

        var datepicker = document.getElementById('fooddiary-datepicker');
        var day = datepicker.value;

        // the days tab
        this.add_brands_to_menulist('fooddiary-new-brand');
        this.add_brands_to_menulist('fooddiary-newitem-brand');
        this.refresh_day_treeview(day);
        this.refresh_totals_treeview(day);

        // the brands tab
        this.refresh_brand_treeview();

        // the foods tab
        this.refresh_food_treeview();

        // add event listener to the select event for the fooddiary-food
        // treeview
        var food = document.getElementById('fooddiary-food');
        food.addEventListener('select', food_select, false);
    },

    /***************************************************************************
     * (start-up) check the database exists at the location stored in prefs.
     **************************************************************************/
    db_check: function()
    {
        //var db_path = Application.prefs.get('extensions.fooddiary.db.path');

        if (!this.db_path || (this.db_path && !this.db_path.exists()))
        {
            window.openDialog("chrome://fooddiary/content/db_config.xul",
                "bla bla", "chrome, dialog, modal");
        }
    },

    /***************************************************************************
     * update the Days tab when the date is changed in the datepicker.
     **************************************************************************/
    change_day: function()
    {
        var datepicker = document.getElementById('fooddiary-datepicker');
        var day = datepicker.value;

        this.refresh_day_treeview(day);
        this.refresh_totals_treeview(day);
    },

    /***************************************************************************
     * update the items on the treeview in the days tab
     **************************************************************************/
    refresh_day_treeview: function(day)
    {
        var data = this.db.diary(day);
        // database colnames to insert into xul doc
        var col_names = ['day_id', 'brand_id', 'brand', 'name', 'amount',
            'prot', 'fat', 'carb', 'salt', 'calories'];
        this.refresh_treeview('diary-children', data, col_names);
    },

    /***************************************************************************
     * update the items of the totals at the bottom of the days tab
     **************************************************************************/
    refresh_totals_treeview: function(day)
    {
        var data = this.db.diary_total(day);
        var names = [['total-prot', 'prot'], ['total-fat', 'fat'],
            ['total-carb', 'carb'], ['total-salt', 'salt'],
            ['total-cals', 'cals']];
        var c_names = ['total-c-prot', 'total-c-fat', 'total-c-carb'];
        var pc_names = ['total-pc-prot', 'total-pc-fat', 'total-pc-carb'];

        // update the totals cells
        for (var idx in names)
        {
            var name = names[idx];
            var cell = document.getElementById(name[0]);
            cell.setAttribute('label', data[name[1]].toFixed(1));

            // only for prot, fat and carb columns
            if (idx < 3)
            {
                // update the calorie content cells
                var c_cell = document.getElementById(c_names[idx]);
                var mult = (idx == 1 ? 9.4 : 4.1);
                var c_value = (mult*data[name[1]]).toFixed(1);
                c_cell.setAttribute('label', c_value);
                // update the percentages cells
                var pc_cell = document.getElementById(pc_names[idx]);
                var pc_value = data['cals'] ? 100*c_value/data['cals'] : 0;
                pc_cell.setAttribute('label', pc_value.toFixed(1) + '%');
            }
        }
    },

    /***************************************************************************
     * Add or update an item in the food diary
     **************************************************************************/
    diary_add_item: function()
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
        var day_id = this.db.is_day_in_db(day);

        if (!day_id)
        {
            // if no record for day in db, then create one and add new diary item
            day_id = this.db.new_day(day);
            this.db.new_diary_item(day_id, item_id, amount);
        }
        else
        {
            if (this.db.is_item_in_diary(day_id, item_id))
            {
                // when the day exists and item already in diary then just update
                // the amount for this record
                this.db.update_diary_item(day_id, item_id, amount);
            }
            else
            {
                // otherwise create a record for this item
                this.db.new_diary_item(day_id, item_id, amount);
            }
        }

        // refresh the treeviews
        this.refresh_day_treeview(day);
        this.refresh_totals_treeview(day);
    },

    /***************************************************************************
     * Add all the brands to a menulist's menupopup items
     * Parameters
     *  menulist_id: the id of the menulist
     **************************************************************************/
    add_brands_to_menulist: function(menulist_id)
    {
        var data = this.db.brands();
        var col_names = ['brand', 'brand_id'];
        this.add_to_menulist(menulist_id, data, col_names);
    },

    /***************************************************************************
     * Update the contents of the treeview on the Brands tab
     **************************************************************************/
    refresh_brand_treeview: function()
    {
        var data = this.db.brands();
        var col_names = ['brand_id', 'brand'];
        this.refresh_treeview('brand-children', data, col_names);
    },

    /***************************************************************************
     * called when the brand menulist on the days tab is changed. Updates the items
     * in the Items menulist
     **************************************************************************/
    change_brand_on_day: function()
    {
        var brand = document.getElementById('fooddiary-new-brand');
        var brand_id = brand.selectedItem.value;

        // update the menulist of items
        var data = this.db.food(brand_id);
        var col_names = ['name', 'food_id'];
        this.add_to_menulist('fooddiary-new-item', data, col_names);

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
    },

    /***************************************************************************
     * Create a new brand and add to the database
     **************************************************************************/
    create_brand: function()
    {
        // the text in the new brand text box
        var new_brand = document.getElementById('new-brand-name').value;

        if (new_brand == "")
            return;

        // trim leading and trailing whitespace
        new_brand = new_brand.trim();

        var brand_exists = this.db.is_brand_in_db(new_brand);

        if (brand_exists)
        {
            var strbundle = document.getElementById("fd-strings");
            var brand_exists = strbundle.getString("brand_exists");

            // brand already exists in database
            this.show_message(brand_exists, brand_exists);
        }
        else
        {
            // add new brand to database
            this.db.new_brand(new_brand);
            // refresh treeview and menulists of brands
            this.refresh_brand_treeview();
            this.add_brands_to_menulist('fooddiary-new-brand');
            this.add_brands_to_menulist('fooddiary-newitem-brand');
        }
    },

    /***************************************************************************
     * Rename a brand
     **************************************************************************/
    rename_brand: function()
    {
        // the text in the new brand text box
        var new_brand = document.getElementById('new-brand-name').value;

        if (new_brand == "")
            return;

        // trim whitespace from brand name
        new_brand = new_brand.trim();

        var brand_exists = this.db.is_brand_in_db(new_brand);

        if (brand_exists)
        {
            var strbundle = document.getElementById("fd-strings");
            var brand_exists = strbundle.getString("brand_exists");
            // brand already exists in database
            this.show_message(brand_exists, brand_exists);
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
            // get the current day
            var datepicker = document.getElementById('fooddiary-datepicker');
            var day = datepicker.value;

            // update brand name in db
            this.db.rename_brand(brand_id, new_brand);

            // refresh menulists and treeviews
            this.refresh_brand_treeview();
            this.refresh_day_treeview(day);
            this.refresh_food_treeview();
            this.add_brands_to_menulist('fooddiary-new-brand');
            this.add_brands_to_menulist('fooddiary-newitem-brand');
        }
    },

    /***************************************************************************
     * Update the contents of the treeview on the Foods tab
     **************************************************************************/
    refresh_food_treeview: function()
    {
        var data = this.db.food();
        var col_names = ['food_id', 'brand', 'name', 'prot', 'fat', 'carb',
            'salt'];
        this.refresh_treeview('food-children', data, col_names);
    },

    /***************************************************************************
     * create a new food item and add to foods table
     **************************************************************************/
    create_food_item: function()
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

        var food_id = this.db.is_food_in_db(brand_id, item_name);

        if (food_id)
        {
            var strbundle = document.getElementById("fd-strings");
            var update_title = strbundle.getString("update_food_title");
            var update_msg = strbundle.getString("update_food_message");

            if (this.show_confirm(update_title, update_msg))
            {
                this.db.update_food(food_id, prot, fat, carb, salt);
                // in this case update the treeviews on the days tab just in case
                // the updated food item is in today's record
                var datepicker = document.getElementById('fooddiary-datepicker');
                var day = datepicker.value;
                this.refresh_day_treeview(day);
                this.refresh_totals_treeview(day);
            }
        }
        else
        {
            this.db.create_food(brand_id, item_name, prot, fat, carb, salt);
        }

        // once the item has been added or change, need to refresh the treeview
        this.refresh_food_treeview();
    },

    /***************************************************************************
     * General function for updating the contents of a treeview
     * Parameters:
     *  childname: the id of the treechildren element in xul doc
     *  data: the data rows from the db
     *  col_names: an array of strings of the names of the data cols in the data
     *             that will be added to the treeview.
     **************************************************************************/
    refresh_treeview: function(childname, data, col_names)
    {
        var treechildren = document.getElementById(childname);

        // remove any existing child elements
        while (treechildren.hasChildNodes())
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
                if (typeof col_data == "number")
                    col_data = col_data.toFixed(1);
                treecell.setAttribute('label', col_data);
                treerow.appendChild(treecell);
            }

            treeitem.appendChild(treerow);
            treechildren.appendChild(treeitem);
        }
    },

    /***************************************************************************
     * General function for updating the contents of a menulist
     * Parameters
     *  menulist_id: the id of the menulist
     *  data: rows from the database
     *  col_names: an array of strings of the cols db data
     **************************************************************************/
    add_to_menulist: function(menulist_id, data, col_names)
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
    },

    /***************************************************************************
     * show a message in a pop-up dialog with on OK button.
     * Paramaters
     *  title: the title on the dialog box
     *  message: the message in the dialog box.
     **************************************************************************/
    show_message: function(title, message)
    {
        var params = {message: message, title: title};
        window.openDialog("chrome://fooddiary/content/message.xul", "bla bla",
            "chrome, dialog, modal", params);
    },

    show_confirm: function(title, message)
    {
        var params = {message: message, title: title};
        window.openDialog("chrome://fooddiary/content/confirm.xul",
            "bla bla", "chrome, dialog, modal", params);

        return params.accept;
    },

};


/***************************************************************************
 * Event listener:
 * when an item in the food treeview of the food tab is selected its data is
 * entered in the 'add and modify food items' group
 **************************************************************************/
function food_select(event)
{
    // Within the scope of this event handler, 'this' refers to the treeview
    // which triggered the event.
    var view = this.view;
    var row_idx = this.currentIndex;
    var cols = this.columns;
    var id_col = cols.getNamedColumn('food-id');
    var food_id = view.getCellText(row_idx, id_col);
    // get the record for this food item from the database: 'row' is an
    // object with attributes.
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


// import database functions from js resource file into the fooddiary namespace
Components.utils.import("resource://fooddiary/db.js", fooddiary);
// module to help with the database setup
Components.utils.import("resource://fooddiary/db_setup.js", fooddiary);
