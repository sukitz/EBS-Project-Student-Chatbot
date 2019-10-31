'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const config = require('./config.json');
const firebase = require('firebase');


// create LINE SDK client
const client = new line.Client(config);

const app = express();
var date = "" ;
var time = "" ;
var dateTime = "" ;

let userId = [];
var stuId = "" ;
var stuName = "" ;
var strText = "" ; 
var strArr = "" ;

var stuStatus = "" ;  
var getUserId = [] ;   
var getStuId = "" ;
var getStuName = "" ; 
var onDatabase = false ;
var timeStart = "" ;

var numOfDate = "";
var getStartTime = "";
var getEndTime = "";
var getLateTime = "";

var firebaseConfig = {
    apiKey: "AIzaSyDfAcyKxRMKxMQ_g3Ho6Cy4r5-vVUIjLOw",
    authDomain: "checkthestudentname.firebaseapp.com",
    databaseURL: "https://checkthestudentname.firebaseio.com",
    storageBucket: "checkthestudentname.appspot.com"
  };
firebase.initializeApp(firebaseConfig);

var database = firebase.database();

var beacon_state ;

var get_beacon = database.ref('statusBeacon').on('value',function(snapshot) {
  beacon_state = snapshot.val();
  
  if (beacon_state == "poweredOn") {
  
    var getStartAndEnd = database.ref('Date').on('value',function(snapshot) {
    numOfDate = snapshot.numChildren();
    if (numOfDate !== 0 || numOfDate !== null) {
      database.ref('Date').child(numOfDate).once('value',function(snapshot) {
        getEndTime = snapshot.val().End;
        getStartTime = snapshot.val().start;
        getLateTime = snapshot.val().late;
        var one = new Date(snapshot.val().start);
        var two = new Date(snapshot.val().End);
        console.log("Class start at " + getStartTime + " to " + getEndTime);
    
        });
        }
      });
  } else console.log("poweredOff");
});




app.post('/webhook', line.middleware(config), (req, res) => {
    if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  Promise.all(req.body.events.map(event => {
    userId = event.source.userId;
    console.log('event', event);
    if (event.replyToken === '00000000000000000000000000000000' ||
      event.replyToken === 'ffffffffffffffffffffffffffffffff') {
      return;
    }
    return handleEvent(event);
  }))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});



const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  if (beacon_state == "poweredOn") {
    strText = String(texts);
    if (strText == 'ลงทะเบียนเรียบร้อยแล้ว') {
      return client.replyMessage(token,texts.map((text) =>
        ({ 'type':'text', 'text':'เดี๋ยวจะส่งข้อมูลการใช้ beacon ให้นะ'})));
    } else if (strText == 'แก้ไขข้อมูลเรียบร้อยแล้ว') {
        return client.replyMessage(token,texts.map((text) =>
          ({ 'type':'text', 'text':'ระบบทำการแก้ไขข้อมูลให้แล้ว'})));
        } else {
        return client.replyMessage(token,texts.map((text) =>
        ({ 'type':'text', 'text':'ข้อมูลไม่ถูกต้อง'})));
          }
  }else {
      console.log("cannot registed");
      return client.replyMessage(token,texts.map((text) => 
        ({ 'type':'text', 'text':'ยังไม่เปิดระบบ'}))); 
  }
}
  

// callback function to handle a single event
function handleEvent(event) {
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          return handleText(message, event.replyToken);
        case 'image':
          return handleImage(message, event.replyToken);
        case 'video':
          return handleVideo(message, event.replyToken);
        case 'audio':
          return handleAudio(message, event.replyToken);
        case 'location':
          return handleLocation(message, event.replyToken);
        case 'sticker':
          return handleSticker(message, event.replyToken);
        default:
          throw new Error(`Unknown message: ${JSON.stringify(message)}`);
      }

    case 'join':
      //return replyText(event.replyToken, `Joined ${event.source.type}`);
      console.log("join");

    case 'leave':
      return console.log(`Left: ${JSON.stringify(event)}`);

    case 'postback':
      let data = event.postback.data;
      return replyText(event.replyToken, `Got postback: ${data}`);

    case 'beacon':
      if(event.beacon.type == "enter") {
        if (beacon_state == "poweredOn") {
          console.log("power on");
          writeArriveStuData();
        } else if (beacon_state == "poweredOff") {
          console.log("power off");
          }
      
      } else if (event.beacon.type == "leave") {
          if (beacon_state == "poweredOn") {
            writeLeaveStuData();
          }
      }
    default:
      //throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  
  }
}

