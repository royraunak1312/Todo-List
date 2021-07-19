

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Raunak:Test123@cluster0.bo23y.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema({
  name : String
});

const listSchema = new mongoose.Schema({
  name : String,
  items : [itemsSchema]
});

const Item = new mongoose.model("Item", itemsSchema);

const List = new mongoose.model("List", listSchema);

const item1 = new Item({
  name : "Welcome to your todo-List!"
});
const item2 = new Item({
  name : "Hit the + button to add a new item."
});
const item3 = new Item({
  name : "<-- Hit this to delete an item. "
});

const defaultItems = [item1 ,item2, item3];





app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (err){
      console.log(err);
    } else {
      if (foundItems.length === 0){
        Item.insertMany(defaultItems, function(err){
          if (err){
            console.log(err);
          } else {
            console.log("Successfully saved default items to database!");
          }
        });
        res.redirect("/");
      } else {
        const day = date.getDate();
        res.render("list", {listTitle: day, newListItems: foundItems});
      }
    }
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name : customListName}, function(err, results){
    if (!err){
      if (!results){
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
      } else {
        res.render("list", {listTitle: results.name, newListItems: results.items});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({name : itemName});

  const day = date.getDate();

  if (listName === day){
    item.save();
    res.redirect("/");
  } else {
      List.findOne({name : listName}, function(err, foundList){
      if (!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
      }
    });
  }


});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  const day = date.getDate();
  if (listName === day ){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Successfully deleted checked item!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/"+listName);
      }
    });
  }


});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
