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
var allPaletteContainer = document.getElementById('all-palette-container');

var pageCounter = 0;
var isSameTerm = false;
var maxPages = 8;
var timesSet = 0; //number of times average color set/image processed

var UPLOAD_SERVER_URL = 'http://45.55.61.164:5000/upload/url';
var REQ_FINISHED = 4;
var MAX_IMAGES = 64;
var IMG_CLASS_PREFIX = 'i'; // because classnames cannot start with number
var PALETTE_NUM_COLORS = 4;
var ALL_PALETTE_NUM_COLORS = 4;
var totalAverageColor = {
    r: 0,
    g: 0,
    b: 0,
    count: 0
}

var allPaletteColors = document.createElement('canvas');
allPaletteColors.width = MAX_IMAGES;
allPaletteColors.height = PALETTE_NUM_COLORS;
var apcCount = 0;//current row being drawn
var apcContext = allPaletteColors.getContext('2d');

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

function rgbToHex(rgb){
    return '#' + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
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
        ic.className    += IMG_CLASS_PREFIX + md5(r.tbUrl);
        img.className   += 'search-img ';
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
            img.onload = function(e){
                var hashedUrl = md5(url);
                getImageInfo.bind(this)(IMG_CLASS_PREFIX + hashedUrl)
            };
            img.crossOrigin = 'Anonymous';
            img.src = response.new_url;
        }
    }

    var params = 'url=' + url
    req.open('POST', UPLOAD_SERVER_URL);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(params);

}

//get image color functions given hashed original image url
function getImageInfo(hashedUrl){
    var img = this;

    //create shadow canvas
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);

    var imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;

    // get color palette for an image with pixel-color-cruncher
    var pixelCruncher = new Worker('js/vendor/pixel-cruncher.js');

    pixelCruncher.addEventListener('message', function(e){
        var colors = e.data;

        // display palette for each image

        // get container. depending on whether this is fo the all colors, or individual image
        // not very organized, but ok for now.
        var container, containerWidth, colorHeight, colorWidth;

        var isAllColors = (apcCount == MAX_IMAGES);

        if(isAllColors){
            container = allPaletteContainer;
            container.innerHTML = "";
            var dimensions = container.getBoundingClientRect();
            containerWidth = dimensions.width-2;
            colorWidth = 100/ALL_PALETTE_NUM_COLORS + '%';//Math.floor(containerWidth/ALL_PALETTE_NUM_COLORS) + 'px';
            colorHeight = '100%';

            // done pixel crunching for all, so can reenable button
            enableButton();

            //reset
            apcCount = 0;
            colorCodeRGB.value = colorCodeHex.value = "";
            colorResults.style.opacity = 1;

        }
        else{
            container = document.querySelector('.' + hashedUrl);
            containerWidth = container.getBoundingClientRect().width-2;
            colorHeight = colorWidth = Math.floor(containerWidth/PALETTE_NUM_COLORS) + 'px';
        }

        // add  palette
        if(container != null){
            for(var i = 0; i < colors.length; i++){
                var rgb = colors[i];

                // create color rectangle and add to container
                var rgbStr = rgbToString(rgb); 
                var hexStr = rgbToHex(rgb); 
                
                // if this is for the main palette
                if(isAllColors){
                    colorCodeRGB.value += i == 0 ? rgbStr : ", " + rgbStr
                    colorCodeHex.value += i == 0 ? hexStr : ", " + hexStr
                    addColorToPalette(container, rgbStr, colorWidth, colorHeight, i);
                }

                // if still adding colors from each image
                else{
                    //save each color on all palette colors for crunching later
                    apcContext.fillStyle = rgbStr;
                    apcContext.fillRect(apcCount, i, 1, 1);
                }

            }

            apcCount++;

            //if got palette for all images, get palette of collective pallete so far
            if(apcCount == MAX_IMAGES){
                var apcImageData = apcContext.getImageData(0, 0, allPaletteColors.width, allPaletteColors.height).data;
                pixelCruncher.postMessage({pixels: apcImageData, num_colors: ALL_PALETTE_NUM_COLORS});
            }
        }
    });

    pixelCruncher.postMessage({pixels: imageData, num_colors: PALETTE_NUM_COLORS});

}

function addColorToPalette(container, rgbStr, w, h, i){
    var c = document.createElement('div');
    c.className += 'palette-color'
    c.style.width = w; 
    c.style.height = h;
    container.appendChild(c);
    setTimeoutForColor(c, rgbStr, i);
}

function setTimeoutForColor(elem, color, i){
    setTimeout(function(){
        elem.style.backgroundColor = color;
    }, 100*i);
}

function enableButton(){
    btnExecuteSearch.disabled = false;
    btnExecuteSearch.innerHTML = '?';
    colorContainer.style.color = 'white';
    searchTermField.style.borderColor = 'white';
}   

function rgbToString(rgb){
    return 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';
}


// hide results
colorResults.style.opacity = 0;
google.setOnLoadCallback(onSearchAPILoad);