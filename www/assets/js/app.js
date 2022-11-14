// Initialize app
var myApp = new Framework7({
  root: '#app',
  name: 'Direct Cabs',
  id: 'com.socialrecharge.scvpl',
  on: {
    init: function () {
      //console.log('App initialized');
    },
    pageInit: function () {
      //console.log('Page initialized');
    },
  },
  touch: {
    fastClicks: true,
  },
  // panel: {
  //   swipe: 'left',
  // },
  routes: routes,
});

$(document).on({ 'DOMNodeInserted': function() { $('.pac-item, .pac-item span', this).addClass('no-fastclick'); } }, '.pac-container');

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;
var storage = firebase.storage();
var clientDB = firebase.database();
var mainView = myApp.views.create('.view-main');
var map;
var sheet='';
var cabsheet='';

function onBodyLoad() {
  document.addEventListener("deviceready", onDeviceReady, false);
  document.addEventListener("backbutton", onBackKeyDown, false);
  document.addEventListener("resume", onResume, false);
}
$(document).ready(function () {
  //document.addEventListener("deviceready", onDeviceReady, false);
  naxvarBg();
});

function onResume() {
  console.log('onResume');
  myApp.preloader.hide();
}

function onDeviceReady(){
  console.log("deviceready");
  myApp.preloader.show();
  cordova.plugins.firebase.dynamiclinks.onDynamicLink(function(data) {
    if(data) {
      console.log("Dynamic link click with data: ", data);
      var deepLink = data.deepLink;
      var deepLink1 = deepLink.split("?");
      var deepLink2 = deepLink1[1].split("=");
      console.log(deepLink2[1]);
      window.localStorage.setItem("referby",deepLink2[0]);
      window.localStorage.setItem("referuser",deepLink2[1]);
    }
  });
  //Firebase Auth State Change function
  //cordova.plugins.firebase.auth.onAuthStateChanged(function(user) {
  firebase.auth().onAuthStateChanged(function (user) {
    //console.log("On AuthStateChanged");
    if(user) {
      var uid = user.uid;
      var checkUid = uid.indexOf("@");
      uid = uid.split("@");
      var phone = user.phoneNumber;
      //var phone = '+919990266584';
      var mobile = phone.split("+");
      console.log("UID : "+uid[0]+", mobile : "+mobile[1]);
      myApp.loginScreen.close(".login-screen");
      myApp.preloader.hide();
      var chatusers = '';
      //var usermobile = window.localStorage.getItem("usermobile");
      if(mobile[1]) {
        firebase.database().ref("/chatfbuser/"+mobile[1]).once("value").then(function (chatdata) {
          if(chatdata.exists()) {
            var fname = chatdata.val().fname;
            var lname = chatdata.val().lname;
            var userImage = chatdata.val().profile_pic;
            window.localStorage.setItem("username", fname);
            window.localStorage.setItem("userlname", lname);
            window.localStorage.setItem("userimage", userImage);
            if(fname) {
              //mainView.router.refreshPage("index.html");
              myApp.preloader.hide();
              onlineOfflineStatus(mobile[1]);
              firebase.database().ref("/chat/"+mobile[1]).once("value").then(function (chatdata) {
                if(chatdata.exists()) {
                  chatdata.forEach(function (chatusersnap) {
                    (chatusers = chatusers || []).push(chatusersnap.key);
                    window.localStorage.setItem("chatusers", JSON.stringify(chatusers));
                  });
                }
              });
              firebase.database().ref("/chat/"+mobile[1]).once("value", function (oldmsgsnap) {
                if(oldmsgsnap.val()){
                  oldmsgsnap.forEach(function (oldmsgshot) {
                    firebase.database().ref("/chat/"+mobile[1]+"/"+oldmsgshot.key+"/messages/").limitToLast(50).once("value", function (msgsnap) {
                      if(msgsnap.val()) {
                        window.localStorage.setItem("chat_"+mobile[1]+"_"+oldmsgshot.key, JSON.stringify(msgsnap.val()));
                      }
                    });
                  });
                }
              });
              firebase.database().ref("/srchatmenu/").once("value", function (chatmenusnap) {
                if(chatmenusnap.val()){
                  chatmenusnap.forEach(function (chatmenushot) {
                    firebase.database().ref("/srchatmenu/"+chatmenushot.key+"/persistent_menu/").once("value", function (menusnap) {
                      if(menusnap.val()) {
                        window.localStorage.setItem("srchatmenu_"+chatmenushot.key, JSON.stringify(menusnap.val()));
                      }
                    });
                  });
                }
              });
              //mainView.router.navigate("/");
              // mainView.router.navigate(mainView.router.currentRoute.url, {
              //   reloadCurrent: true,
              //   ignoreCache: false,
              // });
            } else {
              myApp.preloader.hide();
              mainView.router.navigate("/profile/");
            }
          } else {
            myApp.preloader.hide();
            mainView.router.navigate("/profile/");
          }
        });
      } else {
        myApp.preloader.hide();
        myApp.loginScreen.open(".login-screen");
      }
    } else {
      console.log("Open Login Screen");
      myApp.preloader.hide();
      myApp.loginScreen.open(".login-screen");
    }
  });

  // window.FirebasePlugin.onTokenRefresh(function(token) {
  //     // save this server-side and use it to push notifications to this device
  //     console.log(token);
  // }, function(error) {
  //     console.error(error);
  // });

  window.FirebasePlugin.onMessageReceived(function(notification) {
      console.log(notification);
      if(notification.title) {
        var title=notification.title;
      } else {
        var title='DirectCabs';
      }
      console.log(mainView.router.currentRoute.route);
      // if(notification.tap == true) { //tap=foreground|background instead of tap=true|false
      if(notification.tap) { //CHANGE:- tap=foreground|background instead of tap=true|false
        var adddata = JSON.parse(notification.adddata);
        if((adddata.action == 'chat') && (mainView.router.currentRoute.route.path != '/directchat/:tripid/:mobile/:driverno')) {
          //myApp.dialog.alert(title, notification.page, function () {
            var tripId = adddata.tripid;
            var userNum = adddata.mobile;
            var drNum = adddata.driver;
            mainView.router.navigate("/directchat/"+tripId+"/"+userNum+"/"+drNum+"/");
          //});
        }
      } else {
        var adddata = JSON.parse(notification.adddata);
        if((adddata.action == 'chat') && (mainView.router.currentRoute.route.path != '/directchat/:tripid/:mobile/:driverno')) {
          myApp.dialog.alert(title, function () {
            var tripId = adddata.tripid;
            var userNum = adddata.mobile;
            var drNum = adddata.driver;
            mainView.router.navigate("/directchat/"+tripId+"/"+userNum+"/"+drNum+"/");
          });
        }
      }
  }, function(error) {
      console.error(error);
  });
}

function verifysubmit() {
    //myApp.preloader.show();
    var formValue = document.getElementById("verifyform");
    var inviteeNum = $("#verifynum").find("input[name='phoneNumber']").val();
    var countryCode = $("#verifynum").find("input[name='carrierCode']").val();
    var verifymobile = countryCode + inviteeNum;
    console.log("verifymobile : ", verifymobile);
    var reminder = parseInt(verifymobile);
    reminder = (verifymobile % 2);
    console.log("Reminder is : ", reminder);
    if(verifymobile && (verifymobile.length >= 10) && (reminder == 0 || reminder == 1)) {
        verifymobile = "+"+verifymobile;
        console.log("verifymobile : ", verifymobile);
        if(myApp.device.ios) {
          window.FirebasePlugin.grantPermission(function(data){
              window.FirebasePlugin.hasPermission(function(data){
                window.FirebasePlugin.getToken(function(token) {
                  window.FirebasePlugin.getVerificationID(verifymobile,function(verificationId) {
                    // pass verificationId to signInWithVerificationId
                    
                    //vid = "AM5PThDem4XUClCY1Kp9VYo2l43LFOVmfoVY2QdOyOnI-UauQThE3aaC_v_YrUtBxJQqesLx9hV6Gpr9TmnQVnV9QmJQPtSSC72yizAnztmfYPo5j0nEcJC8PO3yAf39zqXTUR4zr4m31HBP9oE9zVxUUTQLm800bJkP3I6MUEXLwZ_ToeJBIfGF9fElF59VtJ89t6u3GNTGEYEubc6P7nUi6hCDmDrJZg";
                    myApp.dialog.prompt('Enter password you received.', function (pass) {
                      var credential = firebase.auth.PhoneAuthProvider.credential(verificationId, pass);
                      console.log('credential', credential);
                      firebase.auth().signInWithCredential(credential).then(function(user){
                        console.log("Success", user);
                        var phone = user.phoneNumber;
                        var mobile = phone.split("+");
                        window.localStorage.setItem("firebase:authUser:AIzaSyAChAejJAD0N8mUebbr7Xw0v-A9KwagUaQ:[DEFAULT]", JSON.stringify(user));
                        window.localStorage.setItem("usermobile", mobile[1]);
                        if(mobile[1]) {
                          firebase.database().ref("/chatfbuser/"+mobile[1]).once("value").then(function (chatdata) {
                            myApp.loginScreen.close(".login-screen");
                            if(chatdata.exists()) {
                              var fname = chatdata.val().fname;
                              if(fname) {
                                mainView.router.navigate("/");                        
                              } else {
                                mainView.router.navigate("/profile/");
                              }
                            } else {
                              mainView.router.navigate("/profile/");
                            }
                          });
                        } else {
                          myApp.preloader.hide();
                          myApp.loginScreen.open(".login-screen");
                        }
                      });               
                      setTimeout(function(){
                        console.log('index');
                      }, 500);
                    }, function () {
                      myApp.dialog.alert("Please enter correct password.");
                    });
                    formValue.reset();
                });
              });
            });
          });
        } else {
          cordova.plugins.firebase.auth.verifyPhoneNumber(verifymobile, 0).then(function(verificationId) {
              // pass verificationId to signInWithVerificationId
              console.log("verificationId - ", verificationId);
              //vid = "AM5PThDem4XUClCY1Kp9VYo2l43LFOVmfoVY2QdOyOnI-UauQThE3aaC_v_YrUtBxJQqesLx9hV6Gpr9TmnQVnV9QmJQPtSSC72yizAnztmfYPo5j0nEcJC8PO3yAf39zqXTUR4zr4m31HBP9oE9zVxUUTQLm800bJkP3I6MUEXLwZ_ToeJBIfGF9fElF59VtJ89t6u3GNTGEYEubc6P7nUi6hCDmDrJZg";
              myApp.dialog.prompt('Enter password you received.', function (pass) {
                myApp.preloader.show();
                //cordova.plugins.firebase.auth.signInWithVerificationId(verificationId, pass).then(function(userInfo) {
                 //console.log('userInfo: ', userInfo);
                  // firebase.database().ref("/chatfbuser/"+ userInfo.phoneNumber).update({
                  //   number: userInfo.phoneNumber,
                  //   timestamp: firebase.database.ServerValue.TIMESTAMP,
                  // });
                  var credential = firebase.auth.PhoneAuthProvider.credential(verificationId, pass);
                  console.log('credential', credential);
                  firebase.auth().signInWithCredential(credential).then(function(user){
                    console.log("Success", user);
                    myApp.preloader.hide();
                    var phone = user.phoneNumber;
                    var mobile = phone.split("+");
                    window.localStorage.setItem("firebase:authUser:AIzaSyAChAejJAD0N8mUebbr7Xw0v-A9KwagUaQ:[DEFAULT]", JSON.stringify(user));
                    window.localStorage.setItem("usermobile", mobile[1]);
                    if(mobile[1]) {
                      firebase.database().ref("/chatfbuser/"+mobile[1]).once("value").then(function (chatdata) {
                        myApp.loginScreen.close(".login-screen");
                        if(chatdata.exists()) {
                          var fname = chatdata.val().fname;
                          if(fname) {
                            //mainView.router.refreshPage("index.html");
                            console.log(myApp.device);
                            if(myApp.device.android) {
                              verification(mobile[1]);
                            }
                            mainView.router.navigate("/");                        
                          } else {
                            mainView.router.navigate("/profile/");
                          }
                        } else {
                          mainView.router.navigate("/profile/");
                        }
                      });
                    } else {
                      myApp.preloader.hide();
                      myApp.loginScreen.open(".login-screen");
                    }
                  });               
                  setTimeout(function(){
                    console.log('index');
                    formValue.reset();
                    //mainView.router.loadPage("index.html");
                  }, 500);
                //});
              }, function () {
                myApp.dialog.alert("Please enter correct password.");
                formValue.reset();
              });
          });
        }
      } else {
        myApp.dialog.alert("Please enter a valid, ten digit long, mobile number.");
        myApp.preloader.hide();
        formValue.reset();
      }
  }

function onBackKeyDown()
{
  var usermobile = window.localStorage.getItem('usermobile');
  //firebase.database().ref("/chat/"+usermobile+"/cabs/messages").off("child_added");
    var cpage = mainView.router.currentRoute;
    console.log(cpage);
    //console.log(myApp.sheet.get('.sheet-modal'));
    var tripStatus = window.localStorage.getItem("tripstatus");
    if(tripStatus == 'started' || tripStatus == 'accepted') {
      if(cpage.route.url =='./directchat.html') {
        mainView.router.navigate("/");
      } else {
        myApp.dialog.confirm('Are you sure you want to exit', function () {
          var deviceType = device.platform;
          if(deviceType == 'Android' || deviceType == 'android')
          {
            navigator.app.exitApp();
          }
        });
      }
    } else if(myApp.sheet.get('.sheet-modal').opened) {
      myApp.sheet.close();
      $(".locationform").css("display","none");
      $(".ride_cont").css("display","none");
      firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
        if(ridesnap.val().ride == true){
          $(".firstdiv").css("display","block");
        } else {
          $(".firstdivscan").css("display","block");
        }
      });
    } else if(cpage.url == '/' || cpage.url == '/android_asset/www/index.html' || cpage.url =='/profile/'){
      myApp.dialog.confirm('Are you sure you want to exit', function () {
        var deviceType = device.platform;
        if(deviceType == 'Android' || deviceType == 'android')
        {
          navigator.app.exitApp();
        }
      });
    } else if(cpage.url =='/refer/' || cpage.url =='/trips/' || cpage.url =='/feedback/' || cpage.url =='/settings/') {
      mainView.router.navigate("/");
    } else {
      mainView.router.back();
    }
}

function onlineOfflineStatus(usermobile) {
  var connectedRef = firebase.database().ref(".info/connected");
  var userOfflineStat = firebase.database().ref("/presence/" + usermobile);
  connectedRef.on("value", function (snap) {
    if(snap.val() === true) {
      console.log("connected");
      myApp.preloader.hide();
      firebase.database().ref("/presence/" + usermobile).update({
        status: "online",
      }, function (error) {
        if(!error) {
          userOfflineStat.child("/lasttimeonline/").remove();
        } else {
          console.error("Error is : ", error);
        }
      });
    } else {
      console.log("not connected");
      myApp.preloader.show();
      // firebase.database().ref("/presence/"+usermobile+"/lasttimeonline").onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
      //firebase.database().ref("/presence/"+usermobile+"/status").onDisconnect().set("offline");
    }
  });
  userOfflineStat.child("/lasttimeonline/").onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
  userOfflineStat.child("/status/").onDisconnect().set("offline");
}

$$('.login-screen').on('loginscreen:open', function (e, loginScreen) {
  console.log('Login screen open');
  var mySwiper = myApp.swiper.create('.swiper-container', {
      speed: 200,
      //nextButton: '.swiper-button-next',
      //prevButton: '.swiper-button-prev',
      pagination: '.swiper-pagination',
      paginationType: 'progress',
      autoplay: 25000,
      autoplayStopOnLast: true,
      autoplayDisableOnInteraction: false,
      paginationClickable: true,
      spaceBetween: 100
  });
});

$$('.login-screen').on('open', function () {
  console.log("login-screen");
  var url = location.href;
  var actionLoc = url.indexOf("action");
  var uberData = null;
  if (actionLoc != -1) {
    var pageUrl = url.slice(actionLoc);
    var equalLoc = pageUrl.indexOf("=");
    //console.log("Equal Loc : ", equalLoc);
    var andLoc = pageUrl.indexOf("&");
    var hashLoc = pageUrl.indexOf("#");
    if (equalLoc != -1) {
      if (andLoc != -1) {
        uberData = pageUrl.slice(equalLoc + 1, andLoc);
        console.log("Uber Data, in if : ", uberData);
      } else if (hashLoc != -1) {
        uberData = pageUrl.slice(equalLoc + 1, hashLoc);
        console.log("Uber Data, in else if : ", uberData);
      } else {
        uberData = pageUrl.slice(equalLoc + 1);
        console.log("Uber Data, in else : ", uberData);
      }
    }
  }

  if(uberData != null) {
    var index = parseInt(6, 10);
    mySwiper.slideTo(index, 200, false);
  }

  $$(".skip").on('click', function (e) {
    console.log("skip");
    e.preventDefault();
    var index = parseInt(6, 10);
    console.log(index);
    mySwiper.slideTo(index, 200, false);
  });
});

//When Token Referesh
messaging.onTokenRefresh(function () {
  messaging.getToken().then(function (refreshedToken) {
    console.log('Token refreshed.');
    var userNum = window.localStorage.getItem("usermobile");
    window.localStorage.setItem("fcmtoken", refreshedToken);
    firebase.database().ref("/chatfbuser/" + userNum + "/devices/" + refreshedToken).update({
      deviceToken: refreshedToken,
      devicePlatform: "Android",
      deviceType: "DirectCabs",
      status: "1",
      time_updated: firebase.database.ServerValue.TIMESTAMP
    }, function (error) {
      if (!error) {}
    });
  });
});

//When any Notifaction arrived
messaging.onMessage(function (payload) {
  console.log("Data are : ", JSON.stringify(payload));
  console.log("Raw Data : ", payload);
  var userNum = window.localStorage.getItem("usermobile");
  myApp.addNotification({
    title: payload.notification.title,
    message: payload.notification.body,
    closeOnClick: true,
    media: '<img width="32" height="32" style="border-radius:100%" src="/app/assets/img/favicons/favicon.png">',
    onClick: function () {
      var clickPage = payload.notification.click_action;
      if (clickPage === "https://www.socialrecharge.com/app") {
        mainView.router.navigate("/");
      } else {
        var page = payload.notification.click_action.lastIndexOf("/");
        page = payload.notification.click_action.slice(page + 1);
        mainView.router.loadPage(page);
      }
    }
  })
});

$$(document).on('pageInit', function (e) {
  var page = e.detail.page;
  $("#autofill_address").geocomplete({
    details: "#address_page",
    types: ["geocode", "establishment"]
  });
  $('#driver_loc').geocomplete({
    details: "#driver",
    types: ["geocode", "establishment"],
  });
  $('#pickup_loc').geocomplete({
    details: "#pickup",
    types: ["geocode", "establishment"],
  });
  $('#drop_loc').geocomplete({
    details: "#drop",
    types: ["geocode", "establishment"],
  });
  var typingTimer;
  var doneTypingInterval = 2000;

  myApp.calendar({
    input: '#ks-calendar-default'
  });

  myApp.calendar({
    input: '#calendar-multiple',
    dateFormat: 'M dd yyyy',
    multiple: true
  });

  myApp.calendar({
    input: '#calendar-range',
    dateFormat: 'M dd yyyy',
    rangePicker: true
  });

  var today = new Date();
  var weekLater = new Date().setDate(today.getDate() + 7);

  myApp.calendar({
    input: '#calendar-disabled',
    dateFormat: 'M dd yyyy',
    disabled: {
      from: today,
      to: weekLater
    }
  });

  myApp.calendar({
    container: '#calendar-inline-container',
    value: [new Date()]
  });

  $$('.notification-default').on('click', function () {
    myApp.addNotification({
      title: 'Framework7',
      message: 'This is a simple notification message with title and message'
    });
  });

  $$('.notification-full').on('click', function () {
    myApp.addNotification({
      title: 'Framework7',
      subtitle: 'Notification subtitle',
      message: 'This is a simple notification message with custom icon and subtitle',
      media: '<i class="icon icon-f7"></i>'
    });
  });

  $$('.notification-custom').on('click', function () {
    myApp.addNotification({
      title: 'My Awesome App',
      subtitle: 'New message from John Doe',
      message: 'Hello, how are you? Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut posuere erat. Pellentesque id elementum urna, a aliquam ante. Donec vitae volutpat orci. Aliquam sed molestie risus, quis tincidunt dui.',
      media: '<img width="44" height="44" style="border-radius:100%" src="http://lorempixel.com/output/people-q-c-100-100-9.jpg">'
    });
  });

  $$('.notification-callback').on('click', function () {
    myApp.addNotification({
      title: 'My Awesome App',
      subtitle: 'New message from John Doe',
      message: 'Hello, how are you? Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut posuere erat. Pellentesque id elementum urna, a aliquam ante. Donec vitae volutpat orci. Aliquam sed molestie risus, quis tincidunt dui.',
      media: '<img width="44" height="44" style="border-radius:100%" src="http://lorempixel.com/output/people-q-c-100-100-9.jpg">',
      onClose: function () {
        myApp.dialog.alert('Notification closed');
      }
    });
  });

  $('.zoom').swipebox();

  $('.navbar').removeClass('navbar-clear');

  if (page.name === 'index' ||
    page.name === 'dashboard-1' ||
    page.name === 'post' ||
    page.name === 'menu' ||
    page.name === 'login' ||
    page.name === 'registration' ||
    page.name === 'article' ||
    page.name === 'splash') {
    console.log("Page Name: "+page.name);
    $('.navbar').addClass('navbar-clear');
  }
  // Conversation flag
  var conversationStarted = false;
  // Init Messages
  var myMessages = myApp.messages('.messages', {
    autoLayout: true
  });
  // Init Messagebar
  //var myMessagebar = myApp.messagebar('.messagebar');
  // Handle message
  // $$('.messagebar .link').on('click', function () {
  //     // Message text
  //     var messageText = myMessagebar.value().trim();
  //     // Exit if empy message
  //     if (messageText.length === 0) return;
  //     // Empty messagebar
  //     myMessagebar.clear()
  //     // Random message type
  //     var messageType = (['sent', 'received'])[Math.round(Math.random())];
  //     // Avatar and name for received message
  //     var avatar, name;
  //     if(messageType === 'received') {
  //         avatar = 'http://lorempixel.com/output/people-q-c-100-100-9.jpg';
  //         name = 'Kate';
  //     }
  //     // Add message
  //     myMessages.addMessage({
  //         // Message text
  //         text: messageText,
  //         // Random message type
  //         type: messageType,
  //         // Avatar and name:
  //         avatar: avatar,
  //         name: name,
  //         // Day
  //         day: !conversationStarted ? 'Today' : false,
  //         time: !conversationStarted ? (new Date()).getHours() + ':' + (new Date()).getMinutes() : false
  //     });
  //     // Update conversation flag
  //     conversationStarted = true;
  // });
}); //End document ready pageinit

