#!/usr/bin/env node
const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;

var args = require("minimist")(process.argv.slice(2));

function displayHelpText() {
    console.log('blog-updater usage:');
    console.log('   ./blog-updater.js -t [title] -s [tags] -f [filename] -d [publishDate (YYYY-MM-DD)]');
    console.log('Notes:');
    console.log('   If the -d flag (publishDate) is left off, then it will default to the current date.');
    console.log('   If the post title contains spaces, quotes are required.');
    console.log('   Multiple tags provided via the -s option are required to be seperated by a space.');
    console.log('Examples:');
    console.log('   ./blog-updater.js -t "New Post" -s "js programming" -f postname.md');
    console.log('   ./blog-updater.js -t "New Post" -s "python" -f postname2.md -d 2020-11-19');
}

function createUrlTitle(title) {
    return title.toLowerCase().replace(' ', '-');
}

function createTagArray(tagsString) {
    return tagsString.split(' ');
}

function getPublishDate() {
    let date;

    if (!args.d) {
        date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; // 1 added to month as JS months are 0 indexed
    } else {
        date = new Date(args.d);
        // getUTCx functions are used as date is already supplied in EST and does not need to be implicitly offset again by date methods
        return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`; // 1 added to month as JS months are 0 indexed
    }    
}

function addPostToDb(data) {
    // MongoDB setup
    const url = 'mongodb://localhost:27017';
    const dbName = "web";
    const client = new MongoClient(url, { useUnifiedTopology: true });

    client.connect(function(err) {
        assert.equal(null, err);

        const db = client.db(dbName);
        const col = db.collection('posts');

        col.countDocuments({title: data.title}, function(err, result) {
            if (result) {
                console.log("A post with that title already exists");
            } else {
                col.insertOne(data, function(err, res) {
                    if (err) throw err;
                    console.log("Post added sucessfully");
                });
            }

            client.close();
        });
    });
}

function main() {
    let queryParams = {
        title: args.t,
        tags: createTagArray(args.s),
        postFileName: args.f,
        publishDate: getPublishDate(),
        urlTitle: createUrlTitle(args.t)
    }

    addPostToDb(queryParams);
}

if (process.argv.length <= 2) {
    displayHelpText();
} else {
    main();
}