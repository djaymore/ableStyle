var vpTree = require('vptree');
var leven = require('../functions/levenshtein');
var Picture = require('../models/pictureModel');

var dataManager = function(postedPicture){

    var vpTreeData = "";
    var postedPicture;

    var setPostedPicture = function(postedPicture){
        this.postedPicture = postedPicture;
    };

    var saveData = function(hash, callback){
        var returnValues = new Array();
        var picture = new Picture();
        picture.Uri = this.postedPicture.Uri;
        picture.Hash = hash;
        picture.UserName = this.postedPicture.UserName;

        //Find the hash in the vpTree and close matches
        var maximumDistance = 0;
        var matches = this.getMatches(hash, maximumDistance);

        //Nothing was found
        if(matches.length == 0){
            picture.save(function(err){
                if(!err){
                    //reload the tree.  There is no method to just insert a record *yet
                    this.loadAllPictures();
                }
            });
            returnValues.push(picture);
            callback(returnValues);
        }else{

            //If an exact match is not in the db then add it 
            var index = matches.indexOf(hash);
            if(index == -1){
                returnValues.push(picture);
                picture.save(function(err){
                    if(!err)
                        this.loadAllPictures();
                });
            }

            Picture.find({
                'Hash': { $in: matches }
            }, function(err, docs){
                 for(var i = 0; i < docs.length; ++i){
                    returnValues.push(docs[i]);
                 }
                 callback(returnValues);
            });
        }
    };

    var loadAllPictures = function(callback){
        Picture.find(function(err, picture){
            if(err)
               console.log('error getting pictures');
            else{
                var hasharray = new Array();
                for(var i = 0; i < picture.length; i++){
                    hasharray.push(picture[i].Hash);
                }
                //Looks like we have to re-create the tree each time a new picture is
                //added.  There is no insert method.
                vptreehash = vpTree.build(hasharray, leven.getEditDistance, 0);
                vpTreeData = vptreehash;
                
                //Convert json picture data into array of pictures
                console.log(picture);
            }
        });
    };

    var getMatches = function(hash, maximumDistance){
        //The two signifies the number of closest elements.  5 is the distance/tolerance
        var searchResult = vptreehash.search(hash, 2, 5);
        var result = new Array();

        
        for(var i = 0; i < searchResult.length; ++i){
            if(searchResult[i].d <= maximumDistance){
                result.push(vptreehash.S[searchResult[i].i]);
            }
        }
        
        return result;
    };

    return {
        setPostedPicture: setPostedPicture,
        saveData: saveData,
        loadAllPictures: loadAllPictures,
        getMatches: getMatches
    };
}();

module.exports = dataManager;