// Check the result of the user status and display login button if necessary
function checkLoginStatus(response) {
  if (response && response.status == 'connected') {
    console.log('User is authorized');
    console.log('Access Token: ' + response.authResponse.accessToken);
    testAPI();
  } else {
    console.log('User is not authorized');
    mainView.router.loadPage("fblogin.html");
  }
}

function testAPI() {
  FB.api("/me", {
    fields: "name, first_name, last_name, gender, picture"
  }, function (response) {
    console.log("Test API : " + JSON.stringify(response));
    //firebase.database().ref("/fbuser/")
  });

  FB.api("/me", function (response) {
    console.log("/me : " + JSON.stringify(response));
  });
}

function showPosition(position) {
  // document.write('Latitude: '+position.coords.latitude+'Longitude: '+position.coords.longitude);
  var usermobile = window.localStorage.getItem('usermobile');
  var userexist = window.localStorage.getItem('firebase:authUser:AIzaSyAChAejJAD0N8mUebbr7Xw0v-A9KwagUaQ:[DEFAULT]');
  if (usermobile && userexist) {
    myApp.popup.close(".location-popup");
    var locationStatus = window.localStorage.setItem("locationstatus", true);
    firebase.database().ref("vmobile/" + usermobile).on("value", function (profilesnap) {
      if (profilesnap.exists()) {
        var fbid = profilesnap.val().fbid;
        if (!fbid) {
          myApp.popup.create('.messenger-popup');
        } else {
          myApp.popup.close('.messenger-popup');
        }
      }
    });
    firebase.database().ref("vmobile/" + usermobile + "/address").set({
      "latitude": position.coords.latitude,
      "longitude": position.coords.longitude,
      "locaiton_timestamp": position.timestamp,
      "timestamp": firebase.database.ServerValue.TIMESTAMP,
      ".priority": firebase.database.ServerValue.TIMESTAMP
    });
  }
}

