google.load('search', '1');

var imageSearch, searchTerm;

var searchTermField = document.getElementById('search-term');
var btnExecuteSearch = document.getElementById('btn-search');
var resultsContainer = document.getElementById('search-results');
var resultsCount = document.getElementById('result-count');

var pageCounter = 0;
var isSameTerm = false;
var maxPages = 8;

btnExecuteSearch.onclick = function(e){
    e.preventDefault();
    //disable until search finished
    btnExecuteSearch.disabled = true;
    search();
}

function search(){
    isSameTerm = searchTermField.value == searchTerm;

    if(imageSearch.cursor && isSameTerm){
        if(pageCounter >= imageSearch.cursor.pages.length){
            alert('hit google image search max');
        }
        else{
            pageCounter++;
            imageSearch.gotoPage(pageCounter);
        }
    }
    else{
        isSameTerm = false;

        // new search term, reset pages
        searchTerm = searchTermField.value;
        pageCounter = 0;
        google.search.Search.getBranding('google-branding');
        imageSearch.execute(searchTerm);
    }

    return false;
}

function onSearchAPILoad(){
    // create image search
    imageSearch = new google.search.ImageSearch();
    imageSearch.setSearchCompleteCallback(this, onSearchComplete, null);
    imageSearch.setResultSetSize(8);
    btnExecuteSearch.disabled = false;

    // trigger first click
    btnExecuteSearch.click();
}

function onSearchComplete(){
    // empty results
    if(!isSameTerm){
        resultsContainer.innerHTML = "";
    }

    var results = imageSearch.results;

    for(var i = 0; i < results.length; i++){
        var r = results[i];

        // create image objects and put them in divs
        var ic = document.createElement('div');
        var img = document.createElement('div');
        ic.className += 'search-img-container';
        img.className += 'search-img';
        img.style.backgroundImage =  'url('+ r.tbUrl + ')';
        
        ic.appendChild(img);
        resultsContainer.appendChild(ic);

        // get info about image color
        inspectImg(r.tbUrl);
    }
    
    // if has more pages, continue search
    if(pageCounter < maxPages-1){
        search();
    }
    else{
        btnExecuteSearch.disabled = false;
    }
}

function inspectImg(url){
    var img = new Image();
    img.src = url;
    img.onload = getImageInfo;
}

function getImageInfo(){

}

google.setOnLoadCallback(onSearchAPILoad);