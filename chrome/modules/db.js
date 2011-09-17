/*******************************************************************************
 * database access
 *
 ******************************************************************************/

var EXPORTED_SYMBOLS = ["db"];

if (!db) var db = {

    Cc: null, //Components.classes,
    Ci: null, //Components.interfaces,

    // nsiLocalFile object
    db_path: null,

    init: function(path)
    {
        this.Cc = Components.classes;
        this.Ci = Components.interfaces;
        this.db_path = path;
    },

    /***************************************************************************
     * Get a connection to the sqlite dababase on disk in the extension
     * directory
     **************************************************************************/
    get_conn: function()
    {
        var storageService = this.Cc["@mozilla.org/storage/service;1"]
                            .getService(this.Ci.mozIStorageService);
        // Will also create the file if it does not exist - note that file must
        // be a valid sqlite db
        return storageService.openDatabase(this.db_path);
    },

    /***************************************************************************
     * Get an array of all the brands in the database
     **************************************************************************/
    brands: function()
    {
        var conn = this.get_conn()
        var sql = "SELECT brand_id, brand FROM brands ORDER BY brand ASC"
        var statement = conn.createStatement(sql);

        while (statement.executeStep())
        {
            yield statement.row;
        }

        statement.reset();
        // this causes an error - why?
        // TODO: how to close a database connection?
        //db.close();
    },

    /***************************************************************************
     * add a new brand to the database
     **************************************************************************/
    new_brand: function(new_brand_name)
    {
        var conn = this.get_conn();
        var sql = "INSERT INTO brands (brand) VALUES(:brand)";
        var statement = conn.createStatement(sql);
        statement.params.brand = new_brand_name;
        statement.execute();
    },

    /***************************************************************************
     * rename a brand
     **************************************************************************/
    rename_brand: function(brand_id, new_name)
    {
        var conn = this.get_conn();
        var sql = "UPDATE brands SET brand = :new_name WHERE brand_id = :brand_id";
        var statement = conn.createStatement(sql);
        statement.params.brand_id = brand_id;
        statement.params.new_name = new_name;
        statement.execute();
    },

    /***************************************************************************
     * Does the brand name already exist in the database
     * Parameter:
     *  brand_name (string): the name of the brand
     **************************************************************************/
    is_brand_in_db: function(brand_name)
    {
        var conn = this.get_conn();
        var sql = "SELECT brand FROM brands WHERE brand = :brand_name";
        var statement = conn.createStatement(sql);
        statement.params.brand_name = brand_name;

        // will be true if there is at least one row returned by query
        var result = statement.step();

        statement.reset();

        return result;
    },

    /***************************************************************************
     * Get an array of all the foods in the database
     * Parameter:
     *  brand_id - (optional) used to filter the results for a particular brand.
     **************************************************************************/
    food: function(brand_id)
    {
        var conn = this.get_conn();
        var statement;
        var sql = "SELECT food.brand_id, brand, food_id, name, prot, fat, " +
                  "carb, salt FROM food INNER JOIN brands ON food.brand_id = " +
                  "brands.brand_id ";

        if (!brand_id)
        {
            sql += "ORDER BY brand, name";
            statement = conn.createStatement(sql);
        }
        else
        {
            sql += "WHERE food.brand_id = :brand_id ORDER BY brand, name";
            statement = conn.createStatement(sql);
            statement.params.brand_id = brand_id;
        }

        while (statement.executeStep())
        {
            yield statement.row;
        }

        statement.reset();
    },

    /***************************************************************************
     * Get a particular food item row by food_id
     **************************************************************************/
    food_by_id: function(food_id)
    {
        var conn = this.get_conn();
        var sql = "SELECT food.brand_id, brand, food_id, name, prot, fat, " +
                  "carb, salt FROM food INNER JOIN brands ON food.brand_id = " +
                  "brands.brand_id WHERE food_id = :food_id";
        var statement = conn.createStatement(sql);
        statement.params.food_id = food_id;

        var result = {};
        var cols = ['brand_id', 'brand', 'food_id', 'name', 'prot', 'fat',
                    'carb', 'salt'];

        statement.executeStep();

        for (var idx in cols)
        {
            var col_name = cols[idx];
            result[col_name] = statement.row[col_name];
        }

        statement.reset();

        return result
    },

    /***************************************************************************
     * Does the food item already exist in the database
     * Parameter:
     *  brand_id (integer): the id of the brand
     *  food_name (string): the name of the food item
     * Return value:
     *  the id of the food item if it is in the db, null otherwise
     **************************************************************************/
    is_food_in_db: function(brand_id, food_name)
    {
        var conn = this.get_conn();
        var sql = "SELECT food_id FROM food WHERE brand_id = :brand_id AND " +
                  "name = :food_name";
        var statement = conn.createStatement(sql);
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
    },

    /***************************************************************************
     * update a food item in the food table
     **************************************************************************/
    update_food: function(food_id, prot, fat, carb, salt)
    {
        var conn = this.get_conn();
        var sql = "UPDATE food SET prot = :prot, fat = :fat, carb = :carb, " +
                  "salt = :salt WHERE food_id = :food_id";
        var statement = conn.createStatement(sql);
        statement.params.prot = prot;
        statement.params.fat = fat;
        statement.params.carb = carb;
        statement.params.salt = salt;
        statement.params.food_id = food_id;

        statement.execute();
    },

    /***************************************************************************
     * create a new food item in the food table
     **************************************************************************/
    create_food: function(brand_id, food_name, prot, fat, carb, salt)
    {
        var conn = this.get_conn();
        var sql = "INSERT INTO food (brand_id, name, prot, fat, carb, salt) " +
                  "VALUES (:brand_id, :food_name, :prot, :fat, :carb, :salt)";
        var statement = conn.createStatement(sql);
        statement.params.brand_id = brand_id;
        statement.params.food_name = food_name;
        statement.params.prot = prot;
        statement.params.fat = fat;
        statement.params.carb = carb;
        statement.params.salt = salt;

        statement.execute();
    },

    /***************************************************************************
     * get the diary items for a particular day
     * Parameter:
     *  day (string): in the form 'yyyy-mm-dd'
     **************************************************************************/
    diary: function(day)
    {
        if (!day)
            return;

        var conn = this.get_conn();
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
        var statement = conn.createStatement(sql);
        statement.params.day = day;

        while (statement.executeStep())
        {
            yield statement.row;
        }

        statement.reset();
    },

    /***************************************************************************
     *
     *
     *
     *
     **************************************************************************/
    diary_total: function(day)
    {
        var result = {};

        if (!day)
        {
            result['prot'] = 0;
            result['fat'] = 0;
            result['carb'] = 0;
            result['salt'] = 0;
            result['cals'] = 0;

            return result;
        }

        var conn = this.get_conn();
        var sql = 'SELECT total(prot*amount) AS total_prot, ' +
                'total(fat*amount) AS total_fat, total(carb*amount) AS ' +
                'total_carb, total(salt*amount) AS total_salt FROM diary ' +
                'LEFT JOIN days ON diary.day_id = days.day_id LEFT JOIN food ' +
                'ON diary.food_id = food.food_id WHERE date = :day'
        var statement = conn.createStatement(sql);
        statement.params.day = day;

        statement.executeStep();

        result['prot'] = statement.row.total_prot;
        result['fat'] = statement.row.total_fat;
        result['carb'] = statement.row.total_carb;
        result['salt'] = statement.row.total_salt;
        result['cals'] = 4.1*(statement.row.total_prot
                            + statement.row.total_carb)
                            + 9.4*statement.row.total_fat;

        statement.reset();

        return result;
    },

    /***************************************************************************
     * Has a particular food item been added to a particular day in the diary.
     * Paramaters:
     *  day_id (integer): the id of the day
     *  item_id (integer): the id of the food item
     * Return:
     *  boolean
     **************************************************************************/
    is_item_in_diary: function(day_id, item_id)
    {
        var conn = this.get_conn();
        var sql = "SELECT rowid FROM diary WHERE day_id = :day_id AND " +
                    "food_id = :item_id";
        var statement = conn.createStatement(sql);
        statement.params.day_id = day_id;
        statement.params.item_id = item_id;

        var result = statement.step();
        statement.reset();

        return result
    },

    /***************************************************************************
     * add a new item to the diary or update an existing one
     * Parameters:
     *  day_id (integer): the id of the day
     *  item_id (integer): the id of the food item
     *  amount (float): the amount
     **************************************************************************/
    new_diary_item: function(day_id, item_id, amount)
    {
        var conn = this.get_conn();
        var sql = "INSERT INTO diary (day_id, food_id, amount) " +
                    "VALUES (:day_id, :item_id, :amount)";
        var statement = conn.createStatement(sql);
        statement.params.day_id = day_id;
        statement.params.item_id = item_id;
        statement.params.amount = amount;
        statement.execute();
    },

    /***************************************************************************
     *
     *
     **************************************************************************/
    update_diary_item: function(day_id, item_id, amount)
    {
        var conn = this.get_conn();
        var sql = "UPDATE diary SET amount = :amount WHERE day_id = :day_id " +
                    "AND food_id = :item_id";
        var statement = conn.createStatement(sql);
        statement.params.day_id = day_id;
        statement.params.item_id = item_id;
        statement.params.amount = amount;
        statement.execute();
    },

    /***************************************************************************
     * does a particular day already have a record in the database
     * Parameter:
     *  day (string): the day in format 'yyyy-mm-dd'
     * Return value:
     *  the day_id if the day exists, otherwise null
     **************************************************************************/
    is_day_in_db: function(day)
    {
        var conn = this.get_conn();
        var sql = "SELECT day_id, date FROM days WHERE date = :day";
        var statement = conn.createStatement(sql);
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
    },

    /***************************************************************************
     * add a new day to the database
     * Parameters:
     *  day (string): 'yyyy-mm-dd'
     * Return value:
     *  the id of the new record
     **************************************************************************/
    new_day: function(day)
    {
        var conn = this.get_conn();
        var sql = "INSERT INTO days (date) VALUES(:date)";
        var statement = conn.createStatement(sql);
        statement.params.date = day;
        statement.execute();

        // should return the id of the new record that has been created
        // TODO: is there a built in sqlite function that will return this
        // value?
        statement = conn.createStatement('SELECT last_insert_rowid() AS rowid');
        statement.step();
        var result = statement.row.rowid;
        statement.reset();

        return result;
    },
};