function showError(error) {
  var usermobile = window.localStorage.getItem('usermobile');
  console.log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
  myApp.popup.close('.location-popup');
  firebase.database().ref("vmobile/" + usermobile).on("value", function (profilesnap) {
    if (profilesnap.exists()) {
      var fbid = profilesnap.val().fbid;
      console.log("inside case");
      if (!fbid) {
        myApp.popup.create('.messenger-popup');
      } else {
        myApp.popup.close('.messenger-popup');
      }
    }
  });
  switch (error.code) {
    case error.PERMISSION_DENIED:
      alert("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      alert("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred.");
      break;
  }
}

function getLocation() {
  if (navigator.geolocation) {
    // Get the user's current position
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    alert('Geolocation is not supported in your browser');
  }
}

function addMessenger() {
  var mobileNumb = window.localStorage.getItem("usermobile");
  openUrl('https://m.me/socialrecharge?ref=subscribe_' + mobileNumb);
}

function openUrl(url) {
  window.open(url, "_system");
}

var marker, maps;
var icon = {
  path: "img/wheel.png",
  scale: .7,
  strokeColor: 'blue', //#131540
  strokeWeight: .10,
  fillOpacity: 1,
  fillColor: '#404040',
  offset: '5%',
  // rotation: parseInt(heading[i]),
  //anchor: new google.maps.Point(10, 25) // orig 10,50 back of car, 10,0 front of car, 10,25 center of car
};
function initialize(lat, long, img) {  
  lat = +lat; //Parsed to integer
  long = +long; //Parsed to integer
  
  var myLatlng = new google.maps.LatLng(lat, long);
  console.log("img: "+img);
  var iconImg = img ? 'img/'+img+'.png' : 'img/wheel.png';
  var mapOptions = {
    zoom: 4,
    center: myLatlng,
    disableDefaultUI: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }
  maps = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
  bounds  = new google.maps.LatLngBounds();
  loc = new google.maps.LatLng(lat, long);
  bounds.extend(loc);
  maps.fitBounds(bounds);       //# auto-zoom
  maps.setZoom(18);
  maps.panToBounds(bounds);     //# auto-center

  //marker = new google.maps.Marker({
  marker = new SlidingMarker({
    position: myLatlng,
    map: maps,
    icon: iconImg,
    title: 'I\m sliding marker',
    duration: 2000,
    easing: "easeOutExpo"
  });
}

//myApp.onPageInit("chatinvite", function (page) {
$$(document).on('page:init', '.page[data-name="index"]', function (e) {
  $('.input-phone').intlInputPhone({
    preferred_country: ['in', 'us', 'gb']
  });
  
  var usermobile = window.localStorage.getItem("usermobile");
  // console.log("usermobile :", usermobile);
  myApp.preloader.show();
  //$$(".cabs").hide();
  $(".locationform").css("display","none");
  $(".ride_ongoing").css("display","none");
  var shadowImage = new google.maps.MarkerImage(
    'http://maps.gstatic.com/mapfiles/shadow50.png', null, null,
    new google.maps.Point(10, 34)
  );
  map = new GMaps({
    el: '#mapcanvas',
    lat: 28.496530,
    lng: 77.088580,
    disableDefaultUI: true,
    clickableIcons: false,
    shadow: shadowImage
  });
  var styles = [
      {
        stylers: [
          { hue: "#00ffe6" },
          { saturation: -20 }
        ]
      }, {
          featureType: "road",
          elementType: "geometry",
          stylers: [
            { lightness: 100 },
            { visibility: "simplified" }
        ]
      }, {
          featureType: "road",
          elementType: "labels",
          stylers: [
            { visibility: "off" }
        ]
      }
  ];
  map.addStyle({
    styledMapName:"Styled Map",
    styles: styles,
    mapTypeId: "map_style"  
  });
  map.setStyle("map_style");
  var lineSymbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 4,
    strokeColor: 'blue'   //#131540
  };

  $('#pickup_loc').geocomplete({
    details: "#pickup",
    types: ["geocode", "establishment"],
  });
  $('#drop_loc').geocomplete({
    details: "#drop",
    types: ["geocode", "establishment"],
  });
  // Create Popup with swipe to close
  // var swipeToClosePopup = myApp.popup.create({
  //   el: '.popup-swipe-to-close',
  //   swipeToClose: true,
  // });
  sheet = myApp.sheet.create({
    el: '.my-sheet-swipe-to-step',
    swipeToClose: false,
    swipeToStep: true,
    backdrop: false,
    closeByBackdropClick: false,
  });
  cabsheet = myApp.sheet.create({
    el: '.cabsheet',
    swipeToClose: false,
    swipeToStep: true,
    backdrop: false,
    closeByBackdropClick: false,
    //scrollToEl: '.cabs'
  });
  var otherend = "cabs";
  otherend2 = "'"+otherend+"'";
  var sender = '';
  var time = '';
  var message = '';
  var messageT = '';
  var msgAttach = '';
  var dateTime = $.timeago(new Date());
  var otherEndName = otherend;
  var drivers = [];
  let payload = '';
  if(usermobile) {
    var loginverify = window.localStorage.getItem("loginverify");
    //console.log("loginverify :", loginverify);
    if(loginverify) {
      console.log(myApp.device);
      if(myApp.device.android) {
        verification(usermobile);
      }
      window.localStorage.removeItem("loginverify");
    }
    //firebase.database().ref("/chat/"+usermobile+"/"+otherend+"/messages").off("child_added");
    //$$(".cabs").html('');
    firebase.database().ref("/chat/"+usermobile+"/"+otherend)
    .once("value").then(function (chatstat) {
      //console.log("chat existance : ", chatstat.exists());
      if(chatstat.exists()) {
        var ref = firebase.database().ref("/chat/" + usermobile + "/" + otherend + "/messages");
        ref.once("value", function (messagesnap) {
          //console.log("existance : ", messagesnap.exists());
          ref.limitToLast(1).on("child_added", function (oldmsgsnap) {
            myMsg = '';
            sender = '';
            time = '';
            messageT = '';
            $$(".cabs").show();
            $$(".cabs").html('');
            oldSentMessages = '';
            oldReceviedMsg = '';
            console.log("oldmsgsnap : ", oldmsgsnap.val());
            //Request ride problem - Please check Sender is not coming properly
            sender = oldmsgsnap.val().sender;
            time = oldmsgsnap.val().time;
            messageT = oldmsgsnap.val().message;
            chatUI(otherend, time, messageT, 'cabs');
            myApp.preloader.hide();
            msgAttach = messageT.attachment;
            sheet.close();
            if(msgAttach && (msgAttach.payload.elements[0].title)) {
              var title = msgAttach.payload.elements[0].title;
              console.log("title :", title);
              if(title && (title.toLowerCase().indexOf("connecting") >= 0)) {
                $(".ride_timer").css("display","block");
                $(".ride_ongoing").css("display","none");
                $(".firstdiv").css("display","none");
                $(".selectcabs").css("display","none");
                rideTimer();
              } else if(title && (title.toLowerCase().indexOf("pay") >= 0)) {
                window.localStorage.setItem("tripstatus", "stopped");
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","none");
                $(".ride_cont").css("display","none");
                $(".locationform").css("display","none");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe up to make the payment");
                $(".cabswipe").css("display","block");
                $(".selectcabs").css("display","none");
              } else if(title && (title.toLowerCase().indexOf("eta") >= 0)){
                window.localStorage.setItem("tripstatus", "requested");
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","none");
                $(".ride_cont").css("display","none");
                $(".locationform").css("display","none");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe left to select a trip swipe up for more");
                $(".cabswipe").css("display","block");
                $(".selectcabs").css("display","block");
              } else if(title && (title.toLowerCase().indexOf("otp") >= 0)){
                window.localStorage.setItem("tripstatus", "accepted");
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","block");
                $(".ride_cont").css("display","none");
                $(".locationform").css("display","none");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe left to select options");
                $(".cabswipe").css("display","block");
                $(".selectcabs").css("display","none");
              } else if(title && (title.toLowerCase().indexOf("started") >= 0)){
                window.localStorage.setItem("tripstatus", "started");
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","block");
                $(".ride_cont").css("display","none");
                $(".locationform").css("display","none");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe left to select options");
                $(".cabswipe").css("display","block");
                var cpage = mainView.router.currentRoute;
                console.log(cpage);
                if(cpage.url != '/' && cpage.url != '/android_asset/www/index.html'){
                  mainView.router.navigate("/");
                }
              } else {
                trackClose();
                $(".ride_timer").css("display","none");
                $(".locationform").css("display","none");
                $(".ride_cont").css("display","block");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe up for ride details");
                $(".cabswipe").css("display","block");
                $(".selectcabs").css("display","none");
              }
            } else if(messageT.text) {
              var payload = messageT.text;
              if(payload && (payload.toLowerCase().indexOf("sorry") >= 0)) {
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","none");
                $(".ride_cont").css("display","block");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe up for ride details");
                $(".cabswipe").css("display","block");
                $(".selectcabs").css("display","none");
              } else if(payload && (payload.toLowerCase().indexOf("rate") >= 0)) {
                trackClose();
                map.cleanRoute();
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","none");
                $(".ride_cont").css("display","none");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe up to rate this ride");
                $(".cabswipe").css("display","block");
              } else if(payload && (payload.toLowerCase().indexOf("thanks") >= 0)) {
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","none");
                $(".ride_cont").css("display","block");
                $(".firstdiv").css("display","none");
                $(".cabswipe").html("Swipe up for ride details");
                $(".cabswipe").css("display","block");
                $(".selectcabs").css("display","none");
              } else {
                $(".ride_timer").css("display","none");
              }
            }
            $(".jumpdiv").css("display","none");
            cabsheet.open();
            cabsheet.stepOpen();
            animateCSS('.cabs', 'slideInUp', function() {
              //console.log("Do something after animation");
            });
          });
        });
      } else {
        $.ajax({
          url: 'https://www.socialrecharge.com/brand/firebase/sr_directcabs.php',
          //url: 'https://srdirectcabs.herokuapp.com/srchat/direct',
          type: 'POST',
          data: {"action":'direct',"mobile": usermobile,"payload":payload},
          success: function (data) {
            if(data) {
              console.log(data);
              myApp.preloader.hide();
              var messageT = data.message;
              var directdata = JSON.parse(data);
              saveArrMessage(otherend, usermobile, directdata);
              chatUI(otherend, dateTime, messageT, 'cabs');
            }
          }
        });
      }
    });

    firebase.database().ref("chatfbuser/"+usermobile+"/trips/").limitToLast(1).once("child_added").then( function(usertripsnap){
      tripKey = usertripsnap.key;
      
      firebase.database().ref("chatfbuser/"+usermobile+"/trips/"+tripKey+"/requestd_drivers").once("child_added").then( function(tripsnap){
        
        if (tripsnap.exists()) {
          
          var tripStatus = tripsnap.val().status;
          var tripid = tripKey;
          var userNum = tripsnap.key;
          // console.log(tripid+" - "+userNum);
          window.localStorage.setItem("tripstatus", tripStatus);
          if (tripStatus == 'started' || tripStatus == 'accepted') {
            
            $(".locationform").css("display","none");
            $(".ride_ongoing").css("display","block");
            $(".ride_cont").css("display","none");
            $(".firstdiv").css("display","none");
            $(".dot").css("display","none");
            $("#mapcanvas").css("display","none");
            $("#map_canvas").css("display","block");
            firebase.database().ref('sr_driver/'+userNum+'/profile').once('value').then(function(drsnap){
              initialize(drsnap.val().latitude, drsnap.val().longitude, drsnap.val().vehicletype);
              var userName = window.localStorage.getItem("username") +" "+window.localStorage.getItem("userlname");
              //$("#user_name").html(userName);
              var element = "'trackelement'";
              var content = '<ul><li class="swipeout" id="trackelement">'+
              '<div class="swipeout-content">'+
              '<a href="#" class="item-link item-content" onclick="openelement('+element+');">'+
              '<div class="item-media"><img src="'+drsnap.val().driverImage+'" width="40" height="40" style="border-radius:50%;"></div>'+
              '<div class="item-inner"><div class="item-title-row"><div class="item-title" style="font-size:13px;color:gray;text-transform:uppercase;">'+drsnap.val().vehicletype+'</div><div class="item-after tripEta"></div></div>'+
              '<div class="item-subtitle" style="font-size:15px;">'+drsnap.val().vehicleno+'</div>'+
              '<div class="item-text" style="font-size:13px;font-weight:bold;"><span style="color:skyblue;">'+drsnap.val().name+'</span> <i class="fa fa-circle" style="font-size:8px;padding:5px;"></i> <span style="text-transform:uppercase;">'+tripStatus+'</span></div>'+
              '</div></a></div><div class="swipeout-actions-right"><a href="#" onClick="trackClose()" class="color-blue" style="text-transform:uppercase;">Close</a></div></li></ul>';
              $$(".track").html(content);
              $(".track").css("display","block");
              $(".cabs").css("display","none");
            });
            var prevdrLat, prevdrLong;
            window.localStorage.setItem("source","");
            window.localStorage.setItem("destination","");
            window.localStorage.setItem("round","");
            window.localStorage.setItem("ivalue", 0);
            firebase.database().ref('direct_trips/'+tripid).once('value').then(function(dtripsnap){
              var pickLatLong = dtripsnap.val().pick_latlong;
              var dropLatLong = dtripsnap.val().drop_latlong;
              var usernumber = dtripsnap.val().usernumber;
              // console.log("pickLatLong - "+pickLatLong);
              $("#destination").html(dtripsnap.val().drop_address);
              // console.log("dropLatLong - "+dropLatLong);
              if(tripStatus == "accepted") {
                firebase.database().ref('direct_trips/'+tripid+"/drivers/"+userNum).on('value', function(tripdrsnap){
                  console.log(tripdrsnap.val().eta);
                  $(".tripEta").html(tripdrsnap.val().eta);
                });
              } else {
                firebase.database().ref('direct_trips/'+tripid+"/drivers/"+userNum).on('value', function(tripdrsnap){
                  console.log(tripdrsnap.val().pickup_to_drop_eta);
                  $(".tripEta").html(tripdrsnap.val().pickup_to_drop_eta);
                });
              }
              pickLatLong = pickLatLong.split(",");
              dropLatLong = dropLatLong.split(",");
              // console.log(`pickLatLong: ${pickLatLong} and typeof ${typeof pickLatLong}`);
              // console.log(`pickLatLong[0]: ${pickLatLong[0]} and typeof ${typeof pickLatLong[0]}`);
              // console.log(`pickLatLong[1]: ${pickLatLong[1]} and typeof ${typeof pickLatLong[1]}`);

              // console.log(`dropLatLong: ${dropLatLong} and typeof ${typeof dropLatLong}`);
              // console.log(`dropLatLong[0]: ${dropLatLong[0]} and typeof ${typeof dropLatLong[0]}`);
              // console.log(`dropLatLong[1]: ${dropLatLong[1]} and typeof ${typeof dropLatLong[1]}`);
              

              var origin = new google.maps.LatLng(+(pickLatLong[0]), +(pickLatLong[1]));
              var destination = new google.maps.LatLng(+(dropLatLong[0]), +(dropLatLong[1]));
              var directionsService = new google.maps.DirectionsService;
              var directionsRenderer = new google.maps.DirectionsRenderer({map: maps, polylineOptions: {strokeColor: 'blue'},suppressMarkers:true});
              var icons = {
                start: new google.maps.MarkerImage(
                 'img/start.png',
                 new google.maps.Size( 44, 32 ),
                 new google.maps.Point( 0, 0 ),
                 new google.maps.Point( 22, 32 )
                ),
                end: new google.maps.MarkerImage(
                 'img/end.png',
                 new google.maps.Size( 44, 32 ),
                 new google.maps.Point( 0, 0 ),
                 new google.maps.Point( 22, 32 )
                )
              };

              var request = {
                origin: origin,
                destination: destination,
                travelMode: 'DRIVING'
              };
              directionsService.route(request, function (response, status) {
                if (status === 'OK') {
                  // console.log('Inside ok.', response);
                  //directionsRenderer.setDirections(response);
                  //directionsRenderer.setMap(maps);
                  var leg = response.routes[ 0 ].legs[ 0 ];
                  makeMarker( leg.start_location, icons.start, "Start" );
                  makeMarker( leg.end_location, icons.end, "End" );
                  autoRefresh(maps, response.routes[0].overview_path);
                } else {
                  myApp.dialog.alert("Directions Request from "+origin.toUrlValue(6)+" to "+destination.toUrlValue(6) + " failed: " + status);
                }
              });

              firebase.database().ref("sr_driver/"+userNum+"/profile/driver_status")
              .on("value", function(driversnap){
                if(driversnap.val() == 'onduty') {
                  var drLat = '';
                  var drLong = '';
                  firebase.database().ref("sr_driver/"+userNum+"/profile/latitude")
                  .on("value", function(drlatsnap){
                    drLat = drlatsnap.val();
                    //console.log("Driver Lat : ",drLat);
                  });
                  firebase.database().ref("sr_driver/"+userNum+"/profile/longitude")
                  .on("value", function(drlongsnap){
                    drLong = drlongsnap.val();
                    var latLong = pickLatLong[0]+","+pickLatLong[1];
                    var newLatLong = drLat+","+drLong;
                    prevLatLong = prevdrLat+","+prevdrLong;

                    var iVal = window.localStorage.getItem("ivalue");
                    if(iVal) {
                      var iVal = iVal;
                    } else {
                      var iVal = 0;
                    }
                    var i = 0;
                    var source, destination;
                    firebase.database().ref("direct_trips/"+tripid+"/triproute")
                    .once("value", function(drlatsnap){
                      window.localStorage.setItem("ivalue", drlatsnap.numChildren());
                      if(drlatsnap.numChildren() > 2) {
                        var drValue = drlatsnap.val();
                        var obj = {};
                        drlatsnap.forEach(function(rootSnapshot){
                          var rootObj = rootSnapshot.val();
                          if(i == iVal) {
                            source = rootObj.latitude+","+rootObj.longitude;
                          } else {
                            destination = rootObj.latitude+","+rootObj.longitude;
                            obj['lat']= +(rootObj.latitude);
                            obj['lng']= +(rootObj.longitude);
                          }
                          i++;
                        });
                      } else {
                        //console.log("Ride not started.");
                        var obj = {};
                        firebase.database().ref("sr_driver/"+userNum+"/profile/").once("value").then(function(currentsnap) {
                          source = "("+currentsnap.val().latitude+", "+currentsnap.val().longitude+")";
                          destination = currentsnap.val().latitude+","+((currentsnap.val().longitude)+1);
                          obj['lat']= +(currentsnap.val().latitude);
                          obj['lng']= +(currentsnap.val().longitude);
                        });
                      }
                      setTimeout(function(){
                        //console.log("Destination :", obj);
                        marker.setPosition(obj);
                        loc = new google.maps.LatLng(obj);
                        bounds.extend(loc);
                        maps.fitBounds(bounds); 
                        maps.panToBounds(bounds);
                      }, 500);
                    });
                  });
                } else {
                  var obj = {};
                  firebase.database().ref("sr_driver/"+userNum+"/profile/").once("value").then(function(currentsnap) {
                    var source = currentsnap.val().latitude+","+currentsnap.val().longitude;
                    var destination = currentsnap.val().latitude+","+((currentsnap.val().longitude)+1);
                    obj['lat']= +(currentsnap.val().latitude);
                    obj['lng']= +(currentsnap.val().longitude);
                    //setRoutes(source,destination);
                    marker.setPosition(obj);
                    loc = new google.maps.LatLng(obj);
                    bounds.extend(loc);
                    maps.fitBounds(bounds);       //# auto-zoom
                    maps.panToBounds(bounds);
                  });
                }
              });
            });
          } else {
            console.log('Inside else of requested_drivers exists (trip started).');
            $(".dot").css("display","block");
            $("#mapcanvas").css("display","block");
            $("#map_canvas").css("display","none");
            firebase.database().ref("sr_driver/"+userNum+"/profile/driver_status").off("value");
          }
        } else {
          console.log('Inside else of requested_drivers exists.');
          $(".dot").css("display","block");
          $("#mapcanvas").css("display","block");
          $("#map_canvas").css("display","none");
        }
      });
    });
    firebase.database().ref("/chatfbuser/"+usermobile).once("value").then(function (userdata) {

      if(userdata.exists()) {
        //console.log(`/chatfbuser/${usermobile} exists and bookride clicked(automatically).`);
        $(".bookride").click();
        var fname = userdata.val().fname;
        var lname = userdata.val().lname;
        var userImage = userdata.val().profile_pic;
        window.localStorage.setItem("username", fname);
        window.localStorage.setItem("userlname", lname);
        window.localStorage.setItem("userimage", userImage);
        userName = fname;
        var user_image = userImage ? userImage : "assets/img/avatar.png";
        var user_name = fname +" "+lname;
        $('.userimage').attr('src', user_image);
        $('.username').html(user_name);
        $('.usernum').html(usermobile);
        $('.addresses').html('');
        if(userdata.val().home){
          $('.saved').html('');
          $('.addresses').append('<li><a href="#" class="item-link item-content whereAdd">'+
          '<div class="item-media" style="margin:10px -20px 0px 0px;"><i class="fa fa-home fa-lg" style="color:gray;"></i></div>'+
          '<div class="item-inner"><div class="item-title">Home</div><div class="item-subtitle">'+userdata.val().home+'</div>'+
          '<span class="lat" style="display:none;">'+userdata.val().homelat+'</span><span class="lng" style="display:none;">'+userdata.val().homelng+'</span>'+
          '</div></a></li>');
        } else {
          $('.addresses').append('<li><a href="/address/home/" class="item-link item-content">'+
          '<div class="item-media" style="margin:5px -20px 0px 0px;"><i class="fa fa-home fa-lg" style="color:gray;"></i></div>'+
          '<div class="item-inner"><div class="item-title">Add Home</div></div></a></li>');
        }
        if(userdata.val().work){
          $('.saved').html('');
          $('.addresses').append('<li><a href="#" class="item-link item-content whereAdd">'+
          '<div class="item-media" style="margin:10px -20px 0px 0px;"><i class="fa fa-briefcase fa-lg" style="color:gray;"></i></div>'+
          '<div class="item-inner"><div class="item-title">Work</div><div class="item-subtitle">'+userdata.val().work+'</div>'+
          '<span class="lat" style="display:none;">'+userdata.val().worklat+'</span><span class="lng" style="display:none;">'+userdata.val().worklng+'</span>'+
          '</div></a></li>');
        } else {
          $('.addresses').append('<li><a href="/address/work/" class="item-link item-content">'+
          '<div class="item-media" style="margin:5px -20px 0px 0px;"><i class="fa fa-briefcase fa-lg" style="color:gray;"></i></div>'+
          '<div class="item-inner"><div class="item-title">Add Work</div></div></a></li>');
        }
      }
    });

    $(".bookride").on("click", function (e) {
      e.preventDefault();
      console.log("Bookride Clicked.");
      cordova.plugins.locationServices.geolocation.getCurrentPosition(function(position) {
        console.log('Latitude: '+position.coords.latitude+', '+'Longitude: '+position.coords.longitude); 
        $("#pick_loc").css("display","none");
        $("#where_loc").css("display","block");
        var geocoder = new google.maps.Geocoder();
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        pick_lat = position.coords.latitude;
        pick_lng = position.coords.longitude;
        $('#latitude_p').val(pick_lat);
        $('#longitude_p').val(pick_lng);
        map.setCenter(pick_lat, pick_lng);
        map.addMarker({
          lat: pick_lat,
          lng: pick_lng,
          title: 'You',
          icon : 'img/user.png'
        });
        var firebaseRef = firebase.database().ref("driverlocation");
        var geoFire = new GeoFire(firebaseRef);

        var geoQuery = geoFire.query({
          center: [pick_lat, pick_lng],
          radius: 2
        });
        var onKeyEnteredRegistration = geoQuery.on("key_entered", function(key, location, distance) {
          location = String(location);
          var driverLocArray = location.split(",");
          var lat = parseFloat(driverLocArray[0]);
          var lng = parseFloat(driverLocArray[1]);
          //console.log("lat : "+lat+", lng : "+lng+", key : "+key);
          if(key){
            drivers = [];
            firebase.database().ref('sr_driver/'+key+'/profile/').once('value').then(function(res){
              var last_online = res.val().last_online;
              var onlineTime = last_online ? new Date(last_online) : new Date(res.val().timestamp);
              //console.log(key+", Status: ",res.val().driver_status+", onlineTime : "+onlineTime);
              var currTime = new Date();
              currTime.setMinutes(currTime.getMinutes() - 2);
              if((res.val().driver_status == "free") && (onlineTime >= currTime)) {
                drivers.push(key);
                map.addMarker({
                  lat: lat,
                  lng: lng,
                  title: 'Driver Location',
                  zoomIn: 10,
                  icon : 'img/car.png'
                });
              }
            });
          }
        });

        if (geocoder) {
          geocoder.geocode({ 'latLng': latLng}, function (results, status) {
             if (status == google.maps.GeocoderStatus.OK) {
               myApp.preloader.hide();
               $('#currentAdd').html(results[0].formatted_address);
               $('#pickup_loc').val(results[0].formatted_address);
               $('#pick_add').val(results[0].formatted_address);
               initService(results[0].formatted_address);
             } else {
              $('#pickup_loc').val('');
              console.log("Geocoding failed: " + status);
             }
          });
        } 
      }, function(error) {
        console.error(error);
        $("#pick_loc").css("display","block");
        $("#where_loc").css("display","none");
        $('#currentAdd').html('<a href="#" onClick="onLocation();" style="color:#fff;">To find your pickup location automatically, turn on location.</a>');
      });
    });
    setTimeout(function(){
      myApp.preloader.hide();
      $("#pickup_loc").geocomplete().bind("geocode:result", function(event, result){
        var stringifyData = JSON.stringify(result);
        var jsonData = JSON.parse(stringifyData);
        //console.log(jsonData['geometry']['location']['lat']);
        var pick_lat = jsonData['geometry']['location']['lat'];
        var pick_lng = jsonData['geometry']['location']['lng'];

        map.setCenter(pick_lat, pick_lng);
        map.addMarker({
          lat: pick_lat,
          lng: pick_lng,
          title: 'You',
          icon : 'img/user.png',
          shadow: shadowImage
        });

        var firebaseRef = firebase.database().ref("driverlocation");
        var geoFire = new GeoFire(firebaseRef);

        var geoQuery = geoFire.query({
          center: [pick_lat, pick_lng],
          radius: 2
        });
        var onKeyEnteredRegistration = geoQuery.on("key_entered", function(key, location, distance) {
          location = String(location);
          var driverLocArray = location.split(",");
          var lat = parseFloat(driverLocArray[0]);
          var lng = parseFloat(driverLocArray[1]);
          console.log("lat : "+lat+", lng : "+lng+", key : "+key);
          if(key){
            drivers = [];
            firebase.database().ref('sr_driver/'+key+'/profile/').once('value').then(function(res){
              var last_online = res.val().last_online;
              var onlineTime = last_online ? new Date(last_online) : new Date(res.val().timestamp);
              console.log("Status: ",res.val().driver_status+", onlineTime : "+onlineTime);
              //onlineTime.setMinutes(onlineTime.getMinutes() + 1);
              var currTime = new Date();
              currTime.setMinutes(currTime.getMinutes() - 2);
              //console.log("currTime : "+currTime);
              if((res.val().driver_status == "free") && (onlineTime >= currTime)) {
                drivers.push(key);
                map.addMarker({
                  lat: lat,
                  lng: lng,
                  title: 'Driver Location',
                  zoomIn: 10,
                  icon : 'img/car.png',
                  shadow: shadowImage
                });
              }
            });
          }
        });
      });

      // Use new from http://jsfiddle.net/6LwgQ/2/
      $("#drop_loc").geocomplete().bind("geocode:result", function(event, result){
        var stringifyData = JSON.stringify(result);
        var jsonData = JSON.parse(stringifyData);
        console.log(jsonData);
        var drop_lat = jsonData['geometry']['location']['lat'];
        var drop_lng = jsonData['geometry']['location']['lng'];
        var drop_add = jsonData['formatted_address'];
        var pick_lat = $('#latitude_p').val();
        var pick_lng = $('#longitude_p').val();
        //map.renderRoute();
        map.drawRoute({
          origin: [pick_lat, pick_lng],
          destination: [drop_lat, drop_lng],
          travelMode: 'driving',
          strokeColor: 'blue',
          strokeOpacity: 0.6,
          strokeWeight: 6,
        }, {
          //panel: '#directions',
          draggable: false,
          suppressMarkers: true
        });
      //   $(".submitRide").click();
      // });
      // $$(".submitRide").on("click", function (e) {
        if(myApp.sheet.get('.sheet-modal').opened) {
          sheet.close();
          cabsheet.open();
        } else {
          cabsheet.open();
        }
        var newsSentMessages = '<ul><li><a href="#" class="item-link item-content">'+
        '<div class="item-media"><img src="img/route.gif" width="40" style="border-radius:50%;"></div>'+
        '<div class="item-inner"><div class="item-title">Connecting you to nearby drivers</div>'+
        '</div></a></li></ul>';
        $$(".cabs").html(newsSentMessages);
        //myApp.preloader.show();
        var pick_lat = $('#latitude_p').val();
        var pick_lng = $('#longitude_p').val();
        var pick_add = $('#pick_add').val();
        var drop_lat = $('#latitude_drop').val();
        var drop_lng = $('#longitude_drop').val();
        var drop_add = $('#drop_add').val();
        var pickup_loc = $('#pickup_loc').val();
        var drop_loc = $('#drop_loc').val();
        var pick_latlong = pick_lat+","+pick_lng;
        var drop_latlong = drop_lat+","+drop_lng;
        console.log(pick_lat+"  "+pick_lng+"  "+drop_lat+"  "+drop_lng+"<br>"+pick_add+"<br>"+drop_add);
        if(pick_add && drop_add && pickup_loc && drop_loc) {
          var dist = getDistance(pick_lat,pick_lng,drop_lat,drop_lng).toFixed(2);
          var distRound = Math.round(dist);
          console.log("distRound : "+distRound);
          if(distRound < 100) {
            firebase.database().ref('chatfbuser/'+usermobile+"/rides/1").update({
              'pick_latlong':pick_latlong,
              'drop_latlong':drop_latlong,
              'pickup_address':pick_add,
              'drop_address':drop_add
            }, function(error){
              if(!error) {
                console.log(drivers);
                var newD = JSON.stringify(drivers);
                console.log('Making sr_driver_price API request.');
                $.ajax({
                  url: "https://www.socialrecharge.com/brand/firebase/sr_driver_price.php",
                  type: "POST",
                  data: {driversData:newD, fbid:usermobile},
                  dataType: 'json',
                  cache: false,
                  success: function(result) {
                    if(result){
                      console.log('Result from app.js:-',result);
                      myApp.preloader.hide();
                      var data = JSON.parse(result);
                      saveArrMessage('cabs', usermobile, data);
                      //$("#pickup_loc").val('');
                      $("#drop_loc").val('');
                      $(".locationform").css("display","none");
                      $(".firstdiv").css("display","none");
                      //drivers = [];
                    }
                  },
                  error: function(error){
                    console.log(error);
                    myApp.preloader.hide();
                    myApp.dialog.alert("There is some error!");
                  }
                });
              }
            });
          } else {
            myApp.preloader.hide();
            myApp.dialog.alert("Currently the drop location is not in service area.");
          }
        } else {
          myApp.preloader.hide();
          myApp.dialog.alert("Please enter pickup and drop location.");
        }
      });
    }, 1000);
  } else {
    myApp.preloader.hide();
    myApp.dialog.alert("Please login with your registered number.");
    myApp.loginScreen.open(".login-screen");
  }
  $$("#pick_loc").on("click", function (e) {
    e.preventDefault();
    firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
      if(ridesnap.val().ride == true){
        $(".ride_timer").css("display","none");
        $(".ride_ongoing").css("display","none");
        $(".ride_cont").css("display","none");
        $(".locationform").css("display","block");
        $(".firstdiv").css("display","none");
        sheet.open();
      } else {
        //myApp.dialog.alert("This feature is coming soon!");

      }
    });
  });
  $$("#where_loc").on("click", function (e) {
    e.preventDefault();
    firebase.database().ref('/apppermission/directcabs/').once('value').then(function(ridesnap){
      //console.log(ridesnap.val());
      //console.log(ridesnap.val().scan);
      if(ridesnap.val().ride == true){
        $(".ride_timer").css("display","none");
        $(".ride_ongoing").css("display","none");
        $(".ride_cont").css("display","none");
        $(".locationform").css("display","block");
        $(".firstdiv").css("display","none");
        $("#drop_loc").val("");
        //swipeToClosePopup.open();
        sheet.open();
      } else {
        myApp.dialog.alert("This feature is coming soon!");
      }
    });
  });
  $$('.my-sheet-swipe-to-step').on('sheet:open', function (e, popup) {
    //console.log('Sheet open');
    $(this).css("z-index", "5000");
  });
  $$('.my-sheet-swipe-to-step').on('sheet:close', function (e, popup) {
    //console.log('Sheet close');
    $(this).css("z-index", "12500");
  });

  $$('.cabsheet').on('sheet:open', function (e, popup) {
    //console.log('Cab Sheet open');
    $(this).css("z-index", "5000");
  });
  $$('.cabsheet').on('sheet:close', function (e, popup) {
    //console.log('Cab Sheet close');
    $(this).css("z-index", "12500");
    map.cleanRoute();
  });

  $('.addresses').on("click", ".whereAdd" , function() {
    firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
      if(ridesnap.val().ride == true){
        var addr = $(this).find(".item-subtitle").text();
        //console.log(addr);
        $(".locationform").css("display","block");
        $(".firstdiv").css("display","none");
        if(myApp.sheet.get('.sheet-modal').opened) {
          sheet.stepClose();
        } else {
          sheet.open();
        }
        if(!($("#pickup_loc").val())){
          $("#pickup_loc").val(addr);
          $("#pickup_loc").focus();
        } else {
          $("#drop_loc").val(addr);
          $("#drop_loc").focus();
        }
      } else {
        myApp.dialog.alert("This feature is coming soon!");
      }
    });
  });
  $('.moreaddress').on("click", ".whereAdd" , function() {
    firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
      if(ridesnap.val().ride == true){
        var addr = $(this).find(".item-subtitle").text();
        //console.log(addr);
        if(!($("#pickup_loc").val())){
          $("#pickup_loc").val(addr);
          $("#pickup_loc").focus();
        } else {
          $("#drop_loc").val(addr);
          sheet.stepClose();
          $("#drop_loc").focus();
        }
      } else {
        myApp.dialog.alert("This feature is coming soon!");
      }
    });
  });
  // $("#pickup_loc").focus(function () {
  //   $('#pickClose').css('display', 'none');
  // });
  $('.sortcabs').on('change', function(){
    console.log(this.value);
    var $wrapper = $('.cabs');
    if(this.value == 'eta') {
      $wrapper.find('.swipeout').sort(function (a, b) {
        return +a.dataset.eta - +b.dataset.eta;
      })
      .appendTo( $wrapper );
    } else {
      $wrapper.find('.swipeout').sort(function (a, b) {
        return +a.dataset.fare - +b.dataset.fare;
      })
      .appendTo( $wrapper );
    }
  });
  $$(".phonesubmit").on("click", function (e) {
    e.preventDefault();
    var formValue = document.getElementById("verifyform");
    var inviteeNum = $("#verifynum").find("input[name='phoneNumber']").val();
    var countryCode = $("#verifynum").find("input[name='carrierCode']").val();
    var verifymobile = countryCode + inviteeNum;
    console.log("verifymobile : ", verifymobile);
    var reminder = parseInt(verifymobile);
    reminder = (verifymobile % 2);
    console.log("Reminder is : ", reminder);
    if(verifymobile && (verifymobile.length >= 10) && (reminder == 0 || reminder == 1)) {
        verifymobile = "+"+verifymobile;
        console.log("verifymobile : ", verifymobile);
        if(myApp.device.ios) {
          window.FirebasePlugin.grantPermission(function(data){
              window.FirebasePlugin.hasPermission(function(data){
                window.FirebasePlugin.getToken(function(token) {
                  window.FirebasePlugin.getVerificationID(verifymobile,function(verificationId) {
                    // pass verificationId to signInWithVerificationId
                    
                    //vid = "AM5PThDem4XUClCY1Kp9VYo2l43LFOVmfoVY2QdOyOnI-UauQThE3aaC_v_YrUtBxJQqesLx9hV6Gpr9TmnQVnV9QmJQPtSSC72yizAnztmfYPo5j0nEcJC8PO3yAf39zqXTUR4zr4m31HBP9oE9zVxUUTQLm800bJkP3I6MUEXLwZ_ToeJBIfGF9fElF59VtJ89t6u3GNTGEYEubc6P7nUi6hCDmDrJZg";
                    myApp.dialog.prompt('Enter password you received.', function (pass) {
                      var credential = firebase.auth.PhoneAuthProvider.credential(verificationId, pass);
                      console.log('credential', credential);
                      firebase.auth().signInWithCredential(credential).then(function(user){
                        console.log("Success", user);
                        var phone = user.phoneNumber;
                        var mobile = phone.split("+");
                        window.localStorage.setItem("firebase:authUser:AIzaSyAChAejJAD0N8mUebbr7Xw0v-A9KwagUaQ:[DEFAULT]", JSON.stringify(user));
                        window.localStorage.setItem("usermobile", mobile[1]);
                        if(mobile[1]) {
                          firebase.database().ref("/chatfbuser/"+mobile[1]).once("value").then(function (chatdata) {
                            myApp.loginScreen.close(".login-screen");
                            if(chatdata.exists()) {
                              var fname = chatdata.val().fname;
                              if(fname) {
                                mainView.router.navigate("/");                        
                              } else {
                                mainView.router.navigate("/profile/");
                              }
                            } else {
                              mainView.router.navigate("/profile/");
                            }
                          });
                        } else {
                          myApp.preloader.hide();
                          myApp.loginScreen.open(".login-screen");
                        }
                      });               
                      setTimeout(function(){
                        console.log('index');
                      }, 500);
                    }, function () {
                      myApp.dialog.alert("Please enter correct password.");
                    });
                    formValue.reset();
                });
              });
            });
          });
        } else {
          console.log(`For android device.`);
          console.log(`User mobile number is ${verifymobile}`);
          //cordova.plugins.firebase.auth.verifyPhoneNumber(verifymobile, 0).then(function(verification) {
          FirebasePlugin.verifyPhoneNumber(function(verification) {
              // pass verificationId to signInWithVerificationId
              console.log("verification - ", verification);
              var verificationId = verification.verificationId;
              console.log("verificationId - ", verificationId);
              //vid = "AM5PThDem4XUClCY1Kp9VYo2l43LFOVmfoVY2QdOyOnI-UauQThE3aaC_v_YrUtBxJQqesLx9hV6Gpr9TmnQVnV9QmJQPtSSC72yizAnztmfYPo5j0nEcJC8PO3yAf39zqXTUR4zr4m31HBP9oE9zVxUUTQLm800bJkP3I6MUEXLwZ_ToeJBIfGF9fElF59VtJ89t6u3GNTGEYEubc6P7nUi6hCDmDrJZg";
              myApp.dialog.prompt('Enter password you received.', function (pass) {
                myApp.preloader.show();
                //cordova.plugins.firebase.auth.signInWithVerificationId(verificationId, pass).then(function(userInfo) {
                 //console.log('userInfo: ', userInfo);
                  // firebase.database().ref("/chatfbuser/"+ userInfo.phoneNumber).update({
                  //   number: userInfo.phoneNumber,
                  //   timestamp: firebase.database.ServerValue.TIMESTAMP,
                  // });
                  var credential = firebase.auth.PhoneAuthProvider.credential(verificationId, pass);
                  console.log('credential', credential);
                  firebase.auth().signInWithCredential(credential).then(function(user){
                    window.localStorage.setItem("loginverify", true);
                    console.log("Success", user);
                    myApp.preloader.hide();
                    var phone = user.phoneNumber;
                    var mobile = phone.split("+");
                    window.localStorage.setItem("firebase:authUser:AIzaSyAChAejJAD0N8mUebbr7Xw0v-A9KwagUaQ:[DEFAULT]", JSON.stringify(user));
                    window.localStorage.setItem("usermobile", mobile[1]);
                    if(mobile[1]) {
                      firebase.database().ref("/chatfbuser/"+mobile[1]).once("value").then(function (chatdata) {
                        myApp.loginScreen.close(".login-screen");
                        if(chatdata.exists()) {
                          var fname = chatdata.val().fname;
                          if(fname) {
                            //mainView.router.refreshPage("index.html");
                            mainView.router.navigate("/", {
                              ignoreCache: false,
                              reloadCurrent: true
                            });                  
                          } else {
                            mainView.router.navigate("/profile/");
                          }
                        } else {
                          mainView.router.navigate("/profile/");
                        }
                      });
                    } else {
                      myApp.preloader.hide();
                      myApp.loginScreen.open(".login-screen");
                    }
                  }).catch( function(error) {
                    console.log(error.code);
                    myApp.preloader.hide();
                    myApp.dialog.alert(error.message);
                  });               
                  setTimeout(function(){
                    console.log('index');
                    formValue.reset();
                    //mainView.router.loadPage("index.html");
                  }, 500);
                //});
              }, function () {
                myApp.dialog.alert("Please enter correct password.");
                formValue.reset();
              });
          }, function(error) {
            console.error("Failed to verify phone number: " + JSON.stringify(error));
          }, verifymobile, 0);
        }
      } else {
        myApp.dialog.alert("Please enter a valid, ten digit long, mobile number.");
        myApp.preloader.hide();
        formValue.reset();
      }
  });
});

