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
    img.crossOrigin = '';
}

function getImageInfo(){
    var img = this;

    //create shadow canvas
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    var averageColor = getAverageColor(context, canvas.width, canvas.height);
    console.log(averageColor);
}

function getAverageColor(context, w, h){
    //get pixel data 
    var pixelData = context.getImageData(0, 0, w, h);

    // counter
    var rgb = {
        r: 0,
        g: 0,
        b: 0
    }

    for(var i = 0; i < pixelData.length; i+=4){
        rgb.r += pixelData[i+0];
        rgb.g += pixelData[i+1];
        rgb.b += pixelData[i+2];
    }

    var numPixels = pixelData.length/4;
    rgb.r = Math.floor(rgb.r / numPixels);
    rgb.g = Math.floor(rgb.g / numPixels);
    rgb.b = Math.floor(rgb.b / numPixels);

    return rgb;
}

google.setOnLoadCallback(onSearchAPILoad);