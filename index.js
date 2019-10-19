'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const config = require('./config.json');
const firebase = require('firebase');


// create LINE SDK client
const client = new line.Client(config);

const app = express();
let userId = [];
var stuId = "" ;
var stuName = "" ;
var strText = "" ; 
var strArr = "" ;

var teacherArrive = false ;
var stuStatus = "" ;     //arrive, late
var getTeacherId = ""; 
var getUserId = [] ;   
var getStuId = "" ;
var getStuName = "" ; 
var onDatabase = false ;
var timeStart = "" ;

function getDateTime(dateTime) {
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes();
  var dateTime = date + " " + time;
  return dateTime;
}

var firebaseConfig = {
    apiKey: "AIzaSyDfAcyKxRMKxMQ_g3Ho6Cy4r5-vVUIjLOw",
    authDomain: "checkthestudentname.firebaseapp.com",
    databaseURL: "https://checkthestudentname.firebaseio.com",
    storageBucket: "checkthestudentname.appspot.com"
  };
firebase.initializeApp(firebaseConfig);

var database = firebase.database();


console.log("Getting teacher id from firebase");
console.log(".");
console.log(".");
console.log(".");
getTeacherIdFirebase();

// webhook callback
app.post('/webhook', line.middleware(config), (req, res) => {
  // req.body.events should be an array of events
    if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  // handle events separately
  Promise.all(req.body.events.map(event => {
    console.log("webhook successful");
    userId = event.source.userId;
    //console.log(userId,event.message.text);    // print user id  and message 
    console.log('event', event);
    // check verify webhook event
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

// simple reply function
const replyText = (token, texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  strText = String(texts);
  if (strText == "I AM YOUR TEACHER") {
    teacherArrive = true ;
    firebase.database().ref('Teacher/').set(
    {
      "TeacherId" : userId,
      "TeacherArrive" : teacherArrive
      });
  } else {
      strArr = strText.split(' ');                      // converted the string to an array and then checked: 
      stuName = String(strArr[0] + " " + strArr[1]) ;   // stuName is string contain Firstname and Lastname
      stuId = String(strArr[2]);                        //stuId is string contain student id number
      
      if(stuId.length !== 11) {                         //check student id is correct by length
        
        return client.replyMessage(token,texts.map((text) => 
          ({ 'type':'text', 'text':'ข้อมูลไม่ถูกต้อง'}))); 
          
      } else {
          writeRegisData(userId, stuName, stuId);
          console.log(userId, stuName, stuId, getDateTime());
          return client.replyMessage(token,texts.map((text) => 
          ({ 'type':'text', 'text':'ลงทะเบียนเรียบร้อย : ' + text })));           // reply user 
      
      }
  }
  
  
};

const replyTextbeacon = (token,texts) => {
  texts = Array.isArray(texts) ? texts : [texts];
  console.log("beacon motherfucker");
  return client.replyMessage(token,texts.map((text) => 
      ({ 'type':'text', 'text': text + getDateTime() })));  
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
      if (event.beacon.type == "enter") {
        if (userId == getTeacherId) {
          teacherIsArrive();
        }
      } else if (event.beacon.type == "leave") {
          console.log("leave");
          if (userId == getTeacherId) {
            teacherIsleave();
          } else {
              firebase.database.ref('/List').child(timeStart).child(userId).update({
                "status" : "leave"});
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

//write data to firebase when register 
function writeRegisData(userId , stuName, stuId) {
  firebase.database().ref('userId/' + userId).set({
    "Student Name" : stuName,
    "Student Id" : stuId,
    "data time" : getDateTime()
    });
}


function writeArriveStuData() {
  firebase.database().ref('list/' + getDateTime()).child(userId).set(
    { "Student Name" : stuName,
      "Student Id" : stuId,
      "data time" : getDateTime()
    }
  );
  var leadsRef = database.ref('userId');
  leadsRef.on('value', function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
      var childData = childSnapshot.val();
      console.log(childData);
    });
});
}

function getTeacherIdFirebase() {
  //when beacon detect check teacher id and teacher arrive 
  //get teacher id from database 
  if(getTeacherId == "" || getTeacherId == null) {
    var getData = database.ref('Teacher').child("TeacherId").on('value',function(snapshot) {
      getTeacherId = snapshot.val();
      console.log("Teacher id is : " + getTeacherId);
    });
  } else {
      console.log("Already have Teacher id : " + getTeacherId);
  }

}

function teacherIsArrive() {
  teacherArrive = true;
  database.ref('Teacher').update({
    "TeacherArrive" : teacherArrive});
  console.log("Teacher is arrive motherfucker");
  //start check by create time on database 
  timeStart = getDateTime; 
  //firebase.database().ref('List/').child(getDateTime()).set();
  console.log("create time");    
}


function teacherIsleave() {
  teacherArrive = false;
  database.ref('Teacher').update({
    "TeacherArrive" : teacherArrive});
  console.log("Teacher is leave motherfucker");
}