function moveMarker(maps, marker, latlng) {
  marker.setPosition(latlng);
  maps.panTo(latlng);
  maps.setZoom(16);
}
function autoRefresh(maps, pathCoords) {
  var i, route, marker;
  route = new google.maps.Polyline({
    path: [],
    geodesic : true,
    strokeColor: 'blue',    //#131540
    strokeOpacity: 1.0,
    strokeWeight: 2,
    editable: false,
    map:maps
  });
  
  marker = new google.maps.Marker({map:maps, icon:"https://maps.google.com/mapfiles/ms/micons/blue.png"});

  for (i = 0; i < pathCoords.length; i++) {       
    setTimeout(function(coords) {
      route.getPath().push(coords);
      moveMarker(maps, marker, coords);
    }, 200 * i, pathCoords[i]);
  }
}
function makeMarker( position, icon, title ) {
 new google.maps.Marker({
  position: position,
  map: maps,
  icon: icon,
  title: title,
  // label: {
  //   color: 'red',
  //   fontWeight: 'bold',
  //   text: title,
  // }
 });
}
function initService(address) {
  // console.log("Address :", address);
  $('.moreaddress').html('');
  var add = address.replace(/\d{6}/, '');
  var displaySuggestions = function(predictions, status) {
    if (status != google.maps.places.PlacesServiceStatus.OK) {
      console.log(status);
      return;
    }

    var p = 0;
    predictions.forEach(function(prediction) {
      //console.log(p);console.log(prediction);
      if(p < 3) {
        $('.moreaddress').append('<li><a href="#" class="item-link item-content whereAdd">'+
          '<div class="item-media" style="margin:10px -20px 0px 0px;"><i class="fa fa-map-marker fa-lg" style="color:gray;"></i></div>'+
          '<div class="item-inner"><div class="item-title">'+prediction.structured_formatting.main_text+'</div><div class="item-subtitle">'+prediction.description+'</div></div></a></li>');        
      }
      p = p + 1;
    });
  };

  var service = new google.maps.places.AutocompleteService();
  service.getQueryPredictions({ input: add }, displaySuggestions);
}
function onLocation() {
  if (window.cordova && window.cordova.plugins.settings) {
    console.log('openNativeSettingsTest is active');
    window.cordova.plugins.settings.open("location", function() {
        console.log('opened settings');
      },
      function () {
        console.log('failed to open settings');
      }
    );
  } else {
    console.log('openNativeSettingsTest is not active!');
  }
}
function errorLoc() {
  console.warn('Location permission is not turned on');
}
 
function successLoc( status ) {
  console.log('successLoc', status);
}

function stepToggle(){
  cabsheet.stepToggle();
}

$$(document).on('page:init', '.page[data-name="settings"]', function (e) {
  console.log("Settings");
});

function verification(id) {
  console.log("verification: "+id);
  myApp.preloader.show();
  var userNum = window.localStorage.getItem("usermobile");
  if(userNum && myApp.device.android) {
    window.FirebasePlugin.hasPermission(function(data){
      console.log(data.isEnabled);
      if(data.isEnabled) {
        console.log('Notification permission granted.');
        window.FirebasePlugin.getToken(function(currentToken) {
          console.log("APNS device token: ", currentToken);
          myApp.preloader.hide();
          if(currentToken) {
            var deviceModel = device.model;
            var devicePlatform = device.platform;
            var deviceUUID = device.uuid;
            var deviceVersion = device.version;
            window.localStorage.setItem("deviceModel", deviceModel);
            window.localStorage.setItem("devicePlatform", devicePlatform);
            window.localStorage.setItem("deviceUUID", deviceUUID);
            window.localStorage.setItem("deviceVersion", deviceVersion);
            window.localStorage.setItem("fcmtoken", currentToken);
            firebase.database().ref("/chatfbuser/" + userNum + "/devices/" + deviceUUID).update({
              deviceToken: currentToken,
              deviceModel:deviceModel,
              devicePlatform:devicePlatform,
              deviceUUID:deviceUUID,
              deviceVersion:deviceVersion,
              deviceType: "DirectCabs",
              status: "1",
              time_updated: firebase.database.ServerValue.TIMESTAMP
            }, function (error) {
              if(!error) {
                myApp.preloader.hide();
                //mainView.router.navigate("/");
              } else {
                console.error("Updation at device failed.", error);
                myApp.preloader.hide();
              }
            });
          }
        });
      } else {
        console.log('Notification permission not granted.');
        myApp.preloader.hide();
      }
    });
  } else {
    myApp.preloader.hide();
    mainView.router.navigate("/");
  }
}

function animateCSS(element, animationName, callback) {
    const node = document.querySelector(element)
    node.classList.add('animated', animationName)

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}

function track(userNum,tripid) {
  var usermobile = window.localStorage.getItem('usermobile');
  $(".locationform").css("display","none");
  $(".ride_ongoing").css("display","block");
  $(".ride_cont").css("display","none");
  $(".firstdiv").css("display","none");
  $(".dot").css("display","none");
  $(".cabs").css("display","none");
  $("#mapcanvas").css("display","none");
  $("#map_canvas").css("display","block");
  firebase.database().ref('sr_driver/'+userNum+'/profile').once('value').then(function(drsnap){
    initialize(drsnap.val().latitude, drsnap.val().longitude, drsnap.val().vehicletype);
    var userName = window.localStorage.getItem("username") +" "+window.localStorage.getItem("userlname");
    //$("#user_name").html(userName);
    var element = "'trackelement'";
    var content = '<ul><li class="swipeout" id="trackelement">'+
    '<div class="swipeout-content">'+
    '<a href="#" class="item-link item-content" onclick="openelement('+element+');">'+
    '<div class="item-media"><img src="'+drsnap.val().driverImage+'" width="40" height="40" style="border-radius:50%;"></div>'+
    '<div class="item-inner"><div class="item-title-row"><div class="item-title" style="font-size:13px;color:gray;text-transform:uppercase;">'+drsnap.val().vehicletype+'</div><div class="item-after tripEta"></div></div>'+
    '<div class="item-subtitle" style="font-size:15px;">'+drsnap.val().vehicleno+'</div>'+
    '<div class="item-text" style="font-size:13px;font-weight:bold;"><span style="color:skyblue;">'+drsnap.val().name+'</span> <i class="fa fa-circle" style="font-size:8px;padding:5px;"></i> <span class="rideStat" style="text-transform:uppercase;"></span></div>'+
    '</div></a></div><div class="swipeout-actions-right"><a href="#" onClick="trackClose()" class="color-blue" style="text-transform:uppercase;">Close</a></div></li></ul>';
    $$(".track").html(content);
    $(".track").css("display","block");
  });
  var prevdrLat, prevdrLong;
  window.localStorage.setItem("source","");
  window.localStorage.setItem("destination","");
  window.localStorage.setItem("round","");
  window.localStorage.setItem("ivalue", 0);
  firebase.database().ref('direct_trips/'+tripid).once('value').then(function(dtripsnap){
    var pickLatLong = dtripsnap.val().pick_latlong;
    var dropLatLong = dtripsnap.val().drop_latlong;
    var usernumber = dtripsnap.val().usernumber;
    console.log("pickLatLong - "+pickLatLong);
    $("#destination").html(dtripsnap.val().drop_address);
    console.log("dropLatLong - "+dropLatLong);
    firebase.database().ref('direct_trips/'+tripid+"/requestd_drivers").on('child_added', function(reqdrsnap){
      $(".rideStat").html(reqdrsnap.val().status);
      if(reqdrsnap.val().status == "accepted") {
        firebase.database().ref('direct_trips/'+tripid+"/drivers/"+userNum).on('value', function(tripdrsnap){
          console.log(tripdrsnap.val().eta);
          $(".tripEta").html(tripdrsnap.val().eta);
        });
      } else {
        firebase.database().ref('direct_trips/'+tripid+"/drivers/"+userNum).on('value', function(tripdrsnap){
          console.log(tripdrsnap.val().pickup_to_drop_eta);
          $(".tripEta").html(tripdrsnap.val().pickup_to_drop_eta);
        });
      }
    });
    pickLatLong = pickLatLong.split(",");
    dropLatLong = dropLatLong.split(",");
    var origin = new google.maps.LatLng(pickLatLong[0], pickLatLong[1]);
    var destination = new google.maps.LatLng(dropLatLong[0], dropLatLong[1]);
    var directionsService = new google.maps.DirectionsService;
    var directionsRenderer = new google.maps.DirectionsRenderer({map: maps});
    var icons = {
      start: new google.maps.MarkerImage(
       'img/start.png',
       new google.maps.Size( 44, 32 ),
       new google.maps.Point( 0, 0 ),
       new google.maps.Point( 22, 32 )
      ),
      end: new google.maps.MarkerImage(
       'img/end.png',
       new google.maps.Size( 44, 32 ),
       new google.maps.Point( 0, 0 ),
       new google.maps.Point( 22, 32 )
      )
    };
    var request = {
      origin: origin,
      destination: destination,
      travelMode: 'DRIVING'
    };
    directionsService.route(request, function (response, status) {
      if (status === 'OK') {
        //directionsRenderer.setDirections(response);
        //directionsRenderer.setMap(maps);
        var leg = response.routes[ 0 ].legs[ 0 ];
        makeMarker( leg.start_location, icons.start, "Start" );
        makeMarker( leg.end_location, icons.end, "End" );
        autoRefresh(maps, response.routes[0].overview_path);
      } else {
        myApp.dialog.alert("Directions Request from "+origin.toUrlValue(6)+" to "+destination.toUrlValue(6) + " failed: " + status);
      }
    });

    firebase.database().ref("sr_driver/"+userNum+"/profile/driver_status")
    .on("value", function(driversnap){
      if(driversnap.val() == 'onduty') {
        var drLat = '';
        var drLong = '';
        firebase.database().ref("sr_driver/"+userNum+"/profile/latitude")
        .on("value", function(drlatsnap){
          drLat = drlatsnap.val();
          //console.log("Driver Lat : ",drLat);
        });
        firebase.database().ref("sr_driver/"+userNum+"/profile/longitude")
        .on("value", function(drlongsnap){
          drLong = drlongsnap.val();
          var latLong = pickLatLong[0]+","+pickLatLong[1];
          var newLatLong = drLat+","+drLong;
          prevLatLong = prevdrLat+","+prevdrLong;

          var iVal = window.localStorage.getItem("ivalue");
          if(iVal) {
            var iVal = iVal;
          } else {
            var iVal = 0;
          }
          var i = 0;
          var source, destination;
          firebase.database().ref("direct_trips/"+tripid+"/triproute")
          .once("value", function(drlatsnap){
            window.localStorage.setItem("ivalue", drlatsnap.numChildren());
            if(drlatsnap.numChildren() > 2) {
              var drValue = drlatsnap.val();
              var obj = {};
              drlatsnap.forEach(function(rootSnapshot){
                var rootObj = rootSnapshot.val();
                if(i == iVal) {
                  source = rootObj.latitude+","+rootObj.longitude;
                } else {
                  destination = rootObj.latitude+","+rootObj.longitude;
                  obj['lat']= +(rootObj.latitude);
                  obj['lng']= +(rootObj.longitude);
                }
                i++;
              });
            } else {
              //console.log("Ride not started.");
              var obj = {};
              firebase.database().ref("sr_driver/"+userNum+"/profile/").once("value").then(function(currentsnap) {
                source = "("+currentsnap.val().latitude+", "+currentsnap.val().longitude+")";
                destination = currentsnap.val().latitude+","+((currentsnap.val().longitude)+1);
                obj['lat']= +(currentsnap.val().latitude);
                obj['lng']= +(currentsnap.val().longitude);
              });
            }
            setTimeout(function(){
              //console.log("Destination :", obj);
              marker.setPosition(obj);
              loc = new google.maps.LatLng(obj);
              bounds.extend(loc);
              maps.fitBounds(bounds); 
              maps.panToBounds(bounds);
            }, 500);
          });
        });
      } else {
        var obj = {};
        firebase.database().ref("sr_driver/"+userNum+"/profile/").once("value").then(function(currentsnap) {
          var source = currentsnap.val().latitude+","+currentsnap.val().longitude;
          var destination = currentsnap.val().latitude+","+((currentsnap.val().longitude)+1);
          obj['lat']= +(currentsnap.val().latitude);
          obj['lng']= +(currentsnap.val().longitude);
          //setRoutes(source,destination);
          marker.setPosition(obj);
          loc = new google.maps.LatLng(obj);
          bounds.extend(loc);
          maps.fitBounds(bounds);       //# auto-zoom
          maps.panToBounds(bounds);
        });
      }
    });
  });
}
function trackClose() {
  $(".track").css("display","none");
  $(".cabs").css("display","block");
  $("#mapcanvas").css("display","block");
  $("#map_canvas").css("display","none");
}
function rideContinue() {
  console.log(`Inside rideContinue function.`);
  $(".ride_timer").css("display","none");
  $(".locationform").css("display","none");
  $(".ride_ongoing").css("display","none");
  $(".ride_cont").css("display","none");
  $$(".cabs").hide();
  cabsheet.close();
  //$("#pickup_loc").val('');
  $("#drop_loc").val('');
  map.cleanRoute();
  $(".bookride").click();
  firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
    if (ridesnap.val().ride == true) {
      console.log(`Inside rideContinue function... inside if condition.`);
      $(".firstdiv").css("display","block");
    } else {
      console.log(`Inside rideContinue function... inside else condition.`);
      $(".firstdivscan").css("display","block");
    }
  });
}

function clearAddress(val) {
  if(val == 'pickup_loc') {
    document.getElementById('drop_loc').value = '';
  }
  document.getElementById(val).value = '';
  map.cleanRoute();
}

function newChatUI(text) {
  cabsheet.open();
  $$(".cabs").show();
  $$(".cabs").empty();
  var formValue = document.getElementById("verifyform");
  var usermobile = window.localStorage.getItem('usermobile');
  myApp.preloader.show();
  var otherend = "cabs";
  otherend2 = "'"+otherend+"'";
  var message = '';
  var messageT = '';
  var msgAttach = '';
  var dateTime = $.timeago(new Date());
  var otherEndName = otherend;
  var image = "assets/img/tmp/ava4.jpg";
  if(usermobile) {
    formValue.reset();
    $(".locationform").css("display","none");
    if(text == 'continue') {
      $(".ride_cont").css("display","block");
    } else {
      $(".ride_cont").css("display","none");
    }
    window.localStorage.removeItem("rideData");
    firebase.database().ref("/chat/"+usermobile+"/"+otherend+"/messages").off("child_added");
    userName = window.localStorage.getItem("username");
    userImage = window.localStorage.getItem("userimage");
    firebase.database().ref("/chat/"+usermobile+"/"+otherend)
    .once("value").then(function (chatstat) {
      console.log("chat existance : ", chatstat.exists());
      if(chatstat.exists()) {
        var ref = firebase.database().ref("/chat/" + usermobile + "/" + otherend + "/messages");
        ref.once("value", function (messagesnap) {
          console.log("existance : ", messagesnap.exists());
          ref.limitToLast(1).on("child_added", function (oldmsgsnap) {
            $$(".cabs").html('');
            oldSentMessages = '';
            oldReceviedMsg = '';
            myMsg = '';
            var sender = '';
            var time = '';
            messageT = '';
            sender = oldmsgsnap.val().sender;
            time = oldmsgsnap.val().time;
            messageT = oldmsgsnap.val().message;
            chatUI(sender, time, messageT, 'cabs');
            myApp.preloader.hide();
            animateCSS('.cabs', 'slideInUp', function() {
              console.log("Do something after animation");
            });
            $(".ride_ongoing").css("display","block");
            msgAttach = messageT.attachment;
            if(msgAttach.payload.elements[0].title) {
              var title = msgAttach.payload.elements[0].title;
              console.log("title :", title);
              if(title && (title.toLowerCase().indexOf("connecting") >= 0)) {
                $(".ride_timer").css("display","block");
                rideTimer();
              } else {
                $(".ride_timer").css("display","none");
              }
            } else if(data.message.text) {
              var payload = data.message.text;
              console.log("payload :", payload);
              if(payload && (payload.toLowerCase().indexOf("sorry") >= 0)) {
                $(".ride_timer").css("display","none");
                $(".ride_ongoing").css("display","none");
                $(".ride_cont").css("display","block");
              } else {
                $(".ride_timer").css("display","none");
              }
            }
          });
        });
      } else {
        $.ajax({
          url: 'https://www.socialrecharge.com/brand/firebase/sr_directcabs.php',
          type: 'POST',
          data: {"action":'direct',"mobile": usermobile,"payload":payload},
          success: function (data) {
            if(data) {
              //console.log(params.type);
              myApp.preloader.hide();
              var messageT = data.message;
              var directdata = JSON.parse(data);
              saveArrMessage(otherend, usermobile, directdata);
              chatUI(otherend, dateTime, messageT, 'cabs');
            }
          }
        });
      }
    });
  } else {
    myApp.preloader.hide();
    console.log("Sorry, you have to Sign In for chat with your friend\'s.");
    myApp.loginScreen.open(".login-screen");
  }
}

