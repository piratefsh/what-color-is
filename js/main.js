"use strict"

google.load('search', '1');

var imageSearch, searchTerm;

var searchTermField = document.getElementById('search-term');
var btnExecuteSearch = document.getElementById('btn-search');
var resultsContainer = document.getElementById('search-results');
var resultsCount = document.getElementById('result-count');
var colorContainer = document.getElementById('color-container');
var colorCodeRGB = document.getElementById('color-code-rgb');
var colorCodeHex = document.getElementById('color-code-hex');
var colorResults = document.getElementById('color-results');

var pageCounter = 0;
var isSameTerm = false;
var maxPages = 8;
var timesSet = 0; //number of times average color set/image processed

var UPLOAD_SERVER_URL = 'http://127.0.0.1:5000/upload/url';
var REQ_FINISHED = 4;
var MAX_IMAGES = 64;

var totalAverageColor = {
    r: 0,
    g: 0,
    b: 0,
    count: 0
}

btnExecuteSearch.onclick = function(e){
    e.preventDefault();

    // don't do anything on empty field
    if(!searchTermField.value || searchTermField.value.length < 1){
        return; 
    }

    // disable button
    btnExecuteSearch.disabled = true;
    btnExecuteSearch.innerHTML = '<i class="glyphicon glyphicon-repeat glyphicon-spin"></i>';
    
    // start search
    search();
}

function toHex(c){
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
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
        timesSet = 0;
        google.search.Search.getBranding('google-branding');
        imageSearch.execute(searchTerm);
        totalAverageColor = {r: 0, g: 0, b: 0, count: 0}
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
        ic.className    += 'search-img-container ';
        img.className   += 'search-img ';
        img.className   += md5(r.tbUrl);
        img.style.backgroundImage =  'url('+ r.tbUrl + ')';
        
        ic.appendChild(img);
        console.log(img)
        resultsContainer.appendChild(ic);

        // get info about image color
        inspectImg(r.tbUrl);
    }
    
    // if has more pages, continue search
    if(pageCounter < maxPages-1){
        search();
    }
}

function inspectImg(url){

    // post image url to server
    var req = new XMLHttpRequest();

    // get image on CORS-friendly server
    req.onreadystatechange = function(){
        if(req.readyState == REQ_FINISHED && req.responseText){
            var response = JSON.parse(req.responseText);
            var img = new Image();

            // load image and get its info
            img.onload = getImageInfo;
            img.crossOrigin = 'Anonymous';
            img.src = response.new_url;
        }
    }

    var params = 'url=' + url
    req.open('POST', UPLOAD_SERVER_URL);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(params);

}

//get image color functions
function getImageInfo(){
    var img = this;

    //create shadow canvas
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    var imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;

    // get color palette with pixel-color-cruncher
    var pixelCruncher = new Worker('js/vendor/pixel-cruncher.js');
    pixelCruncher.addEventListener('message', function(e){
        var colors = e.data;

        // display palette
    });

    pixelCruncher.postMessage({pixels: imageData, num_colors: 4});

}



// hide results
colorResults.style.opacity = 0;
google.setOnLoadCallback(onSearchAPILoad);