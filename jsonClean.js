var fs = require('fs');
// var parse = require('csv-parse');
const writeJsonFile = require('write-json-file');
var loader = require('csv-load-sync');
var Promise = require('bluebird')

var Bottleneck = require("bottleneck");
Bottleneck.prototype.Promise = Promise;

var limiter = new Bottleneck(0, 1000);

var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyDpQD_Z2xomoGD7KZ-yUDF_H64lgd6Hwho',
    Promise: Promise
});

var parse = require('csv-parse/lib/sync');

var content = fs.readFileSync('/Users/dennch3/Documents/Personal/aameetings.csv');
var records = parse(content, {delimiter: ','});
// records=records.shift(); //remove header
//console.log(records);

records=records.slice(1,5);

var csvData=[];
records.forEach(function(csvrow,index){
        // console.log(csvrow);

        var rowJson = {
            code:csvrow[0],
            day:csvrow[1],
            town:csvrow[2]+',MA',
            name:csvrow[3],
            address:csvrow[4],
            time:csvrow[5],
            handicap:csvrow[6],
            position:''
        }

        csvData.push(rowJson);

})

function getGeoCode(csvData,index,startTime){
    var address=csvData[index].address+','+csvData[index].town;
    return googleMapsClient.geocode({address: address}).asPromise()
        .then((response) => {
        console.log(index,Date.now() - startTime)

    if (response.json.results.length==0){
            console.log(address);
    }
    else{
        csvData[index].position=response.json.results[0].geometry.location;
    }
})
}

var all=[];
var startTime = Date.now();
csvData.forEach(function(csvrow,index){

    all.push(
        limiter.schedule(getGeoCode,csvData,index,startTime)
    )
})

var results = Promise.all(all);

results
    .then((resArray) => {
    //console.log(csvData);
    writeJsonFile('/Users/dennch3/temp/meetingsMap/meetings_clean.json', csvData);
})
.catch((err) => {
    console.log(err);
})


// var csvData=[];
// var content = fs.createReadStream('/Users/dennch3/Documents/Personal/aameetings.csv')
//     .pipe(parse({delimiter: ','}))
//
// // var content = loader('/Users/dennch3/Documents/Personal/aameetings.csv')
// // console.log(content);
//
//     .on('data', function(csvrow) {
//         console.log(csvrow);
//         //do something with csvrow
//
//         var rowJson = {
//             code:csvrow[0],
//             day:csvrow[1],
//             town:csvrow[2],
//             name:csvrow[3],
//             address:csvrow[4],
//             time:csvrow[5],
//             handicap:csvrow[6],
//         }
//
//         parse.pause();
//
//         // Geocode an address.
//         googleMapsClient.geocode({
//             address: '1600 Amphitheatre Parkway, Mountain View, CA'
//         }, function(err, response) {
//             if (!err) {
//                 console.log(response.json.results);
//
//                 csvData.push(rowJson);
//
//                 parse.resume();
//
//             }
//         });
//
//     })
//     .on('end',function() {
//         //do something wiht csvData
//         //console.log(csvData);
//         csvData=csvData.slice(1);
//         writeJsonFile('/Users/dennch3/devtest/deployment/meetings_clean.json', csvData);
//
//
//     });