google.load('search', '1');

var imageSearch, searchTerm;

var searchTermField = document.getElementById('search-term');
var btnExecuteSearch = document.getElementById('btn-search');
var resultsContainer = document.getElementById('search-results');
var resultsCount = document.getElementById('result-count');
var colorContainer = document.getElementById('color-container');
var colorCodeRGB = document.getElementById('color-code-rgb');
var colorCodeHex = document.getElementById('color-code-hex');

var pageCounter = 0;
var isSameTerm = false;
var maxPages = 8;

var UPLOAD_SERVER_URL = 'http://127.0.0.1:5000/upload/url';
var REQ_FINISHED = 4;

var totalAverageColor = {
    r: 0,
    g: 0,
    b: 0,
    count: 0
}

btnExecuteSearch.onclick = function(e){
    e.preventDefault();
    //disable until search finished
    btnExecuteSearch.disabled = true;
    search();
}

function toHex(c){
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}


function setAverageColor(){
    var R, G, B;
    var count = totalAverageColor.count;
    R = Math.floor(totalAverageColor.r/count);
    G = Math.floor(totalAverageColor.g/count);
    B = Math.floor(totalAverageColor.b/count);
    var rgbColor = 'rgb(' + R + "," + G + "," + B + ")";
    colorCodeRGB.value = rgbColor;
    colorCodeHex.value = '#' + toHex(R) + toHex(G) +  toHex(B);
    
    if((R+G+B)/3 < 160){
        colorContainer.style.color = 'white';
        searchTermField.style.borderColor = 'white';
    }
    colorContainer.style.backgroundColor = rgbColor
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

function getImageInfo(){
    var img = this;

    //create shadow canvas
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    var averageColor = getAverageColor(context, canvas.width, canvas.height);
    
    totalAverageColor.r += averageColor.r
    totalAverageColor.g += averageColor.g
    totalAverageColor.b += averageColor.b
    totalAverageColor.count++;

    setAverageColor()
}

function getAverageColor(context, w, h){
    //get pixel data 
    var pixelData = context.getImageData(0, 0, w, h).data;

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