function rideTimer(){
  var n=$('.ride_time').attr('id');
  //console.log("rideTimer :", n);
  var c=n;
  $('.ride_time').text(c);
  setInterval(function(){
    c--;
    if(c>=0){
      $('.ride_time').text(c);
    }
    if(c==0){
      $('.ride_time').text(n);
      $(".ride_timer").css("display","none");
      var tripStatus = window.localStorage.getItem("tripstatus");
      if (tripStatus == 'started' || tripStatus == 'accepted') {
        console.log('inside rideTimer function... if condition... trip status either accepted or started...');
        //$(".firstdiv").css("display","none");
      } else {
        console.log('inside rideTimer function... else condition...');
        rideContinue();
      }
    }
  },1000);
}

$$(document).on('page:init', '.page[data-name="srchat"]', function (e) {
  console.log("data-name srchat");
});

function readImgURL(input) {
  if (input.files && input.files[0]) {
    myApp.preloader.show();
    var reader = new FileReader();
    reader.onload = function (e) {
      //console.log(e.target.result);
      //$$('#blah').attr('src', e.target.result).width(150).height(200);
    };
    reader.readAsDataURL(input.files[0]);
    console.log(input.files[0].name);
    var imgName = input.files[0].name;
    var imgFile = input.files[0];
    var storageRef = storage.ref();
    var uploadTask = storageRef.child('messenger/CTPrfPTL0WeRVSFEXJNLA63DzuG2/' + imgName).put(imgFile);
    uploadTask.on('state_changed', function (snapshot) {
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED:
          console.log('Upload is paused');
          break;
        case firebase.storage.TaskState.RUNNING:
          console.log('Upload is running');
          break;
      }
    }, function (error) {
      console.log(error);
    }, function () {
      var downloadURL = uploadTask.snapshot.downloadURL;
      console.log('downloadURL - ' + downloadURL);
      var usermobile = window.localStorage.getItem('usermobile');
      var otherend = "CTPrfPTL0WeRVSFEXJNLA63DzuG2";
      myApp.preloader.hide();
      const buttonArr = {
        'message': {
          'sender': otherend,
          'time': firebase.database.ServerValue.TIMESTAMP,
          'attachment': {
            'type': 'image',
            'payload': {
              url: downloadURL,
            }
          }
        }
      };
      if(otherend && usermobile && buttonArr) {
        firebase.database().ref("/chat/" + otherend + "/" + usermobile + "/messages/").push(buttonArr);
        firebase.database().ref("/chat/" + usermobile + "/" + otherend + "/messages/").push(buttonArr);
        // $('.messages-content').animate({
        //   scrollTop: $('.messages-content')[0].scrollHeight
        // }, 20);
      }
    });
  }
}

function nestedMenu(id, key, title, bid) {
  console.log(id, key, title);
  var buttons = [];
  buttons.push({
    text: 'Menu',
    label: true
  });
  firebase.database().ref("srchatmenu/"+bid+"/persistent_menu/" + id + "/call_to_actions/" + key + "/call_to_actions/").once("value").then(function (menusnap) {
    if (menusnap.exists()) {
      menusnap.forEach(function (menushot) {
        if (menushot.val().type == 'nested') {
          buttons.push({
            text: menushot.val().title,
            bg: 'gray',
            color: 'white',
            onClick: function () {
              myApp.dialog.alert(menushot.val().title + ' Clicked.');
            }
          });
        } else if (menushot.val().type == 'web_url') {
          buttons.push({
            text: menushot.val().title,
            onClick: function () {
              chatLink(menushot.val().url,menushot.val().type,menushot.val().title);
              //window.open(menushot.val().url);
            }
          });
        } else {
          buttons.push({
            text: menushot.val().title,
            onClick: function () {
              myApp.dialog.alert(menushot.val().title + ' Clicked.');
            }
          });
        }
      });
      console.log(buttons);
      buttons.push({
        text: 'Go Back',
        color: 'red'
      });
      buttons['buttons'] = buttons;
      var act1 = myApp.actions.create(buttons);
      act1.open();
    }
  });
}

function locationpopup(locTitle) {
  console.log("Location Title - " + locTitle);
  if (locTitle == 'Drop Location' || locTitle == 'Drop Location.') {
    navigator.geolocation.getCurrentPosition(onSuccess2, onError, {
      timeout: 5000,
      enableHighAccuracy: true
    });
  } else {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      timeout: 5000,
      enableHighAccuracy: true
    });
  }
}

function onError(error) {
  console.log('code: ' + error.code + ', message: ' + error.message);
  myApp.preloader.hide();
  myApp.popup.close(".popup-location");
  myApp.dialog.alert(error.message);
}

function onSuccess(position) {
  var lats = position.coords.latitude;
  var longs = position.coords.longitude;
  console.log('Latitude: ' + lats + ', Longitude: ' + longs);

  var popupHTML = '<div class="popup popup-location">' +
    '<div class="block">' +
    '<form>' +
    '<p><span style="position:absolute;top:15px;left:46%;color:#74742D;">Location</span></p>' +
    '<div class="form-group" style="display:list-item;">' +
    '<input type="hidden" name="hideLat"/>' +
    '<input type="hidden" name="hideLng"/>' +
    '<input id="advanced-placepicker" data-latitude="' + lats + '" data-longitude="' + longs + '" class="form-control" data-map-container-id="collapseTwo" style="width:100%; padding:10px;margin:-10px 0px 10px -25px;" />' +
    '</div>' +
    '<div id="collapseTwo" class="collapse" style="display:block;">' +
    '<div class="another-map-class thumbnail"></div>' +
    '</div>' +
    '<div class="form-row"><div class="input-submit">' +
    '<a href="#" onClick="sendLocation();" class="button button-raised button-fill button-primary" style="margin:10px 0;">Send Location</a>' +
    '<a href="#" onClick="currentLocation();" class="button button-raised button-fill button-primary" style="margin:10px 0;"><i class="fa fa-location-arrow"></i>&nbsp;&nbsp;&nbsp;Send Current Location</a></div></div>' +
    '<p><a href="#" class="close-popup">Close</a></p>' +
    '</form>' +
    '</div>' +
    '</div>';
  myApp.popup.create(popupHTML);
  setTimeout(function () {
    $("#advanced-placepicker").each(function () {
      var target = this;
      var $collapse = $(this).parents('.form-group').next('.collapse');
      var $map = $collapse.find('.another-map-class');

      var placepicker = $(this).placepicker({
        map: $map.get(0),
        mapOptions: {
          zoom: 12,
          center: {
            lat: lats,
            lng: longs
          }
        },
        placeChanged: function (place) {
          console.log("place changed: ", place.formatted_address, this.getLocation());
          var locate = this.getLocation();
          console.log("Lat - " + locate.latitude + ", lng - " + locate.longitude);
          $("input[name=hideLat]").val(locate.latitude);
          $("input[name=hideLng]").val(locate.longitude);
        }
      }).data('placepicker');
    });
    setTimeout(function () {
      $(".pac-logo").attr("style", "z-index:11000 !important;");
    }, 500);
  }, 1000);
}

function onSuccess2(position) {
  var lats = position.coords.latitude;
  var longs = position.coords.longitude;
  //console.log('Latitude: '+lats+', Longitude: '+longs);

  var popupHTML = '<div class="popup popup-location">' +
    '<div class="block">' +
    '<form>' +
    '<p><span style="position:absolute;top:15px;left:46%;color:#74742D;">Location</span></p>' +
    '<div class="form-group" style="display:list-item;">' +
    '<input type="hidden" name="hideLat"/>' +
    '<input type="hidden" name="hideLng"/>' +
    '<input id="advanced-placepicker" data-latitude="' + lats + '" data-longitude="' + longs + '" class="form-control" data-map-container-id="collapseTwo" style="width:100%; padding:10px;margin:-10px 0px 10px -25px;" />' +
    '</div>' +
    '<div id="collapseTwo" class="collapse" style="display:block;">' +
    '<div class="another-map-class thumbnail"></div>' +
    '</div>' +
    '<div class="form-row"><div class="input-submit">' +
    '<a href="#" onClick="sendLocation();" class="button button-raised button-fill button-primary" style="margin:10px 0;">Send Location</a>' +
    '<a href="#" onClick="currentLocation();" class="button button-raised button-fill button-primary" style="margin:10px 0;"><i class="fa fa-location-arrow"></i>&nbsp;&nbsp;&nbsp;Send Current Location</a></div></div>' +
    '<p><a href="#" class="close-popup">Close</a></p>' +
    '</form>' +
    '</div>' +
    '</div>';
  myApp.popup.create(popupHTML);
  setTimeout(function () {
    $("#advanced-placepicker").each(function () {
      var target = this;
      var $collapse = $(this).parents('.form-group').next('.collapse');
      var $map = $collapse.find('.another-map-class');

      var placepicker = $(this).placepicker({
        map: $map.get(0),
        mapOptions: {
          zoom: 12,
          center: {
            lat: lats,
            lng: longs
          }
        },
        placeChanged: function (place) {
          //console.log("place changed: ", place.formatted_address, this.getLocation());
          var locate = this.getLocation();
          console.log("Lat - " + locate.latitude + ", lng - " + locate.longitude);
          $("input[name=hideLat]").val(locate.latitude);
          $("input[name=hideLng]").val(locate.longitude);
        }
      }).data('placepicker');
    });
    setTimeout(function () {
      $("#advanced-placepicker").val('');
      $("input[name=hideLat]").val('');
      $("input[name=hideLng]").val('');
      $(".pac-logo").attr("style", "z-index:11000 !important;");
    }, 800);
  }, 800);
}

function sendLocation() {
  var lat = $("input[name=hideLat]").val();
  if(lat) {
    $$(".chatmessage").val("sendlocation");
    setTimeout(function () {
      myApp.preloader.hide();
      $$("#send").click();
    }, 500);
  } else {
    myApp.dialog.alert("Please enter any address.");
  }
  //myApp.popup.close(".popup-location");
}

function currentLocation() {
  var lat = $("#advanced-placepicker").attr("data-latitude");
  if(lat) {
    $$(".chatmessage").val("currentlocation");
    setTimeout(function () {
      myApp.preloader.hide();
      $$("#send").click();
    }, 500);
  } else {
    myApp.dialog.alert("Please enter any address.");
  }
  //myApp.popup.close(".popup-location");
}

function saveArrMessage(usermobile, otherend, message) {
  //console.log("usermobile : "+usermobile+", otherend : "+otherend);
  var payloadData = {
      "sender": usermobile,
      "time": firebase.database.ServerValue.TIMESTAMP,
  };
  if(usermobile && (usermobile != undefined) && otherend && (otherend != undefined)) {
    var pushKey = firebase.database().ref("/chat/" + otherend + "/" + usermobile + "/messages/").push();
    pushKey.set(message, function (error) {
      if(!error) {
        pushKey.update(payloadData, function (error) {
          if(!error) {
            var pushKey1 = firebase.database().ref("/chat/" + usermobile + "/" + otherend + "/messages/").push();
            pushKey1.set(message, function (error) {
              if(!error) {
                pushKey1.update(payloadData, function (error) {
                  if(!error) {
                    console.log("Done (FROM saveArrMessage. Saved value inside chat node.)");
                  }
                });
              }
            });
          }
        });
      }
    });
  } else {
    //console.log("Error : Either brand id or user id or both isn't available for necessary operation.");
  }
}

function saveMessage(usermobile, otherend, newMsg) {
  var newMsg2 = new Array();
  var type = $$("#chattype").val();
  var payload = $$("#chatpayload").val();
  console.log(newMsg);
  console.log(payload);
  if(payload) {
    var payloadData = {
      "text": "payload",
      "payload": {
        "type": type,
        "title": newMsg,
        "payload": payload,
      }
    };
    newMsg2 = payloadData;
  } else {
    newMsg2['text'] = newMsg;
  }
  $$(".chatmessage").val('');
  if(usermobile && otherend) {
    var pushKey = firebase.database().ref("/chat/" + otherend + "/" + usermobile + "/messages/").push();
    pushKey.set({
      sender: usermobile,
      message: newMsg2,
      time: firebase.database.ServerValue.TIMESTAMP,
    }, function (error) {
      if(!error) {
        var pushKey1 = firebase.database().ref("/chat/" + usermobile + "/" + otherend + "/messages/").push();
        pushKey1.set({
          sender: usermobile,
          message: newMsg2,
          time: firebase.database.ServerValue.TIMESTAMP,
        }, function (error) {
          if(!error) {
            $$(".chatmessage").val('');
            $$("#chattype").val('');
            $$("#chatpayload").val('');
            // $('.messages-content').animate({
            //   scrollTop: $('.messages-content')[0].scrollHeight
            // }, 20);
          }
        });
      }
    });
  } else {
    //console.log("Error : Either brand id or user id or both isn't available for necessary operation.");
  }
}

function saveChatMessage(usermobile, otherend, driverno, newMsg) {
  var newMsg2 = new Array();
  var type = $$("#chattype").val();
  var payload = $$("#chatpayload").val();
  console.log(newMsg);
  console.log(payload);
  if(payload) {
    var payloadData = {
      "text": "payload",
      "payload": {
        "type": type,
        "title": newMsg,
        "payload": payload,
      }
    };
    newMsg2 = payloadData;
  } else {
    newMsg2['text'] = newMsg;
  }
  $$(".chatmessage").val('');
  if(usermobile && otherend) {
    var pushKey = firebase.database().ref("/directcabschat/" + otherend + "/" + usermobile + "/messages/").push();
    pushKey.set({
      sender: usermobile,
      message: newMsg2,
      time: firebase.database.ServerValue.TIMESTAMP,
    }, function (error) {
      if(!error) {
        var pushKey1 = firebase.database().ref("/directcabschat/" + usermobile + "/" + otherend + "/messages/").push();
        pushKey1.set({
          sender: usermobile,
          message: newMsg2,
          time: firebase.database.ServerValue.TIMESTAMP,
        }, function (error) {
          if(!error) {
            $$(".chatmessage").val('');
            $$("#chattype").val('');
            $$("#chatpayload").val('');
            chatNotification(usermobile, otherend, driverno, newMsg);
            // messages.scroll(100, 100);
            // $('.messages-content').animate({
            //   scrollTop: $('.messages-content')[0].scrollHeight
            // }, 20);
          }
        });
      }
    });
  } else {
    //console.log("Error : Either brand id or user id or both isn't available for necessary operation.");
  }
}

function chatNotification(riderNum, trip_id, userNum, msg) {
    console.log("chatNotification - "+msg+", "+riderNum+", "+userNum+", "+trip_id);
    $.ajax({
        url: 'https://www.socialrecharge.com/brand/firebase/chatnotification.php',
        type: 'POST',
        data: {"action":"directcabs","message":msg,"mobile":riderNum,"driverno":userNum,"tripid":trip_id},
        success: function (data)
        {
          //var result = JSON.parse(data);
          console.log(data);
        }
    });
}