function handleText(message, replyToken) {
  return replyText(replyToken, message.text);
}

function handleImage(message, replyToken) {
  return replyText(replyToken, 'Got Image');
}

function handleVideo(message, replyToken) {
  return replyText(replyToken, 'Got Video');
}

function handleAudio(message, replyToken) {
  return replyText(replyToken, 'Got Audio');
}

function handleLocation(message, replyToken) {
  return replyText(replyToken, 'Got Location');
}

function handleSticker(message, replyToken) {
  return replyText(replyToken, 'Got Sticker');
}

const port = config.port;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});


function getDateTime(dateTime) {
  var today = new Date();
  date = today.getFullYear()+'-'+("0"+(today.getMonth()+1)).slice(-2)+'-'+("0"+(today.getDate())).slice(-2);
  time = ("0"+(today.getHours())).slice(-2) + ":" + ("0"+(today.getMinutes())).slice(-2);
  dateTime = date + " " + time;
  return dateTime;
}


//~ function getStuData () {
  //~ database.ref('userId').child(userId).once('value').then(function(snapshot) {   
    //~ var alreadyInDb = snapshot.exists();            //check for userId is registed
    //~ if (alreadyInDb) {                              //if already registed then get name id and write data
      //~ getStuName = snapshot.val().StudentName;
      //~ getStuId = snapshot.val().StudentId;
      //~ stuName = getStuName;
      //~ stuId = getStuId;
      //~ writeArriveStuData();
    //~ } else console.log("Don't have data");
  //~ });
//~ }

//~ //write data to firebase when register 
//~ function writeRegisData(userId , stuName, stuId) {
  //~ firebase.database().ref('userId/' + userId).set({
    //~ "StudentName" : stuName,
    //~ "StudentId" : stuId
    //~ });writeArriveStuData();                         //call write arrive student data because 
//~ }                                                   // when first registed student data doesn't appear 
                                                    //~ // on database that store check the student arrive 

function writeArriveStuData() {
  
  var arriveTime = new Date(getDateTime());
  var startTime = new Date(getStartTime);
  var late = getLateTime;
  console.log("late is : " + late)
  console.log("start at : " + startTime);
  console.log("arrive time is : "+ (arriveTime-startTime)/60/1000);
  
  if ((arriveTime-startTime)/60/1000 > late) {
    // arrive and late
      database.ref('Check').child(userId).child(date).child('checkName').once('value', function(snapshot) {
          stuStatus = snapshot.val(); 
          if (stuStatus == "0") {
            firebase.database().ref('Check').child(userId).child(date).update({
              "checkName" : "2"});
            } else if (stuStatus == "1") {
                firebase.database().ref('Check').child(userId).child(date).update({
                "checkName" : "1"});
              } else if (stuStatus == "3") {
                firebase.database().ref('Check').child(userId).child(date).update({
                "checkName" : "1"});
              } else if (stuStatus == "4") {
                firebase.database().ref('Check').child(userId).child(date).update({
                "checkName" : "2"});
              }
        });
    console.log("You are late motherfucker");
  } else {
    //arrive and TUN 
      database.ref('Check').child(userId).child(date).child('checkName').once('value', function(snapshot) {
          stuStatus = snapshot.val(); 
          if (stuStatus == "0") {
            firebase.database().ref('Check').child(userId).child(date).update({
              "checkName" : "1"});
            }
        });
    }
    
}



function writeLeaveStuData() {
  
  database.ref('Check').child(userId).child(date).child('checkName').once('value', function(snapshot) {
      stuStatus = snapshot.val(); 
      if (stuStatus == "1") {
        database.ref('Check').child(userId).child(date).update({
          "checkName" : "3"
          });
      } else if (stuStatus == "2") {
          database.ref('Check').child(userId).child(date).update({
            "checkName" : "4"
            });
      }
  });    
} 
