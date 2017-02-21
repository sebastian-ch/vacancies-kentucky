//map options
var options = {
    zoomSnap: .1,
    zoomControl: false
}

//initialize map
var map = L.map('map', options);


//vacant housing units
var attributeValue = "VACANT",
    //total housing units
    normValue = "TOTAL";


//loads json, THEN calls function with 'data' being the json
$.getJSON("ky_counties_housing.json", function (data) {
    //styles the data initially
    var dataLayer = L.geoJson(data, {
        style: function (feature) {
            return {
                color: '#dddddd',
                weight: 1,
                fillOpacity: 1,
                fillColor: '#1f78b4'
            };
        }
    }).addTo(map);
    //calls drawMap function here so we 
    //get access to dataLayer
    drawMap(dataLayer);
});


function drawMap(dataLayer) {

    //gets breaks for choropleth
    var breaks = getClassBreaks(dataLayer);

    dataLayer.eachLayer(function (layer) {

        //so I don't have to type it out each time
        var props = layer.feature.properties;
        //normalized vacany per total housing units
        var normalized = (Number(props[attributeValue]) / Number(props[normValue]));

        //tooltip content
        var content = "<b>" + props.NAME + " County</b><br>" + attributeValue + ": " +
            (normalized * 100).toFixed(2) + "%";

        //set style of each county by vacancy
        //then bind tooltip to each layer
        layer.setStyle({
            fillColor: getColor(normalized, breaks)
        }).bindTooltip(content);
    });

    map.fitBounds(dataLayer.getBounds());
    //add the legend here so we can access breaks
    drawLegend(breaks);
}

//creates class breaks using Simple Statistics
function getClassBreaks(dataLayer) {

    //empty array to push values into
    var values = [];

    dataLayer.eachLayer(function (layer) {

        //normalize value
        var value = Number(layer.feature.properties[attributeValue]) / Number(layer.feature.properties[normValue]);
        //add it to the array
        values.push(value);
    });

    //create 5 breaks (deteremine 5 clusters)
    var clusters = ss.ckmeans(values, 5);

    // create an array of the lowest value and highest
    //value within each cluster
    var breaks = clusters.map(function (cluster) {
        return [cluster[0], cluster.pop()];
    });

    return breaks;
}

//returns the color of the county based on the vacancy value
function getColor(d, breaks) {

    if (d <= breaks[0][1]) {
        return '#fee5d9';
    } else if (d <= breaks[1][1]) {
        return '#fcae91';
    } else if (d <= breaks[2][1]) {
        return '#fb6a4a';
    } else if (d <= breaks[3][1]) {
        return '#de2d26'
    } else if (d <= breaks[4][1]) {
        return '#a50f15'
    }
}

//creates the legend
function drawLegend(breaks) {

    //positions the legend in the top left
    var legend = L.control({
        position: 'topleft'
    });

    //on adding the legend, do this:
    legend.onAdd = function () {
        //creates the div for the legend
        var div = L.DomUtil.create('div', 'legend');

        //adds first line of legend
        div.innerHTML = "<h3>" + attributeValue + " per " + normValue + "</h3>";

        //loop through the breaks, and add the colored square
        //plus the value ranges
        for (var i = 0; i < breaks.length; i++) {

            var color = getColor(breaks[i][0], breaks);

            div.innerHTML +=
                '<span style="background:' + color + '"></span> ' +
                '<label>' + (breaks[i][0] * 100).toFixed(2).toLocaleString() + '%' + ' &mdash; ' +
                (breaks[i][1] * 100).toFixed(2).toLocaleString() + '%' + '</label>';
        }

        return div;
    };

    //add the legend to the map after the data's been added 
    //to it
    legend.addTo(map);

}