function getDistance(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function chatNewsLink(payload, type, title, bid) {
  console.log('Inside chatNewsLink function.');
  console.log('Payload:',payload); console.log('Type:',type); console.log('Title:',title);
  var usermobile = window.localStorage.getItem('usermobile');
  myApp.preloader.show();
  var dateTime = $.timeago(new Date());
  var userImage = window.localStorage.getItem("userimage");
  var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/; // fragment locater
  if (!pattern.test(payload)) {
    console.log("Word : " + payload);
    if((payload.toLowerCase().indexOf("joke") >= 0) || (payload.toLowerCase().indexOf("video") >= 0) || (payload.toLowerCase().indexOf("qoute") >= 0)) {
      console.log("payload :", payload);
      var titleName = payload.split("_");
      var message = "You want to read "+titleName[0]+" of the day..";
      myApp.preloader.hide();
      var newsSentMessages = '<div class="messages-title"><span>'+dateTime+'</span></div>'+
        '<div class="message message-sent" style="max-width:98%;">'+
        '<div class="message-avatar" style="background-image:url('+userImage+'); opacity:1;"></div>'+
        '<div class="message-content"><div class="message-bubble">'+
        '<div class="message-text">READ</div>'+
        '</div></div>'+
        '</div>';
      $$(".daily_fun").append(newsSentMessages);
      saveMessage(usermobile, bid, 'READ');
      setTimeout(function(){
        oldReceviedMsg = '<div class="message message-last message-received" style="max-width:90%; display:-webkit-inline-box;">'+
          '<div class="message-avatar" style="background-image:url('+userImage+')"></div>'+
          '<div class="message-content">'+
          '<div class="message-name" style="display:block;">Social</div>'+
          '<div class="message-bubble">'+
          '<div class="message-text">'+message+'</div>'+
          '</div></div>'+
          '</div>';
        $$(".daily_fun").append(oldReceviedMsg);
        saveMessage(bid, usermobile, message);
        myApp.preloader.hide();
      }, 2000);
    } else if(payload.toLowerCase().indexOf("upi") >= 0) {
      window.open(payload, '_system');
      myApp.preloader.hide();
    } else if(payload.toLowerCase().indexOf("direct_ride_request") >= 0) {
      var value = payload.split("_");
      var reqTime = new Date(value[4]*1000);
      console.log(value[4]+", Req Time : "+reqTime);
      var currTime = new Date();
      currTime.setMinutes(currTime.getMinutes() - 10);
      console.log("currTime : "+currTime);
      if(reqTime < currTime) {
        myApp.preloader.hide();
        $(".cabswipe").css("display","none");
        var newsSentMessages = '<ul><li><a href="#" class="item-link item-content">'+
        '<div class="item-media"><img src="img/exp.png" width="40" style="border-radius:50%;"></div>'+
        '<div class="item-inner"><div class="item-title">This request has expired.</div>'+
        '</div></a></li></ul>';
        $$(".cabs").html(newsSentMessages);
        $(".ride_cont").css("display","block");
      } else {
        // var newsSentMessages = '<div class="messages-title"><span>'+dateTime+'</span></div>'+
        //   '<div class="message message-sent" style="max-width:98%;">'+
        //   '<div class="message-avatar" style="background-image:url(img/route.png); opacity:1;"></div>'+
        //   '<div class="message-content"><div class="message-bubble">'+
        //   '<div class="message-text">Finding best route for you</div>'+
        //   '</div></div>'+
        //   '</div>';
        
        $(".cabswipe").css("display","none");
        var newsSentMessages = '<ul><li><a href="#" class="item-link item-content">'+
        '<div class="item-media"><img src="img/route.gif" width="40" style="border-radius:50%;"></div>'+
        '<div class="item-inner"><div class="item-title">Finding best route for you</div>'+
        '</div></a></li></ul>';
        $$(".cabs").html(newsSentMessages);
        //saveMessage(usermobile, bid, 'Finding best route for you');
        setTimeout(function(){
          $.ajax({
            url: "https://www.socialrecharge.com/brand/firebase/sr_driver_price.php",
            type: "POST",
            data: {payloaddata:payload, mobile:usermobile},
            dataType: 'json',
            cache: false,
            success: function(result) {
              if(result){
                //var data = JSON.parse(result);
                myApp.preloader.hide();
                console.log(usermobile+", "+bid);
                saveArrMessage(bid, usermobile, result);
                // var messageT = result.message;
                // console.log("Message is : ", messageT);
                // msgAttach = messageT.attachment;
              }
            },
            error: function(error){
              console.log(error);
              myApp.preloader.hide();
              myApp.dialog.alert("There is some error!");
            }
          });
        }, 1000);
      }
    } else if(payload.toLowerCase().indexOf("ride_terminate") >= 0) {
      console.log("ride_terminate");
      var value = payload.split("_");
      var tripkey = value[2];
      var userNum = value[3];
      var riderNum = value[4];
      console.log(userNum+""+riderNum);
      myApp.preloader.hide();
      myApp.dialog.confirm("Are you sure? you are going to decline ride request!", function(){
        myApp.preloader.show();
        firebase.database().ref("sr_driver/"+userNum+"/trips/"+tripkey+"/status").once("value", function (drsnap) {
          console.log(drsnap.val());
          if(drsnap.val() != 'stopped' && drsnap.val() != 'rejected') {
            var rejectDate = new Date().getFullYear()+"-"+(new Date().getMonth()+1)+"-"+new Date().getDate()+" "+new Date().getHours()+":"+new Date().getMinutes()+":"+new Date().getSeconds();
            console.log("Rejection time :",rejectDate);
            var dStat = 'free';
            firebase.database().ref("sr_driver/"+userNum+"/profile/driver_status").transaction(function(driverStat) {
                return dStat;
            });
            var directTripRef = firebase.database().ref("/direct_trips/"+tripkey);
            firebase.database().ref("sr_driver/"+userNum+"/trips/"+tripkey)
            .update({
              status: "rejected",
              reject_time: rejectDate,
              reject_timestamp: firebase.database.ServerValue.TIMESTAMP,
            }, function(error){
              if(!error){
                directTripRef.child("/requestd_drivers/"+userNum)
                .update({
                  status: "rejected",
                  reject_time: rejectDate,
                  reject_timestamp: firebase.database.ServerValue.TIMESTAMP,
                }, function(error){
                  if(!error){
                    firebase.database().ref("chatfbuser/"+riderNum+"/trips/"+tripkey+"/requestd_drivers/"+userNum)
                    .update({
                      status: "rejected",
                      reject_time: rejectDate,
                      reject_timestamp: firebase.database.ServerValue.TIMESTAMP,
                    }, function(error){
                      if(!error) {
                        console.log("User rejected ride request.");
                        $.ajax({
                          url: 'https://www.socialrecharge.com/brand/firebase/tripstatus.php',
                          type: 'POST',
                          data: {"action":'ride_cancelled',"mobile":riderNum,"driverno":userNum,"tripid":tripkey},
                          success: function (data)
                          {
                            var result = JSON.parse(data);
                            console.log(result);
                            saveArrMessage('cabs', riderNum, result.success);
                            $(".ride_cont").css("display","block");
                            $(".ride_ongoing").css("display","none");
                            map.cleanRoute();
                            firebase.database().ref("sr_driver/"+userNum+"/profile/driver_status").off("value");
                            trackClose();
                          }
                        });
                        myApp.preloader.hide();
                      }
                    });
                  } else {
                    console.error("Direct trip rejection updation error. Error is :", error);
                    myApp.preloader.hide();
                  }
                });
              } else {
                console.error("Driver trip rejection updation error. Error is :",error);
                myApp.preloader.hide();
              }
            });
          } else {
            myApp.dialog.alert("This ride is already completed.");
            myApp.preloader.hide();
            $(".locationform").css("display","none");
            $(".ride_ongoing").css("display","none");
            $(".ride_cont").css("display","none");
            firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
              if(ridesnap.val().ride == true){
                $(".firstdiv").css("display","block");
              } else {
                $(".firstdivscan").css("display","block");
              }
            });
            $$(".cabs").hide();
          }
        });
      }, function(){
        myApp.preloader.hide();
      });
    } else if(payload.toLowerCase().indexOf("ride_stop") >= 0) {
      console.log("ride_stop");
      var value = payload.split("_");
      var drKey = value[2];
      var userNum = value[3];
      var riderNum = value[4];
      var pickLoc = value[5];
      var pickLocArray = pickLoc.split(",");
      console.log(userNum+", "+riderNum);
      console.log("pickLoc :", pickLoc);
      myApp.preloader.hide();
      myApp.dialog.confirm("Are you sure? you are going to stop this ride.", function(){
        var dStat = 'free';
        myApp.preloader.show();
        firebase.database().ref("direct_trips/"+drKey+"/requestd_drivers/"+userNum+"/status").once("value").then(function(usertripsnap){
          console.log(usertripsnap.val());
          if(usertripsnap.val() != "stopped") {
            firebase.database().ref("sr_driver/"+userNum+"/profile/driver_status").transaction(function(driverStat) {
                return dStat;
            });
            firebase.database().ref("sr_driver/"+userNum+"/lifetimeTrip").transaction(function(lifetimeSnap) {
                return lifetimeSnap + 1;
            });
            var rentalFee = '';
            firebase.database().ref("rentalfee/").once("value").then(function(rentsnap){
              rentalFee = rentsnap.val();
            });
            cordova.plugins.locationServices.geolocation.getCurrentPosition(function(locationCurr) {
              console.log("Succesfully retreived our GPS position, we can now start our background tracker.");
              var latLong = locationCurr.coords.latitude+","+locationCurr.coords.longitude;
              //console.log(latLong);
              var directTripRef = firebase.database().ref("/direct_trips/"+drKey);
              directTripRef.once("value").then(function(directtrip){
                firebase.database().ref("direct_trips/"+drKey+"/drivers/"+userNum).once("value").then(function(tripsnap){
                  var dToPick = tripsnap.val().driver_to_pickup_fare;
                  var pickToDrop = tripsnap.val().total;
                  
                  var price = tripsnap.val().km_price;
                  
                  $.ajax({                    
                    url: 'https://www.socialrecharge.com/brand/firebase/sr_directcabs.php',
                    type: 'POST',
                    data: {"action":'distancematrix',"origins": pickLoc,"destinations":latLong},
                    // crossDomain: true,
                    // dataType: 'jsonp',
                    success: function (result)
                    {
                      var data = JSON.parse(result);
                      
                      var distanceVal = data.rows[0].elements[0].distance.value;
                      var durationVal = data.rows[0].elements[0].duration.value;
                      var distanced = distanceVal/1000;
                      var durationd = durationVal/60;
                      //var total_fare = (parseFloat(distanced)*price+parseInt(durationd));
                      if(distanced<=2)
                      {
                        var total_fare1 = 50;
                      } else {
                        var total_fare1 = (50+(parseFloat(distanced)-2)*price+parseInt(durationd));
                      }
                      var total = parseFloat(dToPick+total_fare1);
                      var total_f = parseInt(total);                      

                      var currentdate = new Date(); 
                      var datetime = currentdate.getHours()+":"+currentdate.getMinutes()+":"+currentdate.getSeconds();
                      
                      if(datetime <= '23:00:00' || datetime >= '05:00:00') {
                      
                        var fareTax = Math.round((total_f * 6)/100);
                        console.log(fareTax);
                        var totalFare = Math.round(total_f + fareTax);
                      } else {
                      
                        var fareTaxNight = Math.round((total_f * 6)/100);
                      
                        var totalFareNight = Math.round(total_f + fareTaxNight);
                        var fareTax = Math.round((totalFareNight * 25)/100);
                        var totalFare = Math.round(totalFareNight + fareTax);
                      }
                      
                      var stopLatLong = directtrip.val().drop_latlong;
                      
                      var dropLatLong = stopLatLong.split(",");
                      var lat1 = locationCurr.coords.latitude;
                      var lat2 = dropLatLong[0];
                      var lon1 = locationCurr.coords.longitude;
                      var lon2 = dropLatLong[1];
                      var dist = getDistance(lat1,lon1,lat2,lon2).toFixed(2);
                      
                      var distMeter = dist*1000;
                      
                      if(distMeter < 100) {
                        totalFare = pickToDrop;
                      } else {
                        totalFare = totalFare;
                      }

                      var accept_date = new Date().getFullYear()+"-"+(new Date().getMonth()+1)+"-"+new Date().getDate();
                      firebase.database().ref("sr_driver/"+userNum+"/trips/")
                      .orderByChild("accept_date").startAt(accept_date).endAt(accept_date)
                      .once("value", function(tripdaysnap){
                        // console.log("RentalFee - "+rentalFee);
                        // console.log("tripdaysnap child - "+tripdaysnap.numChildren());
                        // if(tripdaysnap.numChildren() > 1) {
                        //   total_f = total_f;
                        // } else {
                        //   total_f = parseInt(total_f - rentalFee);
                        //   console.log("after tripdaysnap total fare - "+total_f);
                        //   var timestamp = new Date().getTime();
                        //   firebase.database().ref("rental_earnings/totalEarnings").once("value").then(function(drearnsnap) {
                        //     //console.log(drearnsnap.exists());
                        //     var totalSREarn = parseInt(rentalFee + drearnsnap.val());
                        //     console.log("totalSREarn - "+totalSREarn);
                        //     firebase.database().ref("rental_earnings/").update({
                        //       totalEarnings: totalSREarn
                        //     }, function(error){
                        //       if(!error){
                        //         firebase.database().ref("rental_earnings/"+timestamp).set({
                        //           amount: rentalFee,
                        //           mobile: userNum,
                        //           timestamp: firebase.database.ServerValue.TIMESTAMP,
                        //           '.priority': firebase.database.ServerValue.TIMESTAMP
                        //         }, function(error){
                        //           if(!error){
                        //             console.log("Succesfully added in rental_earnings.");
                        //           }
                        //         });
                        //       }
                        //     });
                        //   });
                        // }

                        var payFare = 0;
                        var regDate = (new Date().getDate())+"-"+(new Date().getMonth()+1)+"-"+(new Date().getFullYear());
                        firebase.database().ref("users_credit/"+riderNum+"/total").once("value").then(function(usersnap){
                          
                          if( usersnap.exists() && (usersnap.val()>=100) ) {
                            
                            var usercredit = usersnap.val();
                            if(totalFare <= 100) {
                              usercredit = totalFare;
                              payFare = 0;
                            } else {
                              usercredit = 100;
                              payFare = (totalFare - usercredit);
                            }
                            var pushKey = firebase.database().ref("users_credit/"+riderNum);
                            pushKey.push({        
                              amount:100,
                              type:"debit",
                              desc:"accept ride",
                              date:regDate,
                              timestamp: firebase.database.ServerValue.TIMESTAMP,
                              '.priority': firebase.database.ServerValue.TIMESTAMP
                            }, function (error) {
                              if(!error) {
                                pushKey.child('total').once('value', function(totalsnap){
                                  pushKey.update({
                                    "total": (totalsnap.val() - 100)
                                  }, function (error) {
                                    if(!error) {
                                      firebase.database().ref("driver_free_credit/"+userNum+"/total").once("value").then(function(freecrsnap){
                                        console.log(freecrsnap.exists()+", freecrsnap val :", freecrsnap.val());
                                        if(freecrsnap.exists()) {
                                          var pushKey1 = firebase.database().ref("driver_free_credit/"+userNum);
                                          pushKey1.push({        
                                            rides:1,
                                            type:"debit",
                                            desc:"ride complete",
                                            date:regDate,
                                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                                            '.priority': firebase.database.ServerValue.TIMESTAMP
                                          }, function (error) {
                                            if(!error) {
                                              pushKey1.update({"total": (freecrsnap.val()+1)}, function (error) {
                                                if(!error) {
                                                  console.log("Succesfully Updated Rides.");
                                                }
                                              });
                                            }
                                          });
                                        }
                                        if(freecrsnap.val() > 0) {
                                          var pushKey = firebase.database().ref("driver_license_credit/"+userNum);
                                          pushKey.push({        
                                            amount:100,
                                            type:"credit",
                                            desc:"ride credit",
                                            date:regDate,
                                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                                            '.priority': firebase.database.ServerValue.TIMESTAMP
                                          }, function (error) {
                                            if(!error) {
                                              pushKey.child('total').once('value', function(totalsnap){
                                                pushKey.update({"total": (totalsnap.val() + 100)}, function (error) {
                                                  if(!error) {
                                                    console.log("Succesfully Updated Rides.");
                                                  }
                                                });
                                              });
                                            }
                                          });
                                        }
                                      });
                                    }
                                  });
                                });
                              }
                            });
                          } else {
                            usercredit = 0;
                            payFare = totalFare;
                          }
                          console.log("User Credit :", usercredit+", Total Fare : "+totalFare);
                          var stopDate = new Date().getFullYear()+"-"+(new Date().getMonth()+1)+"-"+new Date().getDate()+" "+new Date().getHours()+":"+new Date().getMinutes()+":"+new Date().getSeconds();
                          firebase.database().ref("sr_driver/"+userNum+"/trips/"+drKey)
                          .update({
                            status: "stopped",
                            //earnings: total_f,
                            credit_fare: usercredit,
                            updated_fare: totalFare,
                            pay_fare: payFare,
                            stopAt: latLong,
                            stop_time: stopDate,
                            stop_timestamp: firebase.database.ServerValue.TIMESTAMP,
                          }, function(error) {
                            if(!error){
                              directTripRef.child("/requestd_drivers/"+userNum)
                              .update({
                                status: "stopped",
                                //earnings: total_f,
                                credit_fare: usercredit,
                                updated_fare: totalFare,
                                pay_fare: payFare,
                                stopAt: latLong,
                                stop_time: stopDate,
                                stop_timestamp: firebase.database.ServerValue.TIMESTAMP,
                              }, function(error) {
                                if(!error){
                                  firebase.database().ref("chatfbuser/"+riderNum+"/trips/"+drKey+"/requestd_drivers/"+userNum)
                                  .update({
                                    status: "stopped",
                                    //earnings: total_f,
                                    credit_fare: usercredit,
                                    updated_fare: totalFare,
                                    pay_fare: payFare,
                                    stopAt: latLong,
                                    stop_time: stopDate,
                                    stop_timestamp: firebase.database.ServerValue.TIMESTAMP,
                                  }, function(error) {
                                    if(!error) {
                                      firebase.database().ref("chatfbuser/"+riderNum+"/trips/"+drKey).update({
                                        status: "stopped",
                                        stop_timestamp: firebase.database.ServerValue.TIMESTAMP,
                                      }, function(error) {
                                        if(!error) {
                                          firebase.database().ref("sr_driver/"+userNum+"/totalEarnings").once("value").then(function(earnsnap) {
                                            var totalEarn = parseInt(total_f + earnsnap.val());
                                            console.log("totalEarn - "+totalEarn);
                                            firebase.database().ref("sr_driver/"+userNum).update({
                                              totalEarnings: totalEarn
                                            }, function(error){
                                              if(!error){
                                                myApp.preloader.hide();
                                                $.ajax({
                                                  url: 'https://www.socialrecharge.com/brand/firebase/tripstatus.php',
                                                  type: 'POST',
                                                  data: {"action":'ride_completed',"mobile":riderNum,"driverno":userNum,"tripid":drKey},
                                                  success: function (data)
                                                  {
                                                    var result = JSON.parse(data);
                                                    console.log(result);
                                                    saveArrMessage('cabs', riderNum, result.success);
                                                    map.cleanRoute();
                                                    window.localStorage.setItem("tripstatus", "stopped");
                                                    $(".ride_cont").css("display","none");
                                                    $(".ride_ongoing").css("display","none");
                                                    firebase.database().ref("sr_driver/"+userNum+"/profile/driver_status").off("value");
                                                    trackClose();
                                                  }
                                                });
                                              }
                                            });
                                          });
                                        }
                                      });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        });
                      });
                    }
                  });
                });
              });
            }, onError);
          } else {
            myApp.preloader.hide();
            myApp.dialog.alert("Ride is already stopped.");
            $(".locationform").css("display","none");
            $(".ride_ongoing").css("display","none");
            $(".ride_cont").css("display","none");
            firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
              if(ridesnap.val().ride == true){
                $(".firstdiv").css("display","block");
              } else {
                $(".firstdivscan").css("display","block");
              }
            });
            $$(".cabs").hide();
          }
        });
      }, function(){
        myApp.preloader.hide();
      });
    } else if(payload.toLowerCase().indexOf("completeride") >= 0) {
      var value = payload.split("_");
      console.log(value[2]+", DR No.- "+value[3]);
      firebase.database().ref("sr_driver/"+value[3]+"/trips/"+value[2]+"/rating").once("value").then(function(ratesnap){
        if(ratesnap.exists()) {
          myApp.preloader.hide();
          myApp.dialog.alert("You have already rated this trip.");
          $(".locationform").css("display","none");
          $(".ride_ongoing").css("display","none");
          $(".ride_cont").css("display","none");
          $$(".cabs").hide();
          firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
            if(ridesnap.val().ride == true){
              $(".firstdiv").css("display","block");
            } else {
              $(".firstdivscan").css("display","block");
            }
          });
          map.cleanRoute();
        } else {
          myApp.preloader.show();
          $.ajax({
              url: 'https://www.socialrecharge.com/brand/firebase/rating.php',
              type: 'POST',
              data: {"action":'rating',"payload":payload},
              success: function (data)
              {
                myApp.preloader.hide();
                console.log('Success data:', data);
                console.log('Success data, JSONSTRINGIFY:', JSON.stringify(data));
                var result = JSON.parse(data);
                saveArrMessage('cabs', usermobile, result.success);
                if(value[1]==5){
                  myApp.preloader.hide();
                  $(".locationform").css("display","none");
                  $(".ride_ongoing").css("display","none");
                  $(".ride_cont").css("display","block");
                  $(".firstdiv").css("display","none");
                  map.cleanRoute();
                  // $.ajax({
                  //   url: 'https://www.socialrecharge.com/brand/firebase/sr_directcabs.php',
                  //   //url: 'https://srdirectcabs.herokuapp.com/srchat/direct',
                  //   type: 'POST',
                  //   data: {"action":'direct',"mobile": usermobile,"payload":payload},
                  //   success: function (result) {
                  //     if(result) {
                  //       myApp.preloader.hide();
                  //       var messageT = result.message;
                  //       var directdata = JSON.parse(result);
                  //       saveArrMessage('cabs', usermobile, directdata);
                  //     }
                  //   }
                  // });
                }
              },
              error: function(error){
                console.log(error);
                myApp.preloader.hide();
                myApp.dialog.alert("There is some error! Please try again.");
              }
          });
        }
      });
    } else if(payload.toLowerCase().indexOf("completerreason") >= 0) {
      var value = payload.split("_");
      console.log(value[1]+", DR No.- "+value[3]);
      if(value[1]){
        firebase.database().ref("sr_driver/"+value[3]+"/trips/"+value[2]+"/ratereason").once("value").then(function(ratesnap){
        if(ratesnap.exists()) {
          myApp.preloader.hide();
          myApp.dialog.alert("You have already rated this trip.");
          $(".locationform").css("display","none");
          $(".ride_ongoing").css("display","none");
          $(".ride_cont").css("display","none");
          cabsheet.close();
          firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
            if(ridesnap.val().ride == true){
              $(".firstdiv").css("display","block");
            } else {
              $(".firstdivscan").css("display","block");
            }
          });
          map.cleanRoute();
        } else {
            firebase.database().ref('sr_driver/'+value[3]+'/trips/'+value[2]).update({
              ratereason:value[1]
            },function(error){                           
              if(!error){
                firebase.database().ref('sr_driver/'+value[3]+'/ratereason/'+value[1]).transaction(function(reason){
                  return reason+1; 
                },function(error,committed,snapshot){
                  if(error){
                    console.log('Transaction failed abnormally!', error);
                  }else if(!committed){
                    console.log('We aborted the transaction');
                  }else{
                    myApp.preloader.hide();
                    $(".locationform").css("display","none");
                    $(".ride_ongoing").css("display","none");
                    $(".ride_cont").css("display","none");
                    cabsheet.close();
                    firebase.database().ref('apppermission/directcabs/').once('value').then(function(ridesnap){
                      if(ridesnap.val().ride == true){
                        $(".firstdiv").css("display","block");
                      } else {
                        $(".firstdivscan").css("display","block");
                      }
                    });
                    map.cleanRoute();
                    // $.ajax({
                    //   url: 'https://www.socialrecharge.com/brand/firebase/sr_directcabs.php',
                    //   //url: 'https://srdirectcabs.herokuapp.com/srchat/direct',
                    //   type: 'POST',
                    //   data: {"action":'direct',"mobile": usermobile,"payload":payload},
                    //   success: function (result) {
                    //     if(result) {
                    //       myApp.preloader.hide();
                    //       var messageT = result.message;
                    //       var directdata = JSON.parse(result);
                    //       saveArrMessage('cabs', usermobile, directdata);
                    //     }
                    //   }
                    // });
                  }
                });
              }
            });
          }
        });
      }
    } else if(payload.toLowerCase().indexOf("ride") >= 0) {
      //mainView.router.navigate("/");
      myApp.preloader.hide();
      rideContinue();
    } else if(payload.toLowerCase().indexOf("chat") >= 0) {
      myApp.preloader.hide();
      var value = payload.split("_");
      var tripId = value[1];
      var drNum = value[2];
      var userNum = value[3];
      mainView.router.navigate("/directchat/"+tripId+"/"+userNum+"/"+drNum+"/");
    } else if(payload.toLowerCase().indexOf("track") >= 0) {
      myApp.preloader.hide();
      var value = payload.split("_");
      console.log(value[1]+", Trip Id : "+value[2]);
      track(value[1],value[2]);
    } else if(payload.toLowerCase().indexOf("unsubscribe") >= 0) {
      var titleName = payload.split("_");
      var message = "You have successfully unsubscribed for "+titleName[2];
      console.log(message);
      myApp.preloader.hide();
      var newsSentMessages = '<div class="messages-title"><span>'+dateTime+'</span></div>'+
        '<div class="message message-sent" style="max-width:98%;">'+
        '<div class="message-avatar" style="background-image:url('+userImage+'); opacity:1;"></div>'+
        '<div class="message-content"><div class="message-bubble">'+
        '<div class="message-text">UNSUBSCRIBE</div>'+
        '</div></div>'+
        '</div>';
      $$(".chatnews").append(newsSentMessages);
      saveMessage(usermobile, bid, 'UNSUBSCRIBE');
      setTimeout(function(){
        window.FirebasePlugin.unsubscribe(titleName[2]);
        oldReceviedMsg = '<div class="message message-last message-received" style="max-width:90%; display:-webkit-inline-box;">'+
          '<div class="message-avatar" style="background-image:url('+userImage+')"></div>'+
          '<div class="message-content">'+
          '<div class="message-name" style="display:block;">Social</div>'+
          '<div class="message-bubble">'+
          '<div class="message-text">'+message+'</div>'+
          '</div></div>'+
          '</div>';
        $$(".chatnews").append(oldReceviedMsg);
        saveMessage(bid, usermobile, message);
        myApp.preloader.hide();
      }, 2000);
    } else if(payload.toLowerCase().indexOf("subscribe") >= 0) {
      var titleName = payload.split("_");
      var message = "You have successfully subscribed for "+titleName[2];
      console.log(message);
      myApp.preloader.hide();
      var newsSentMessages = '<div class="messages-title"><span>'+dateTime+'</span></div>'+
        '<div class="message message-sent" style="max-width:98%;">'+
        '<div class="message-avatar" style="background-image:url('+userImage+'); opacity:1;"></div>'+
        '<div class="message-content"><div class="message-bubble">'+
        '<div class="message-text">SUBSCRIBE</div>'+
        '</div></div>'+
        '</div>';
      $$(".chatnews").append(newsSentMessages);
      saveMessage(usermobile, bid, 'SUBSCRIBE');
      setTimeout(function(){
        window.FirebasePlugin.subscribe(titleName[2]);
        oldReceviedMsg = '<div class="message message-last message-received" style="max-width:90%; display:-webkit-inline-box;">'+
          '<div class="message-avatar" style="background-image:url('+userImage+')"></div>'+
          '<div class="message-content">'+
          '<div class="message-name" style="display:block;">Social</div>'+
          '<div class="message-bubble">'+
          '<div class="message-text">'+message+'</div>'+
          '</div></div>'+
          '</div>';
        $$(".chatnews").append(oldReceviedMsg);
        saveMessage(bid, usermobile, message);
        myApp.preloader.hide();
      }, 2000);
    } else if(payload.toLowerCase().indexOf("country") >= 0) {
      var countryName = payload.split("_");
      var newsSentMessages = '<div class="messages-title"><span>'+dateTime+'</span></div>'+
        '<div class="message message-sent" style="max-width:98%;">'+
        '<div class="message-avatar" style="background-image:url('+userImage+'); opacity:1;"></div>'+
        '<div class="message-content"><div class="message-bubble">'+
        '<div class="message-text">'+title+'</div>'+
        '</div></div>'+
        '</div>';
      $$(".chatnews").append(newsSentMessages);
      saveMessage(usermobile, bid, title);
      myApp.preloader.hide();
      $.ajax({
        url: 'https://fierce-castle-11763.herokuapp.com/srchat/read',
        //url: 'https://5b55fcab.ngrok.io/srchat/read',
        type: 'POST',
        data: {
          "mobile": usermobile,
          "text": payload,
          "country": countryName[3]
        },
        success: function (data) {
          //console.log(data);
          if(data) {
            saveArrMessage(bid, usermobile, data);
            var messageT = data.message;
            console.log("Message is : ", messageT);
            msgAttach = messageT.attachment;
            if(msgAttach) {
              element = msgAttach.payload.elements;
              console.log(msgAttach.payload.image_aspect_ratio);
              if(msgAttach.payload.image_aspect_ratio == 'square') {
                var imgRatio = 'height: 80vw;';
              } else {
                var imgRatio = 'height: 40vw;';
              }
              if(element) {
                myMsg = '<div class="swiper-container2 swiper-2" style="overflow:scroll;">' +
                  '<div class="swiper-wrapper">';
                $.each(element, function (i) {
                  //console.log(element[i].title);
                  if(element.length == 1) {
                    var headClass = 'card-header-first';
                    var cardFirst = '';
                    var swiperMid = '';
                    var swipeNew = 'margin-right:1% !important;';
                    var cardOne = 'border-radius:25px;width:100%;';
                    var headOne = 'border-radius:25px 25px 0px 0px !important;';
                  } else if(i == 0) {
                    var headClass = 'card-header-first';
                    var cardFirst = '';
                    var swiperMid = '';
                    var swipeNew = 'margin-right:1% !important;';
                    var cardOne = 'border-radius: 25px 0px 0px 25px;width:80%;';
                    var headOne = '';
                  } else if(i == (element.length - 1)) {
                    var headClass = 'card-header-last';
                    var cardFirst = 'card-last';
                    var swiperMid = 'swiper-slide-mid';
                    var swipeNew = 'margin-right:-15% !important;';
                    var cardOne = 'border-radius: 25px 0px 0px 25px;width:80%;';
                    var headOne = '';
                  } else {
                    var headClass = 'card-header-mid';
                    var cardFirst = 'card-first';
                    var swiperMid = 'swiper-slide-mid';
                    var swipeNew = 'margin-right:-15% !important;';
                    var cardOne = 'border-radius: 25px 0px 0px 25px;width:80%;';
                    var headOne = '';
                  }
                  myMsg += '<div class="swiper-slide ' + swiperMid + '" style="width:85% !important;' + swipeNew + '">' +
                    '<div class="card ' + cardFirst + ' demo-card-header-pic" style="' + cardOne + 'left:6%;float:left;">' +
                    '<div style="background-image:url(' + element[i].image_url + ');' + headOne + ' ' + imgRatio + '" valign="bottom" class="card-header ' + headClass + ' color-white no-border"></div>' +
                    '<div class="card-content card-content-padding" style="min-height:100px;">' +
                    '<p class="color-gray"><b>' + (element[i].title).substr(0, 40) + '...</b></p>';
                  if(element[i].subtitle) {
                    myMsg += '<p>' + (element[i].subtitle).substr(0, 100) + '...</p>';
                  }
                  myMsg += '</div>' +
                    '<div class="card-footer">';
                  var eleButton = element[i].buttons;
                  if(eleButton) {
                    //myMsg+= '<a href="#" class="link">&nbsp;</a>';
                    $.each(eleButton, function (j) {
                      //console.log(element[i].buttons[j].title);
                      if(element[i].buttons[j].type == 'web_url') {
                        var str = "'" + element[i].buttons[j].url + "'";
                        var blank = "''";
                        myMsg += '<a href="#" class="link" onClick="chatNewsLink(' + str + ',' + blank + ',' + blank + ');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                      } else if(element[i].buttons[j].type == 'phone_number') {
                        myMsg += '<a href="tel:' + element[i].buttons[j].payload + '" class="link external" style="text-transform:uppercase;display:inline-table;">' + element[i].buttons[j].title + '</a>';
                      } else if(element[i].buttons[j].type == 'postback') {
                        var pLoad = "'" + element[i].buttons[j].payload + "'";
                        var pType = "'" + element[i].buttons[j].type + "'";
                        var pTitle = "'" + element[i].buttons[j].title + "'";
                        myMsg += '<a href="#" class="link" onClick="chatNewsLink(' + pLoad + ',' + pType + ',' + pTitle + ');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                      }
                    });
                  }
                  myMsg += '</div>' +
                    '</div></div>';
                });
                myMsg += '</div>' +
                  //'<div class="swiper-pagination" style="position:relative;bottom:20px;"></div>'+
                  '</div>';
                $$(".chatnews").append(myMsg);
                myApp.preloader.hide();
              } else {
                myApp.dialog.alert("Elements not Found.!");
                myApp.preloader.hide();
              }
            }
          }
        }
      });
    } else {
      var newsSentMessages = '<div class="messages-title"><span>'+dateTime+'</span></div>'+
        '<div class="message message-sent" style="max-width:98%;">'+
        '<div class="message-avatar" style="background-image:url('+userImage+'); opacity:1;"></div>'+
        '<div class="message-content"><div class="message-bubble">'+
        '<div class="message-text">'+title+'</div>'+
        '</div></div>'+
        '</div>';
      $$(".chatnews").append(newsSentMessages);
      saveMessage(usermobile, bid, title);
      myApp.preloader.hide();
      $.ajax({
        url: 'https://fierce-castle-11763.herokuapp.com/srchat/read',
        //url: 'https://5b55fcab.ngrok.io/srchat/read',
        type: 'POST',
        data: {
          "mobile": usermobile,
          "text": payload,
        },
        success: function (data) {
          if(data) {
            saveArrMessage(bid, usermobile, data);
            var messageT = data.message;
            console.log("Message is : ", messageT);
            msgAttach = messageT.attachment;
            if(msgAttach) {
              element = msgAttach.payload.elements;
              console.log(msgAttach.payload.image_aspect_ratio);
              if(msgAttach.payload.image_aspect_ratio == 'square') {
                var imgRatio = 'height: 80vw;';
              } else {
                var imgRatio = 'height: 40vw;';
              }
              if(element) {
                myMsg = '<div class="swiper-container2 swiper-2" style="overflow:scroll;">' +
                  '<div class="swiper-wrapper">';
                $.each(element, function (i) {
                  //console.log(element[i].title);
                  if(element.length == 1) {
                    var headClass = 'card-header-first';
                    var cardFirst = '';
                    var swiperMid = '';
                    var swipeNew = 'margin-right:1% !important;';
                    var cardOne = 'border-radius:25px;width:100%;';
                    var headOne = 'border-radius:25px 25px 0px 0px !important;';
                  } else if(i == 0) {
                    var headClass = 'card-header-first';
                    var cardFirst = '';
                    var swiperMid = '';
                    var swipeNew = 'margin-right:1% !important;';
                    var cardOne = 'border-radius: 25px 0px 0px 25px;width:80%;';
                    var headOne = '';
                  } else if(i == (element.length - 1)) {
                    var headClass = 'card-header-last';
                    var cardFirst = 'card-last';
                    var swiperMid = 'swiper-slide-mid';
                    var swipeNew = 'margin-right:-15% !important;';
                    var cardOne = 'border-radius: 25px 0px 0px 25px;width:80%;';
                    var headOne = '';
                  } else {
                    var headClass = 'card-header-mid';
                    var cardFirst = 'card-first';
                    var swiperMid = 'swiper-slide-mid';
                    var swipeNew = 'margin-right:-15% !important;';
                    var cardOne = 'border-radius: 25px 0px 0px 25px;width:80%;';
                    var headOne = '';
                  }
                  myMsg += '<div class="swiper-slide ' + swiperMid + '" style="width:85% !important;' + swipeNew + '">' +
                    '<div class="card ' + cardFirst + ' demo-card-header-pic" style="' + cardOne + 'left:6%;float:left;">' +
                    '<div style="background-image:url(' + element[i].image_url + ');' + headOne + ' ' + imgRatio + '" valign="bottom" class="card-header ' + headClass + ' color-white no-border"></div>' +
                    '<div class="card-content card-content-padding" style="min-height:100px;">' +
                    '<p class="color-gray"><b>' + (element[i].title).substr(0, 40) + '...</b></p>';
                  if(element[i].subtitle) {
                    myMsg += '<p>' + (element[i].subtitle).substr(0, 100) + '...</p>';
                  }
                  myMsg += '</div>' +
                    '<div class="card-footer">';
                  var eleButton = element[i].buttons;
                  if(eleButton) {
                    //myMsg+= '<a href="#" class="link">&nbsp;</a>';
                    $.each(eleButton, function (j) {
                      //console.log(element[i].buttons[j].title);
                      if(element[i].buttons[j].type == 'web_url') {
                        var str = "'" + element[i].buttons[j].url + "'";
                        var blank = "''";
                        myMsg += '<a href="#" class="link" onClick="chatNewsLink(' + str + ',' + blank + ',' + blank + ');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                      } else if(element[i].buttons[j].type == 'phone_number') {
                        myMsg += '<a href="tel:' + element[i].buttons[j].payload + '" class="link external" style="text-transform:uppercase;display:inline-table;">' + element[i].buttons[j].title + '</a>';
                      } else if(element[i].buttons[j].type == 'postback') {
                        var pLoad = "'" + element[i].buttons[j].payload + "'";
                        var pType = "'" + element[i].buttons[j].type + "'";
                        var pTitle = "'" + element[i].buttons[j].title + "'";
                        myMsg += '<a href="#" class="link" onClick="chatNewsLink(' + pLoad + ',' + pType + ',' + pTitle + ');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                      }
                    });
                  }
                  myMsg += '</div>' +
                    '</div></div>';
                });
                myMsg += '</div>' +
                  //'<div class="swiper-pagination" style="position:relative;bottom:20px;"></div>'+
                  '</div>';
                $$(".chatnews").append(myMsg);
                myApp.preloader.hide();
              } else {
                myApp.dialog.alert("Elements not Found.!");
                myApp.preloader.hide();
              }
            } else {
              message = messageT.text;
              if(messageT.quick_replies) {
                myMsg += '<div class="card" style="border-radius:25px;width:85%;left:5%;height:150px;">' +
                  '<div class="card-content card-content-padding">' +
                  '<div><div class="chip" style="height:auto;"><div class="chip-label" style="white-space:inherit;">' + message + '</div></div>';
                var quickButton = messageT.quick_replies;
                if(quickButton) {
                  $.each(quickButton, function (q) {
                    //console.log(quickButton[q].content_type);
                    if(quickButton[q].content_type == 'location') {
                      var locTitle = "'" + quickButton[q].title + "'";
                      myMsg += '<p style="float:left;margin:5px 25%;min-width:50%;"><a href="#" class="col button button-outline button-round" onClick="locationpopup(' + locTitle + ');">' + quickButton[q].title + '</a></p>';
                    } else {
                      var qLoad = "'" + quickButton[q].payload + "'";
                      var qType = "'" + quickButton[q].content_type + "'";
                      var qTitle = "'" + quickButton[q].title + "'";
                      myMsg += '<p style="float:left;margin:5px;"><a href="#" class="col button button-outline button-round" onClick="chatNewsLink(' + qLoad + ',' + qType + ',' + qTitle + ');">' + quickButton[q].title + '</a></p>';
                    }
                  });
                }
                myMsg += '</div></div></div>';
                $$(".chatnews").append(myMsg);
                myApp.preloader.hide();
              }
            }
          }
        }
      });
    }
  } else {
    console.log("Link : " + payload);
    //console.log(payload.indexOf("direct"));
    if((payload.indexOf("=")) > -1) {
      if(payload.indexOf("direct") >= 0) {
        var payloadUrl = payload;
      } else {
        var payloadUrl = payload+"&mobile="+usermobile;
      }
    } else {
      var payloadUrl = payload+"?mobile="+usermobile;
    }
    console.log(payloadUrl);
    if(payload.indexOf("socialrecharge.com") >= 0) {
      window.open(payloadUrl, '_system');
      var dynamicPopup = myApp.popup.create({
        content: '<div class="popup popup-location">'+
                    '<div class="toolbar">'+
                      '<div class="toolbar-inner">'+
                        '<div class="left"></div>'+
                        '<div class="right">'+
                          '<a class="link popup-close">Close</a>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<div class="block">'+
                      '<p><iframe width="104%" style="min-height:580px;" src="'+payloadUrl+'" frameborder="0" allowfullscreen></iframe></p>'+                      
                    '</div>'+
                  '</div>',
        on: {
          open: function (popup) {
            console.log('dynamicPopup open');
          },
          opened: function (popup) {
            console.log('dynamicPopup opened');
          },
        }
      });
      //dynamicPopup.open();
      myApp.preloader.hide();
    } else if(payload.indexOf("cyber-concierge.firebaseapp.com") >= 0) {
      var dynamicPopup = myApp.popup.create({
        content: '<div class="popup popup-location">'+
                    '<div class="toolbar">'+
                      '<div class="toolbar-inner">'+
                        '<div class="left"></div>'+
                        '<div class="right">'+
                          '<a class="link popup-close">Close</a>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<div class="block">'+
                      '<p><iframe width="104%" style="min-height:580px;" src="'+ payloadUrl+'" frameborder="0" allowfullscreen></iframe></p>'+                      
                    '</div>'+
                  '</div>',
        on: {
          open: function (popup) {
            console.log('dynamicPopup open');
          },
          opened: function (popup) {
            console.log('dynamicPopup opened');
          },
        }
      });
      dynamicPopup.open();
      myApp.preloader.hide();
    } else {
      myApp.preloader.hide();
      //window.open(payload, '_blank');
      //var ref = cordova.InAppBrowser.open(payload, '_blank', 'location=yes');
      var query = payload.split("?");
      var url2 = query[1].split("&");
      var url3 = url2[0].split("=");
      var cat = url3[1].trim();
      var url3 = url2[1].split("=");
      var id = url3[1].trim();
      console.log(cat+" - "+id);
      mainView.router.navigate("/dynamicpage/"+(cat)+"/"+(id), {ignoreCache: true});
    }
  }
}

function chatUI(sender, time, messageT, clsName) {
  //console.log(sender+", Message is : ", messageT);
  var otherend2 = "'"+sender+"'";
  var msgAttach;
  var dateTime = $.timeago(new Date());
  if(sender) {
    var otherEndName = sender;
  } else {
    var otherEndName = "Social";
  }
  var image = "assets/img/tmp/ava4.jpg";
  var usermobile = window.localStorage.getItem('usermobile');
  msgAttach = messageT.attachment || (messageT.message && messageT.message.attachment);
  if(msgAttach) {
    if(msgAttach.type == 'image') {
      myMsg += '<div class="card demo-card-header-pic" style="border-radius:25px;width:85%;left:10%;float:left;box-shadow:none;">' +
        '<div style="background-image:url(' + msgAttach.payload.url + ');border-radius:25px;height:-webkit-fill-available;" valign="bottom" class="card-header color-white no-border pb-popup"></div>' +
        '</div>';
      $$("."+clsName).append(myMsg);
      myApp.preloader.hide();
    } else if(msgAttach.type == 'audio') {
      //console.log("Audio - "+msgAttach.payload.url);
      myMsg += '<div class="card demo-card-header-pic" style="border-radius:25px;width:85%;left:10%;float:left;box-shadow:none;">' +
        '<div class="card-content card-content-padding">' +
        '<audio controls="" loop=""><source src="' + msgAttach.payload.url + '" type="audio/mpeg"></audio>' +
        '</div>' +
        '</div>';
      $$("."+clsName).append(myMsg);
      myApp.preloader.hide();
    } else if(msgAttach.type == 'video') {
      myMsg += '<div class="card demo-card-header-pic" style="border-radius:25px;width:85%;left:10%;float:left;box-shadow:none;">' +
        '<div class="card-content card-content-padding">' +
        '<iframe width="100%" style="border:#000 1px solid;border-radius:25px;" src="' + msgAttach.payload.url + '" frameborder="0" allowfullscreen></iframe>' +
        '</div>' +
        '</div>';
      $$("."+clsName).append(myMsg);
      myApp.preloader.hide();
    } else if(msgAttach.type == 'location') {
      console.log("Lat - " + msgAttach.payload.coordinates.lat);
      console.log("Long - " + msgAttach.payload.coordinates.long);
      myMsg += '<div class="card demo-card-header-pic" style="width:85%;left:10%;float:left;box-shadow:none;">' +
        '<div class="card-content card-content-padding">' +
        '<iframe width="100%" src="https://www.google.com/maps?q=' + msgAttach.payload.coordinates.lat + ',' + msgAttach.payload.coordinates.long + '&hl=es;z%3D14&amp;output=embed" frameborder="0" allowfullscreen></iframe>' +
        '</div>' +
        '</div>';
      $$("."+clsName).append(myMsg);
      myApp.preloader.hide();
    } else {
      if(msgAttach.payload.template_type == 'button') {
        myMsg += '<div class="card" style="border-radius:25px;width:85%;left:10%;float:left;">' +
          '<div class="card-content card-content-padding">' +
          '<p class="color-gray">' + msgAttach.payload.text + '</p>' +
          '</div>';
        var Button = msgAttach.payload.buttons;
        if(Button) {
          $.each(Button, function (b) {
            //console.log(Button[b].title);
            if(Button[b].type == 'web_url') {
              var str = "'" + Button[b].url + "'";
              var blank = "''";
              myMsg += '<div align="center" class="card-footer"><a href="#" class="link" onClick="chatNewsLink(' + str + ',' + blank + ',' + blank + ','+otherend2+');" style="text-transform:uppercase;display:inline-table;">' + Button[b].title + '</a></div>';
            } else if(Button[b].type == 'phone_number') {
              myMsg += '<div align="center" class="card-footer"><a href="tel:' + Button[b].payload + '" class="link external" style="text-transform:uppercase;">' + Button[b].title + '</a></div>';
            } else if(Button[b].type == 'postback') {
              var pLoad = "'" + Button[b].payload + "'";
              var pType = "'" + Button[b].type + "'";
              var pTitle = "'" + Button[b].title + "'";
              myMsg += '<div align="center" class="card-footer"><a href="#" class="link" onClick="chatNewsLink(' + pLoad + ',' + pType + ',' + pTitle + ','+otherend2+');" style="text-transform:uppercase;display:inline-table;">' + Button[b].title + '</a></div>';
            }
          });
        }
        myMsg += '</div>';
        $$("."+clsName).append(myMsg);
        myApp.preloader.hide();
      } else {
        element = msgAttach.payload.elements;
        if(msgAttach.payload.image_aspect_ratio == 'square') {
          var imgRatio = 'height: 80vw;';
        } else {
          var imgRatio = 'height: 40vw;';
        }
        if(element) {
          myMsg = '<ul>';
          $.each(element, function (i) {
            var id = "'element"+i+"'";
            if((element[i].title) && ((element[i].title).toLowerCase().indexOf("otp") >= 0)) {
              var title = (element[i].title).split("|");
              myMsg += '<li class="swipeout" id="element'+i+'">' +
                '<div class="swipeout-content">'+
                  '<a href="#" class="item-link item-content" onclick="openelement('+id+');">'+
                    '<div class="item-media"><img src="'+element[i].image_url+'" width="40" height="40" style="border-radius:50%;"></div>'+
                    '<div class="item-inner">'+
                      '<div class="item-title" align="right" style="margin-right:10px;font-size:13px;color:gray;">'+title[0]+'</div>';
              if(element[i].subtitle) {
                myMsg += '<div class="item-subtitle" align="right" style="margin-right:10px;font-size:15px;">'+title[1]+'</div>'+
                '<div class="item-text" style="font-size:13px;font-weight:bold;"><span style="color:skyblue;">'+element[i].subtitle+'</span> <i class="fa fa-circle" style="font-size:8px;padding:5px;"></i> '+title[2]+'</div>';
              }
            } else if((element[i].title) && ((element[i].title).toLowerCase().indexOf("eta") >= 0)) {
              var title = (element[i].title).split(",");
              var subtitle = (element[i].subtitle).split("|");
              //console.log(element[i].title);
              var titleEta = (title[2]).split(' ');
              myMsg += '<li class="swipeout" id="element'+i+'" data-fare="'+title[1]+'" data-eta="'+titleEta[1]+'" style="list-style:none;">' +
                '<div class="swipeout-content">'+
                  '<a href="#" class="item-link item-content" onclick="openelement('+id+');">'+
                    '<div class="item-media"><img src="'+element[i].image_url+'" width="40" height="40" style="border-radius:50%;"></div>'+
                    '<div class="item-inner">'+
                      '<div class="item-title-row">'+
                        '<div class="item-title">'+title[0]+' '+title[2]+'</div>'+
                        '<div class="item-after" style="font-weight:bold;"><i class="fa fa-inr" style="margin:3px;"></i>'+title[1]+' *</div>'+
                      '</div>';
              if(element[i].subtitle) {
                myMsg += '<div class="item-subtitle">'+subtitle[0]+'</div><div class="item-text" style="font-size:13px;">'+subtitle[1]+'</div>';
              }
            } else {
              myMsg += '<li class="swipeout" id="element'+i+'">' +
                '<div class="swipeout-content">'+
                  '<a href="#" class="item-link item-content" onclick="openelement('+id+');">'+
                    '<div class="item-media"><img src="'+element[i].image_url+'" width="40" height="40" style="border-radius:50%;"></div>'+
                    '<div class="item-inner">'+
                      '<div class="item-title-row">'+
                        '<div class="item-title">'+element[i].title+'</div>'+
                      '</div>';
              if(element[i].subtitle) {
                myMsg += '<div class="item-subtitle">'+element[i].subtitle+'</div>';
              }
            }
            myMsg += '</div>'+
                '</a>'+
              '</div>'+
            '<div class="swipeout-actions-right">';
            var eleButton = element[i].buttons;
            if(eleButton) {
              //myMsg+= '<a href="#" class="link">&nbsp;</a>';
              $.each(eleButton, function (j) {
                if(element[i].buttons[j].type == 'web_url') {
                  var str = "'" + element[i].buttons[j].url + "'";
                  var blank = "''";
                  myMsg += '<a href="#" class="color-orange" onClick="chatNewsLink(' + str + ',' + blank + ',' + blank + ','+otherend2+');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                } else if(element[i].buttons[j].type == 'phone_number') {
                  myMsg += '<a href="tel:' + element[i].buttons[j].payload + '" class="color-green external" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                } else if(element[i].buttons[j].type == 'postback') {
                  var pLoad = "'" + element[i].buttons[j].payload + "'";
                  var pType = "'" + element[i].buttons[j].type + "'";
                  var pTitle = "'" + element[i].buttons[j].title + "'";
                  var titlecolor = ((element[i].buttons[j].title.toLowerCase() == 'stop') || (element[i].buttons[j].title.toLowerCase() == 'cancel')) ? 'color-red' : 'color-blue';
                  myMsg += '<a href="#" class="'+titlecolor+'" onClick="chatNewsLink(' + pLoad + ',' + pType + ',' + pTitle + ','+otherend2+');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                }
              });
            }
            myMsg += '</div></li>';
            
          });
          myMsg += '</ul>';
          $$("."+clsName).append(myMsg);
          myApp.preloader.hide();
        } else {
          console.log("Elements not Found.!");
          myApp.preloader.hide();
        }
      }
    }
  } else {
    let message = "";
    message = messageT.text;
    //console.log(message+" - "+messageT.input);
    if(messageT.quick_replies) {
      myMsg += '<div class="card" style="border-radius:25px;width:85%;left:5%;height:150px;">' +
        '<div class="card-content card-content-padding">' +
        '<div><div class="chip" style="width:100%;height:auto;"><div class="chip-label" style="white-space:inherit;line-height:18px;padding:5px;">' + message + '</div></div>';
      var quickButton = messageT.quick_replies;
      if(quickButton) {
        $.each(quickButton, function (q) {
          //console.log(quickButton[q].content_type);
          if(quickButton[q].content_type == 'location') {
            var locTitle = "'" + quickButton[q].title + "'";
            myMsg += '<p style="float:left;margin:5px 25%;min-width:50%;"><a href="#" class="col button button-outline button-round" onClick="locationpopup(' + locTitle + ');">' + quickButton[q].title + '</a></p>';
          } else {
            var qLoad = "'" + quickButton[q].payload + "'";
            var qType = "'" + quickButton[q].content_type + "'";
            var qTitle = "'" + quickButton[q].title + "'";
            myMsg += '<p style="float:left;margin:5px 0px 5px 5px;"><a href="#" class="col button button-outline button-round" onClick="chatNewsLink(' + qLoad + ',' + qType + ',' + qTitle + ','+otherend2+');">' + quickButton[q].title + '</a></p>';
          }
        });
      }
      myMsg += '</div></div></div>';
      $$("."+clsName).append(myMsg);
      myApp.preloader.hide();
    } else if(messageT.input) {
      var field = (messageT.input).split('_');
      console.log(field);
      $$('.chatmessage').attr("type", field[0]);
      $$('.chatmessage').attr("name", field[2]);
      $$('#chattype').val(field[1]);
      $$('.chatmessage').prop("disabled", false);
      $$('.chatmessage').focus();
      myApp.preloader.hide();
    } else {
      $$('.chatmessage').removeAttr("type");
      $$("#chattype").val('');
      if(sender !== usermobile) {
        var element = "'element'";
        oldReceviedMsg = '<ul><li class="swipeout" id="element">' +
            '<div class="swipeout-content">'+
              '<a href="#" class="item-link item-content" onclick="openelement('+element+');">'+
              '<div class="item-media"><img src="'+image+'" width="40" height="40" style="border-radius:50%;"/></div>'+
              '<div class="item-inner">'+
                '<div class="item-title-row">'+message+'</div>'+
                '<div class="item-subtitle">'+otherEndName+'</div>'+
              '</div></a></div>'+
              '<div class="swipeout-actions-right"><a href="#" class="color-blue" onClick="rideContinue();">BOOK A RIDE</div>'+
            '</li></ul>';
        $$("."+clsName).append(oldReceviedMsg);
        myApp.preloader.hide();
      } else {
        //console.log("Message : ", message);
        oldSentMessages = '';
        if(message == 'payload') {
          message = messageT.payload.title;
        } else {
          message = message;
        }
        oldSentMessages = '<div class="messages-title"><span>'+dateTime+'</span></div>'+
          '<div class="message message-sent" style="max-width:98%;">'+
          '<div class="message-avatar" style="background-image:url('+userImage+'); opacity:1;"></div>'+
          '<div class="message-content"><div class="message-bubble">'+
          '<div class="message-text">'+message+'</div>'+
          '</div></div>'+
          '</div>';
        message = '';
        $$("."+clsName).append(oldSentMessages);
        myApp.preloader.hide();
      }
    }
  }
  //firebase.database().ref("/chat/"+usermobile+"/"+sender+"/messages").off("child_added");
}

function appBrowser(link) {
  var ref = cordova.InAppBrowser.open(link, '_blank', 'location=yes');
}

function chatLink(payload, type, title) {
  //console.log(payload); console.log(type); console.log(title);
  var usermobile = window.localStorage.getItem('usermobile');
  myApp.preloader.show();
  var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/; // fragment locater
  if (!pattern.test(payload)) {
    console.log("Word : " + payload);
    $$("#chattype").val(type);
    $$("#chatpayload").val(payload);
    $$(".chatmessage").val(title);
    setTimeout(function () {
      myApp.preloader.hide();
      $$("#send").click();
      console.log("Send Word : " + payload);
    }, 800);
  } else {
    myApp.preloader.hide();
    console.log("Link : " + payload);
    //console.log(payload.indexOf("="));
    if((payload.indexOf("=")) > -1) {
      var payloadUrl = payload+"&mobile="+usermobile;
    } else {
      var payloadUrl = payload+"?mobile="+usermobile;
    }
    console.log(payloadUrl);
    //var ref = cordova.InAppBrowser.open(payload, '_blank', 'location=yes');
    //console.log(payload.indexOf("socialrecharge.com"));
    if(payload.indexOf("socialrecharge.com") >= 0) {
      var dynamicPopup = myApp.popup.create({
        content: '<div class="popup popup-location">'+
                    '<div class="toolbar">'+
                      '<div class="toolbar-inner">'+
                        '<div class="left"></div>'+
                        '<div class="right">'+
                          '<a class="link popup-close">Close</a>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<div class="block">'+
                      '<p><iframe width="104%" style="min-height:580px;" src="'+payloadUrl+'" frameborder="0" allowfullscreen></iframe></p>'+                      
                    '</div>'+
                  '</div>',
        on: {
          open: function (popup) {
            console.log('dynamicPopup open');
          },
          opened: function (popup) {
            console.log('dynamicPopup opened');
          },
        }
      });
      dynamicPopup.open();
    } else if(payload.indexOf("cyber-concierge.firebaseapp.com") >= 0) {
      var dynamicPopup = myApp.popup.create({
        content: '<div class="popup popup-location">'+
                    '<div class="toolbar">'+
                      '<div class="toolbar-inner">'+
                        '<div class="left"></div>'+
                        '<div class="right">'+
                          '<a class="link popup-close">Close</a>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<div class="block">'+
                      '<p><iframe width="104%" style="min-height:580px;" src="'+ payloadUrl+'" frameborder="0" allowfullscreen></iframe></p>'+                      
                    '</div>'+
                  '</div>',
        on: {
          open: function (popup) {
            console.log('dynamicPopup open');
          },
          opened: function (popup) {
            console.log('dynamicPopup opened');
          },
        }
      });
      dynamicPopup.open();
    } else {
      window.open(payload, '_blank');
    }
  }
}

function filterDate()
{
  console.log("filter_date");
  $(".filter_date").toggle("style");
  $('input[name="datefrom"]').val('');
}
function refreshPayData(pDate,pEndDate)
{
    mainView.router.navigate("/trips/");
}
function filterData()
{
    var datefrom = $('input[name="datefrom"]').val();
    var refundVal = $('input[name="fil_refund"]').val();
    if(datefrom) {
        var today = new Date(datefrom);
        console.log(today);
        var unix = Math.round(today/1000);
        today.setMonth(today .getMonth() + 1);
        //var unix = today.getTime();
        var unix2 = Math.round(today/1000);
        var pEndDate = unix2;
        //mainView.router.navigate("/earnings/"+unix+"/"+pEndDate+"/"+refundVal);
        mainView.router.navigate("/trips/?pDate="+unix+"&pEndDate="+pEndDate+"&refund="+refundVal);
    } else {
        var today = new Date();
        console.log(today);
        var unix2 = Math.round(today/1000);
        var pEndDate = unix2;
        //var unix = Math.round(+new Date()/1000);
        today.setMonth(today .getMonth() - 1);
        //var unix = today.getTime();
        var unix = Math.round(today/1000);
        //mainView.router.navigate("/earnings/"+unix+"/"+pEndDate+"/"+refundVal);
        mainView.router.navigate("/trips/?pDate="+unix+"&pEndDate="+pEndDate+"&refund="+refundVal);
    }
}

function menuOpen() {
  var messages = myApp.messages.create({
    el: '.messages',
  });
  $('.messagebar-init').attr('style', 'bottom:0px !important;');
  $('.messages-content').attr('style', 'padding-bottom:190px;');
  $('.menutoggle').attr('onclick', 'menuClose()');
  // $('.messages-content').animate({
  //   scrollTop: $('.messages-content')[0].scrollHeight
  // }, 20);
  messages.scroll(500);
}

function menuClose() {
  var messages = myApp.messages.create({
    el: '.messages',
  });
  $('.messagebar-init').attr('style', 'bottom:-140px !important;');
  $('.messages-content').attr('style', 'padding-bottom:50px;');
  $('.menutoggle').attr('onclick', 'menuOpen()');
  // $('.messages-content').animate({
  //   scrollTop: $('.messages-content')[0].scrollHeight
  // }, 20);
  messages.scroll(500);
}

function findElement(selector) {
  var box = null;
  if ($('.page-on-center').length > 0) {
    box = $('.view-main').find('.page-on-center ' + selector);
  } else {
    box = $('.view-main').find('.page').find(selector);
  }

  return box;
}

function naxvarBg() {
  var navbar = $('.navbar-anim-on-scroll'),
    box = null,
    cls = 'active';
  if (navbar.length === 0) {
    return false;
  }
  if ($('.page-on-center').length > 0) {
    box = navbar.next().find('.page-on-center .page-content');
  } else {
    box = navbar.next().find('.page .page-content');
  }
  if (box.scrollTop() > 10) {
    navbar.addClass(cls);
  } else {
    navbar.removeClass(cls);
  }
  box.scroll(function () {
    if ($(this).scrollTop() > 40) {
      navbar.addClass(cls);
    } else {
      navbar.removeClass(cls);
    }
  });
}

function scancode() {
  console.log("Scancode");  
      QRScanner.prepare((err, scannerStatus) => { 
        if(err){
          return myApp.dialog.alert(err._message);
        }
        const {
          prepared,
          authorized,
          denied,
          restricted,
          canOpenSettings,
          canEnableLight,
          currentCamera
        } = scannerStatus;
        if (scannerStatus && prepared && authorized) {          
          QRScanner.show((status) => {                        
            $('body').css('visibility', 'hidden');
            QRScanner.scan((err, contents) => {
              if(err){
                return myApp.dialog.alert(err._message);
              }
              console.log('The scanned QR code contains:', contents);
              QRScanner.destroy();
              
              QRScanner.hide();
              $('body').css('visibility', 'visible');              
              if (contents && contents.includes('?') && contents.includes('&') && contents.includes("=")) {
                const splittedContetnt = (contents.split('?')[1]).split('&');
                const mobile = (splittedContetnt[1].split('=')[1]).trim();
                const type = (splittedContetnt[0].split('=')[1]).trim();
                if (type == 'direct' && mobile) {
                  mainView.router.navigate(`/directride/${mobile}`);
                }
              } else {
                mainView.router.navigate("/", {
                  ignoreCache: false,
                  reloadCurrent: true
                });
              }              
            });            
          });
        } else if (denied && canOpenSettings) {
          QRScanner.getStatus(function(status){
            // console.log('QR Scanner status:-', status);
            const { authorized, canOpenSettings} = status;
            if (!authorized && canOpenSettings) {
              if (myApp.dialog.confirm("Would you like to enable QR code scanning? You can allow camera access in your settings.")) {
                QRScanner.openSettings();
              }
            } else {
              console.error(`Error in scanner getStatus and error is:`, status);
            }
          });
        }
      });
    // }  

  /*cordova.plugins.barcodeScanner.scan(
      function (result) {
        console.log("We got a barcode\n" +
              "Result: " + result.text + "\n" +
              "Format: " + result.format + "\n" +
              "Cancelled: " + result.cancelled);
        var payload = result.text;
        if(payload) {
          var query = payload.split("?");
          var url2 = query[1].split("&");
          var url3 = url2[0].split("=");
          var type = url3[1].trim();
          var url3 = url2[1].split("=");
          var mobile = url3[1].trim();
          console.log("type :",type,"driverno :",mobile);
          if(type == "direct") {
            mainView.router.navigate("/directride/"+mobile);
          }
        } else {
          mainView.router.navigate("/", {
            ignoreCache: false,
            reloadCurrent: true
          });
        }
      },
      function (error) {
        myApp.dialog.alert("Scanning failed: " + error);
      },
      {
          preferFrontCamera : false, // iOS and Android
          showFlipCameraButton : true, // iOS and Android
          showTorchButton : true, // iOS and Android
          torchOn: false, // Android, launch with the torch switched on (if available)
          saveHistory: true, // Android, save scan history (default false)
          prompt : "Place a barcode inside the scan area", // Android
          resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
          formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
          orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
          disableAnimations : true, // iOS
          disableSuccessBeep: false // iOS and Android
      }
   );*/
}

function calc() {
  var latitude_p = document.getElementById("latitude_p").value;
  var longitude_p = document.getElementById("longitude_p").value;
  var latitude_drop = document.getElementById("latitude_drop").value;
  var longitude_drop = document.getElementById("longitude_drop").value;
  map.renderRoute({
    origin: [latitude_p, longitude_p],
    destination: [latitude_drop, longitude_drop],
    travelMode: 'driving',
    strokeColor: 'blue',
    strokeOpacity: 0.6,
    strokeWeight: 6
  }, {
    panel: '#directions',
    draggable: true
  });
  // var latitude_d=28.491681;
  // var longitude_d=77.094897;
  // var price = 10;
  $.ajax({
    url: 'https://socialrecharge.com/brand/firebase/driver_price.php',
    type: 'GET',
    data: {
      pl: latitude_p,
      plo: longitude_p,
      dl: latitude_drop,
      dlo: longitude_drop
    },
    success: function (data) {
      var obj = JSON.parse(data);
      console.log(obj);
      var total_fare = obj.detail[4].total;
      //console.log(total_fare);
      var eta_time = obj.detail[4].eta;
      var time = obj.detail[4].time;
      //   var distance = dist[0].elements[0].distance.text;
      //   var duration = dist[0].elements[0].duration.text;
      //   var distance1 = dist[0].elements[1].distance.text;
      //   var duration1 = dist[0].elements[1].duration.text;
      //   var distance_v = dist[0].elements[0].distance.value;
      //   var duration_v = dist[0].elements[0].duration.value;
      //   var distance1_v = dist[0].elements[1].distance.value;
      //   var duration1_v = dist[0].elements[1].duration.value;
      //   var distanced = distance_v/1000;
      //   var durationd = duration_v/60;
      //     var total_fare = (parseFloat(distanced)*price+parseInt(durationd)); 
      //   var distancep = distance1_v/1000;
      //   var durationp = duration1_v/60;
      //   if(distancep<=2) {
      //     var total_fare1 = 50;
      //   } else {
      //     var total_fare1 = (25+(parseFloat(distancep)-1)*price+parseInt(durationp));
      //   }
      //   var total = parseFloat(total_fare+total_fare1);
      //   var total_f = parseInt(total);
      var total_final = '&#8377; ' + total_fare;
      $$('#amount').html(total_final);
      $$('#eta').html(eta_time);
      $$('#time').html(time);
      // document.getElementById('amount').style.display = "none";
      document.getElementById("amt").style.display = "block";
    }
  });
}

function logoutUser() {
  var usermobile = window.localStorage.getItem("usermobile");
  var deviceUuid = window.localStorage.getItem("deviceUUID");
  myApp.dialog.confirm("Do you want to Logout?", "Direct Cabs", function () {
    //onlineOfflineStatus(usermobile);
    if(myApp.device.android) {
      //cordova.plugins.firebase.auth.signOut().then(function() {
      firebase.auth().signOut().then(function() {
        console.log("user was signed out");
      });
      firebase.database().ref("/chatfbuser/"+usermobile+"/devices/"+deviceUuid).remove()
        .then(function () {
          console.log("Device removed successfully");
        }).catch(function (error) {
          console.error("Device can\'t remove right now. Error is : ", error.message);
      });
    }
    window.localStorage.clear();
    // firebase.database().ref("/chatfbuser/" + usermobile + "/devices/web" + usermobile).remove()
    // .then(function () {
    //   mainView.router.navigate("/");
    //   console.log("Device removed successfully");
    // }).catch(function (error) {
    //   console.error("Device can\'t remove right now. Error is : ", error.message);
    // });
    myApp.loginScreen.open(".login-screen");
  });
}
// var query = myApp.utils.parseUrlQuery(location.href);
// console.log("Href Query : ",query, new Date());
// if((query.cat) && (query.id)){
//   console.log("Redirect", query.cat, query.id);
//   mainView.router.navigate("/dynamicpage/"+(query.cat)+"/"+(query.id));
//   // return;
// }

function openelement(element){
  //myApp.swipeout.open($(element).parent('li'));
  myApp.swipeout.open('#'+element);
}

var $ptrContent = $$('.ptr-content');
// Add 'refresh' listener on it
$ptrContent.on('ptr:refresh', function (e) {
  // Emulate 2s loading
  console.log("Pull to refresh......");
  setTimeout(function () {
    mainView.router.navigate(mainView.router.currentRoute.url, {
        ignoreCache  : false,
        reloadCurrent : true
    });
    myApp.ptr.done();
  },2000);
});