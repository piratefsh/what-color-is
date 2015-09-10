google.load('search', '1');


var imageSearch, searchTerm;

var searchTermField = document.getElementById('search-term');
var btnExecuteSearch = document.getElementById('btn-search');
searchTermField.onclick = function(e){
    imageSearch.execute(searchTerm);

       
}

function onSearchAPILoad(){
    // create image search
    imageSearch = new google.search.ImageSearch();
    imageSearch.setSearchCompleteCallback(this, onSearchComplete, null);
    btnExecuteSearch.disabled = false;
}

function onSearchComplete(){
    var results = imageSearch.results;
    if(results){
        console.log(results);
    }
}