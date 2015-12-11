$(document).ready(function() {
    /*
     * declare map as a global variable
     */
    var map;
    var markers = [];
    var mapMarkers = [];
    var categories = [];
    /*
     * use google maps api built-in mechanism to attach dom events
     */
    var googleSheetCode = '1xMUWnW9eJ0EqMqv9kfubbmpDfE4iJl_FSk7XZbCNwJY';
    var url = 'https://spreadsheets.google.com/feeds/cells/' + googleSheetCode + '/od6/public/values?alt=json-in-script&callback=?';
    var userLat;
    var userLong;
    var map;

    var infoWindow = new google.maps.InfoWindow();

    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    function createMarker(options, html) {
        var marker = new google.maps.Marker(options);
        if (html) {
            google.maps.event.addListener(marker, "click", function() {
                infoWindow.setContent(html);
                infoWindow.open(options.map, this);
            });
        }
        return marker;
    }

    function getMarkers(data) {
        console.log("place markers on map", data);
        /// loop through var markers for list from Google Sheets
        for (i = 0; i < data.length; i++) {
            var popInfo = data[i];
            var myMarker = createMarker({
                position: new google.maps.LatLng(data[i].lat, data[i].long),
                map: map,
                icon: "http://dev.alphanerdsmedia.com/PWA/images/marker-sm.png"
            }, "<h1>" + popInfo.title + "</h1><date>" + popInfo.date + " - </date><category>" + popInfo.category + "</category><p class='desc'>" + popInfo.description + "</p><div class='youtube'>"+popInfo.youtube_embed+"<div>");
            mapMarkers.push(myMarker);
            console.log("Marker created", [mapMarkers[i]]);
        }
    }

    function createMap() {
        map = new google.maps.Map(document.getElementById("map_div"), {
            center: new google.maps.LatLng(userLat, userLong),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        var marker0 = createMarker({
            position: new google.maps.LatLng(userLat, userLong),
            map: map,
            icon: "http://dev.alphanerdsmedia.com/PWA/images/you-marker.png"
        }, "<h1>You are here</h1>");

        getMarkers(markers);
    }

    /// store log data in array
    function savemarkers(json) {
        console.log(json);
        // $(".console").text = "Loading...";
        /// parse the list data and create array of markers and properties
        for (var i = 0; i < json.feed.entry.length; i++) {
            var entry = json.feed.entry[i];
            if (entry.gs$cell.col == '1' && entry.gs$cell.row != '1') {
                var temp = {};
                for (j = 0; j < json.feed.gs$colCount.$t; j++) {
                    var count = i + j;
                    var myCell = json.feed.entry[count].gs$cell;
                    temp[json.feed.entry[myCell.col - 1].gs$cell.$t] = myCell.$t;
                }
                markers.push(temp);
                console.log(markers);
            }
        }
        //// get category names from google sheet
        var dupes = {};
        $.each(markers, function(i, el) {
            if (!dupes[el.category]) {
                dupes[el.category] = true;
                categories.push(el.category);
            }
        });
        console.log(categories);
        updateSelectBox(categories);
        createMap();
    }

    function init() {
        /// get user location first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                userLat = position.coords.latitude;
                userLong = position.coords.longitude;
                console.log("User located at", [userLat, userLong]);
                //// get Google Sheets Data with callback
                $.getJSON(url, savemarkers);
            });
        } else {
            $(".console").text = "Geolocation is not supported by this browser. Default location loaded.";
            userLat = 46;
            userLong = -65;
            $.getJSON(url, savemarkers);
        }
    }

    function updateSelectBox(categories) {
        var $el = $(".cat_options");
        $el.empty(); // remove old options
        $el.append($("<option></option>").attr("value", "PWA Project Plotter").text("Select category..."));
        $el.append($("<option></option>").attr("value", "All").text("All"));
        $(".console .title").text("PWA Project Plotter");
        $.each(categories, function(value, key) {
            $el.append($("<option></option>")
                .attr("value", key).text(key));
        });
        // $(".cat_options").
    }

    $(".cat_options").change(function() {
        var str = "";
        var myDate = "";
        $(".cat_options option:selected").each(function() {
            str = $(this).val();
        });
        if (str == "All") {
            $(".console .title").text("PWA Project Plotter");
            getMarkers(markers);
        } else {
            $(".console .title").text(str);

            var result = markers.filter(function(obj) {
                return obj.category == str /* &&obj.date == myDate */;
            });
            console.log("Filtered: ", result);

            clearMarkers();
            console.log([markers], [result])
            getMarkers(result);
        }


    }).change();

    // Sets the map on all markers in the array.
    function setMapOnAll(map) {
        for (var i = 0; i < mapMarkers.length; i++) {
            mapMarkers[i].setMap(map);
        }
        mapMarkers = [];
    }

    // Removes the markers from the map, but keeps them in the array.
    function clearMarkers() {
        setMapOnAll(null);
    }


    //// getUserGeoCoordinates
    init();
});
