var routes = [
  // Index page
  {
    path: '/',
    url: './index.html',
    name: 'index',
    on: {
      pageInit: function (e, page) {
        // console.log("All codes of index page is moved in app.js data-name index");
      },
    }
  },
  // Right Panel pages
  {
    path: '/panel-right-1/',
    content: '\
      <div class="page">\
        <div class="navbar">\
          <div class="navbar-inner sliding">\
            <div class="left">\
              <a href="#" class="link back">\
                <i class="icon icon-back"></i>\
                <span class="ios-only">Back</span>\
              </a>\
            </div>\
            <div class="title">Panel Page 1</div>\
          </div>\
        </div>\
        <div class="page-content">\
          <div class="block">\
            <p>This is a right panel page 1</p>\
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quo saepe aspernatur inventore dolorum voluptates consequatur tempore ipsum! Quia, incidunt, aliquam sit veritatis nisi aliquid porro similique ipsa mollitia eaque ex!</p>\
          </div>\
        </div>\
      </div>\
    ',
  },
  {
    path: '/panel-right-2/',
    content: '\
      <div class="page">\
        <div class="navbar">\
          <div class="navbar-inner sliding">\
            <div class="left">\
              <a href="#" class="link back">\
                <i class="icon icon-back"></i>\
                <span class="ios-only">Back</span>\
              </a>\
            </div>\
            <div class="title">Panel Page 2</div>\
          </div>\
        </div>\
        <div class="page-content">\
          <div class="block">\
            <p>This is a right panel page 2</p>\
            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quo saepe aspernatur inventore dolorum voluptates consequatur tempore ipsum! Quia, incidunt, aliquam sit veritatis nisi aliquid porro similique ipsa mollitia eaque ex!</p>\
          </div>\
        </div>\
      </div>\
    ',
  },
  {
    path: '/profile/',
    url: './profile.html',
    on: {
        pageInit: function (e, page) {
          console.log("Profile");
          $$('.editsubmit').on("click", function () {
            var usermobile = window.localStorage.getItem('usermobile');
            var formData = myApp.form.convertToData('#profile_form');
            //myApp.dialog.alert(JSON.stringify(formData));
            var referBy = window.localStorage.getItem("referby");
            var referUser = window.localStorage.getItem("referuser");
            if(referBy && referUser) {
              referBy = referBy;
              referUser = referUser;
            } else {
              referBy = '';
              referUser = '';
            }
            console.log("referBy : "+referBy+", Referral :", referUser);
            var fname = formData.fname;
            var lname = formData.lname;
            var dob = formData.dob;
            var gender = formData.gender;
            if(fname && lname && dob && gender) {
              firebase.database().ref('chatfbuser/'+usermobile).update({
                fname: fname,
                lname: lname,
                gender: gender,
                number: usermobile,
                dob: dob,
                referby:referBy,
                referral: referUser,
              }, function (error) {
                if(!error) {
                  myApp.preloader.hide();
                  if(referBy && referUser) {
                    var regDate = (new Date().getDate())+"-"+(new Date().getMonth()+1)+"-"+(new Date().getFullYear());
                    if(referBy == 'driver') {
                      firebase.database().ref("sr_driver/"+referUser+"/invitee/"+usermobile)
                      .set({
                        invitee: usermobile,
                        refertype: referBy,
                        amount:200,
                        status:"done",
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        '.priority': firebase.database.ServerValue.TIMESTAMP,
                      }, function(error){
                        if(!error) {
                          var pushKey = firebase.database().ref("driver_license_credit/"+referUser);
                          pushKey.push({        
                            amount:200,
                            type:"credit",
                            desc:"refer by driver",
                            date:regDate,
                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                            '.priority': firebase.database.ServerValue.TIMESTAMP
                          }, function (error) {
                            if(!error) {
                              pushKey.child('total').once('value', function(totalsnap){
                                pushKey.update({"total": (totalsnap.val() + 200)}, function (error) {
                                  if(!error) {
                                    console.log("Status changed successfully");
                                  }
                                });
                              });
                            }
                          });
                        }
                      });
                    } else if(referBy == 'customer') {
                      firebase.database().ref("chatfbuser/"+referUser+"/invitee/"+usermobile)
                      .set({
                        invitee: usermobile,
                        refertype: referBy,
                        amount:50,
                        status:"done",
                        timestamp: firebase.database.ServerValue.TIMESTAMP,
                        '.priority': firebase.database.ServerValue.TIMESTAMP,
                      }, function(error){
                        if(!error) {
                          var pushKey = firebase.database().ref("users_credit/"+referUser);
                          pushKey.push({        
                            amount:50,
                            type:"credit",
                            desc:"refer customer",
                            date:regDate,
                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                            '.priority': firebase.database.ServerValue.TIMESTAMP
                          }, function (error) {
                            if(!error) {
                              pushKey.child('total').once('value', function(totalsnap){
                                pushKey.update({"total": (totalsnap.val() + 50)}, function (error) {
                                  if(!error) {
                                    console.log("Status changed successfully");
                                  }
                                });
                              });
                            }
                          });
                        }
                      });
                    }
                  }
                  window.localStorage.setItem("referuser", "");
                  window.localStorage.setItem("referby", "");
                  mainView.router.navigate("/");
                }
              });
            } else {
              myApp.preloader.hide();
              myApp.dialog.alert("Please fill all info.");
            }
          });
        },
      }
  },
  {
    path: '/directchat/:tripid/:mobile/:driverno',
    url: './directchat.html',
    on: {
      pageInit: function (e, page) {
        // https://console.firebase.google.com/project/project-1956585320571671692/database/socialrecharge/data/directcabschat/
        $$(".chatmsg").empty();
        myApp.preloader.show();
        var params = page.route.params;
        var tripid = params.tripid;
        var otherend = params.mobile;
        var driverno = params.driverno;
        myApp.popup.close(".popup-maps");
        if(myApp.sheet.get('.sheet-modal').opened) {
          myApp.sheet.close();
          $(".locationform").css("display","none");
        }

        setTimeout(function () {
          var mySwiper = myApp.swiper.create('.swiper-container2', {
            pagination: '.swiper-pagination',
            spaceBetween: 100 // 100px between slides
          });
        }, 1000);

        var messages = myApp.messages.create({
          el: '.messages',
        });
        var myMessagebar = myApp.messagebar.create({
          el: '.messagebar',
          attachments: []
        });
        var image = '';
        var otherEndName = '';
        var networkState = navigator.connection.type;
        console.log("networkState : ", networkState);
        if(networkState != 'unknown') {
          firebase.database().ref("/sr_driver/"+driverno+"/profile").once("value").then(function (otherenddata) {
            if(otherenddata.exists()) {
              image = otherenddata.val().driverImage;
              if(!image) {
                image = "assets/img/tmp/ava4.jpg";
              }
              otherEndName = otherenddata.val().name;
            } else {
              otherEndName = "Driver";
            }
          });
        } else {
          image = "assets/img/tmp/ava4.jpg";
          otherEndName = "Driver";
        }
        //var loginStat = window.localStorage.getItem("firebase:authUser:AIzaSyAChAejJAD0N8mUebbr7Xw0v-A9KwagUaQ:[DEFAULT]");
        var usermobile = window.localStorage.getItem("usermobile");
        $$(".chatmessage").val('');
        var myPhotoBrowserPopup = '';
        var message = '';
        var message2 = '';
        var messageT = '';
        var msgAttach = '';
        var userName = '';
        var userImage = '';
        var oldSentMessages = '';
        var oldReceviedMsg = '';
        var myMsg = '';
        if(tripid && otherend) {
          userName = window.localStorage.getItem("username");
          userImage = window.localStorage.getItem("userimage");
          console.log(tripid+" - "+otherend);
          firebase.database().ref("/directcabschat/" + tripid).once("value").then(function (chatexistance) {
            console.log("chatExists : ", chatexistance.exists());
            firebase.database().ref("/directcabschat/" + tripid + "/" + otherend + "/messages").once("value", function (messagesnap) {
              console.log("existance : ", messagesnap.exists());
              // messages.showTyping({
              //   header: 'Someone is typing',
              // });
              // oldReceviedMsg = '<div class="message message-last message-received" style="display:inline-block;">' +
              //   '<div style="background-image:url('+image+');float:left;margin:0px 10px 0px 5px;opacity:inherit;" class="message-avatar"></div>' +
              //   '<div class="message-content">'+
              //   '<div class="message-name" style="display:block;">' + otherEndName + '</div>' +
              //   '<div class="message-bubble">'+
              //   '<div class="message-text">I have arrived</div>' +
              //   '</div></div>'+
              //   '</div>';
              // $$(".chatmsg").append(oldReceviedMsg);
              // messages.hideTyping();
              firebase.database().ref("/directcabschat/" + tripid + "/" + otherend + "/messages").limitToLast(50).on("child_added", function (oldmsgsnap) {
                oldSentMessages = '';
                oldReceviedMsg = '';
                myMsg = '';
                var sender = oldmsgsnap.val().sender;
                messageT = '';
                messageT = oldmsgsnap.val().message;
                msgAttach = messageT.attachment;
                var time = oldmsgsnap.val().time;
                var dateTime = $.timeago(new Date(time));
                if(msgAttach) {
                  if(msgAttach.type == 'image') {
                    if(msgAttach.wait) {
                      myMsg += '<div class="card demo-card-header-pic waiting" style="border-radius:25px;width:85%;left:10%;float:left;box-shadow:none;">' +
                        '<div style="background-image:url(https://www.socialrecharge.com/srchat/load.gif);border-radius:25px;width:20%;" valign="bottom" class="card-header color-white no-border"></div>' +
                        '</div>';
                      //$$(".chatmsg").append(myMsg);
                      myApp.preloader.hide();
                      messages.scroll(500);
                    } else {
                      myPhotoBrowserPopup = myApp.photoBrowser.create({
                          photos : [msgAttach.payload.url],
                          zoom: 400,
                          theme: 'dark',
                          backLinkText: 'Back',
                          type: 'popup'
                      });
                      myMsg += '<div class="card demo-card-header-pic" style="border-radius:25px;width:85%;left:10%;float:left;box-shadow:none;">' +
                        '<div style="background-image:url(' + msgAttach.payload.url + ');border-radius:25px;height:-webkit-fill-available;" valign="bottom" class="card-header color-white no-border pb-popup"></div>' +
                        '</div>';
                      $$(".chatmsg").append(myMsg);
                      myApp.preloader.hide();
                      messages.scroll(500);
                    }
                  } else if (msgAttach.type == 'audio') {
                    //console.log("Audio - "+msgAttach.payload.url);
                    myMsg += '<div class="card demo-card-header-pic" style="border-radius:25px;width:85%;left:10%;float:left;box-shadow:none;">' +
                      '<div class="card-content card-content-padding">' +
                      '<audio controls="" loop=""><source src="' + msgAttach.payload.url + '" type="audio/mpeg"></audio>' +
                      '</div>' +
                      '</div>';
                    $$(".chatmsg").append(myMsg);
                    myApp.preloader.hide();
                    messages.scroll(500);
                  } else if (msgAttach.type == 'video') {
                    //console.log("Video - "+msgAttach.payload.url);
                    myMsg += '<div class="card demo-card-header-pic" style="border-radius:25px;width:85%;left:10%;float:left;box-shadow:none;">' +
                      '<div class="card-content card-content-padding">' +
                      '<iframe width="100%" style="border:#000 1px solid;border-radius:25px;" src="' + msgAttach.payload.url + '" frameborder="0" allowfullscreen></iframe>' +
                      '</div>' +
                      '</div>';
                    $$(".chatmsg").append(myMsg);
                    myApp.preloader.hide();
                    messages.scroll(500);
                  } else if (msgAttach.type == 'location') {
                    console.log("Lat - " + msgAttach.payload.coordinates.lat+", Long - " + msgAttach.payload.coordinates.long);                      
                    myMsg += '<div class="card demo-card-header-pic" style="width:85%;left:10%;float:left;box-shadow:none;">' +
                      '<div class="card-content card-content-padding">' +
                      '<iframe width="100%" src="https://www.google.com/maps?q=' + msgAttach.payload.coordinates.lat + ',' + msgAttach.payload.coordinates.long + '&hl=es;z%3D14&amp;output=embed" frameborder="0" allowfullscreen></iframe>' +
                      '</div>' +
                      '</div>';
                    $$(".chatmsg").append(myMsg);
                    myApp.preloader.hide();
                    messages.scroll(500);
                  } else {
                    if (msgAttach.payload.template_type == 'button') {
                      myMsg += '<div class="card" style="border-radius:25px;width:85%;left:10%;float:left;">' +
                        '<div class="card-content card-content-padding">' +
                        '<p class="color-gray">' + msgAttach.payload.text + '</p>' +
                        '</div>';
                      var Button = msgAttach.payload.buttons;
                      if (Button) {
                        $.each(Button, function (b) {
                          //console.log(Button[b].title);
                          if (Button[b].type == 'web_url') {
                            var str = "'" + Button[b].url + "'";
                            var blank = "''";
                            myMsg += '<div class="card-footer"><a href="#" class="link" onClick="chatLink(' + str + ',' + blank + ',' + blank + ');">' + Button[b].title + '</a></div>';
                          } else if (Button[b].type == 'phone_number') {
                            myMsg += '<div class="card-footer"><a href="tel:' + Button[b].payload + '" class="link external">' + Button[b].title + '</a></div>';
                          } else if (Button[b].type == 'postback') {
                            var pLoad = "'" + Button[b].payload + "'";
                            var pType = "'" + Button[b].type + "'";
                            var pTitle = "'" + Button[b].title + "'";
                            myMsg += '<div class="card-footer"><a href="#" class="link" onClick="chatLink(' + pLoad + ',' + pType + ',' + pTitle + ');">' + Button[b].title + '</a></div>';
                          }
                        });
                      }
                      myMsg += '</div>';
                      $$(".chatmsg").append(myMsg);
                      myApp.preloader.hide();
                      messages.scroll(500);
                    } else if (msgAttach.payload.template_type == 'receipt') {
                      //console.log(msgAttach.payload.elements);
                      myMsg += '<div class="card" style="border-radius:25px;width:85%;left:10%;float:left;">' +
                        '<div class="card-header">Order Confirmation</div>' +
                        '<div class="card-content card-content-padding"><ul>';
                      var eleReceipt = msgAttach.payload.elements;
                      if (eleReceipt) {
                        $.each(eleReceipt, function (r) {
                          //console.log(eleReceipt[r].title);
                          myMsg += '<li>' +
                            '<div class="item-content">' +
                            '<div class="item-media">' +
                            '<img src="' + eleReceipt[r].image_url + '" style="min-height:80px; width:100px;max-width:inherit;border-radius:initial;">' +
                            '</div>' +
                            '<div class="item-inner">' +
                            '<div class="item-title-row">' +
                            '<div class="item-title">' + eleReceipt[r].title + '</div>' +
                            '</div>';
                          if (eleReceipt[r].subtitle) {
                            myMsg += '<div class="item-text">' + eleReceipt[r].subtitle + '</div>';
                          }
                          myMsg += '</div>' +
                            '</div>' +
                            '</li>';
                        });
                      }
                      myMsg += '</ul>' +
                        '<p>Paid with<br><b>' + msgAttach.payload.payment_method + '</b></p>';
                      if (msgAttach.payload.address) {
                        myMsg += '<p>Ship to<br><b>' + msgAttach.payload.address.street_1 + ', ' + msgAttach.payload.address.city + ', ' + msgAttach.payload.address.state + ', ' + msgAttach.payload.address.country + ' ' + msgAttach.payload.address.postal_code + '</b></p>';
                      }
                      myMsg += '</div><div class="card-footer">Total <b style="top:12px;right:15px;position:absolute;">' + msgAttach.payload.summary.total_cost + '</b></div>' +
                        '</div>';
                      $$(".chatmsg").append(myMsg);
                      myApp.preloader.hide();
                      messages.scroll(500);
                    } else {
                      element = msgAttach.payload.elements;
                      //console.log(element.length);
                      if(element) {
                        myMsg = '<div data-space-between="20" data-slides-per-view="2" class="swiper-container2 swiper-2" style="overflow:scroll;">' +
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
                            '<div class="card ' + cardFirst + ' demo-card-header-pic" style="' + cardOne + 'left:10%;float:left;">' +
                            '<div style="background-image:url(' + element[i].image_url + ');' + headOne + '" valign="bottom" class="card-header ' + headClass + ' color-white no-border"></div>' +
                            '<div class="card-content card-content-padding" style="min-height:100px;">' +
                            '<p class="color-gray">' + element[i].title + '</p>';
                          if(element[i].subtitle) {
                            myMsg += '<p>' + element[i].subtitle + '</p>';
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
                                myMsg += '<a href="#" class="link" onClick="chatLink(' + str + ',' + blank + ',' + blank + ');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                              } else if(element[i].buttons[j].type == 'phone_number') {
                                myMsg += '<a href="tel:' + element[i].buttons[j].payload + '" class="link external" style="text-transform:uppercase;display:inline-table;">' + element[i].buttons[j].title + '</a>';
                              } else if(element[i].buttons[j].type == 'postback') {
                                var pLoad = "'" + element[i].buttons[j].payload + "'";
                                var pType = "'" + element[i].buttons[j].type + "'";
                                var pTitle = "'" + element[i].buttons[j].title + "'";
                                myMsg += '<a href="#" class="link" onClick="chatLink(' + pLoad + ',' + pType + ',' + pTitle + ');" style="text-transform:uppercase;">' + element[i].buttons[j].title + '</a>';
                              }
                            });
                          }
                          myMsg += '</div>' +
                            '</div></div>';
                        });
                        myMsg += '</div>' +
                          //'<div class="swiper-pagination" style="position:relative;bottom:20px;"></div>'+
                          '</div>';
                        $$(".chatmsg").append(myMsg);
                        myApp.preloader.hide();
                        messages.scroll(500);
                      } else {
                        myApp.dialog.alert("Elements not Found.!");
                        myApp.preloader.hide();
                        messages.scroll(500);
                      }
                    }
                  }
                } else {
                  message = '';
                  message = messageT.text;
                  //console.log(messageT.quick_replies);
                  if(messageT.quick_replies) {
                    myMsg += '<div class="card" style="border-radius:25px;width:85%;left:10%;float:left;">' +
                      '<div class="card-content card-content-padding">' +
                      '<div><div class="chip"><div class="chip-label">' + message + '</div></div>';
                    var quickButton = messageT.quick_replies;
                    if(quickButton) {
                      $.each(quickButton, function (q) {
                        //console.log(quickButton[q].content_type);
                        if (quickButton[q].content_type == 'location') {
                          var locTitle = "'" + quickButton[q].title + "'";
                          myMsg += '<p style="float:left;margin:5px 25%;min-width:50%;"><a href="#" class="col button button-outline button-round" onClick="locationpopup(' + locTitle + ');">' + quickButton[q].title + '</a></p>';
                        } else {
                          var qLoad = "'" + quickButton[q].payload + "'";
                          var qType = "'" + quickButton[q].content_type + "'";
                          var qTitle = "'" + quickButton[q].title + "'";
                          myMsg += '<p style="float:left;margin-left:5px;"><a href="#" class="col button button-outline button-round" onClick="chatLink(' + qLoad + ',' + qType + ',' + qTitle + ');">' + quickButton[q].title + '</a></p>';
                        }
                      });
                    }
                    myMsg += '</div></div></div>';
                    $$(".chatmsg").append(myMsg);
                    myApp.preloader.hide();
                    messages.scroll(500);
                  } else {
                    if(sender !== otherend) {
                      oldReceviedMsg = '<div class="message message-last message-received" style="display:inline-block;">' +
                        '<div style="background-image:url(' + image + ');float:left;margin:0px 10px 0px 5px;" class="message-avatar"></div>' +
                        '<div class="message-content">'+
                        '<div class="message-name" style="display:block;">' + otherEndName + '</div>' +
                        '<div class="message-bubble">'+
                        '<div class="message-text">' + message + '</div>' +
                        '</div></di'+
                        '</div>';
                      $$(".chatmsg").append(oldReceviedMsg);
                      myApp.preloader.hide();
                    } else {
                      //console.log("Message : ", message);
                      if(message == 'payload') {
                        message = messageT.payload.title;
                      } else {
                        message = message;
                      }
                      oldSentMessages = '<div class="messages-title"><span>' + dateTime + '</span></div>' +
                        '<div class="message message-sent">' +                          
                        '<div class="message-avatar" style="background-image:url(' + userImage + '); opacity:1;"></div>' +
                        '<div class="message-content"><div class="message-bubble">'+
                        '<div class="message-text">'+message+'</div>'+
                        '</div></div>'+
                        '</div>';
                      $$(".chatmsg").append(oldSentMessages);
                      message = '';
                      myApp.preloader.hide();
                      if(message2) {
                        console.log("Message 2: ", message2);
                        //myApp.preloader.show();
                        messages.scroll(500);
                      }
                    }
                  }
                }
              });
            });
            setTimeout(function () {
              messages.scroll(500);
              myApp.preloader.hide();
              // $('.messages-content').animate({
              //   scrollTop: $('.messages-content')[0].scrollHeight
              // }, 20);
            }, 1000);
            firebase.database().ref("/directcabschat/"+tripid+"/"+otherend+"/messages").off("child_added");
          });

          $$("#send").on('click', function (e) {
            e.preventDefault();
            messages.scroll(500);
            var newMsg = $$(".chatmessage").val();
            message2 = $$(".chatmessage").val();
            if(newMsg.length !== 0) {
              saveChatMessage(otherend, tripid, driverno, newMsg);
              myMessagebar.clear();
              firebase.database().ref("/directcabschat/"+tripid+"/"+otherend+"/messages").off("value");
            }
          });
        } else {
          console.log("Sorry, you have to Sign In for chat with your friend.");
          myApp.loginScreen.open(".login-screen");
        }
      }
    }
  },
  {
    path: '/chatinvite/',
    url: './chatinvite.html',
    on: {
      pageInit: function (e, page) {
        // https://console.firebase.google.com/project/project-1956585320571671692/database/socialrecharge/data/directcabschat/
        var usermobile = window.localStorage.getItem("usermobile");
        $$(".friendlist").html("");
        myApp.preloader.show();
        userName = window.localStorage.getItem("username");
        userImage = window.localStorage.getItem("userimage");
        var chatval = window.localStorage.getItem("chatusers");
        if(chatval) {
          chatval = JSON.parse(chatval);
          //console.log(chatval);
          $.each(chatval, function(key,userKey) {
            var authUserKey = (userKey % 2);
            //console.log("UserKey : ", authUserKey);
            if(authUserKey == 0 || authUserKey == 1) {
              firebase.database().ref("/chatfbuser/" + userKey + "/fname/").once("value").then(function (nameval) {
                var name = nameval.val();
                if(!name) {
                  name = userKey;
                }
                firebase.database().ref("/presence/" + userKey).on("value", function (onoffstat) {
                  //$$(".friendlist").html("");
                  if(onoffstat.exists()) {
                    if(onoffstat.val().status === "online") {
                      var friendStat = '<li><a href="/chat/' + userKey + '/" class="item-link item-content" style="text-decoration:none;">' +
                        '<div class="item-media"><img src="assets/img/avatar.png" width="36" height="36"></div>'+
                        '<div class="item-inner" style="padding:5px 15px 5px 0px;margin-left:10px;">'+
                        '<div class="item-title-row"><div class="item-title">'+name+'</div>'+
                        '<div class="item-after"><img src="assets/img/online.png"></div></div>'+
                        '<div class="item-subtitle">Let\'s Chat with Friends.</div>'+
                        '</div>'+
                        '</a></li>';
                      $$(".friendlist").append(friendStat);
                      myApp.preloader.hide();
                    } else {
                      var friendStat = '<li><a href="/chat/'+ userKey +'/" class="item-link item-content" style="text-decoration:none;">' +
                        '<div class="item-media"><img src="assets/img/avatar.png" width="36" height="36"></div>'+
                        '<div class="item-inner" style="padding:5px 15px 5px 0px;margin-left:10px;">'+
                        '<div class="item-title-row"><div class="item-title">'+name+'</div>'+
                        '<div class="item-after"><img src="assets/img/offline.png"></div></div>'+
                        '<div class="item-subtitle">Let\'s Chat with Friends.</div>'+
                        '</div>'+
                        '</a></li>';
                      $$(".friendlist").append(friendStat);
                      myApp.preloader.hide();
                    }
                  } else {
                    var friendStat = '<li><a href="/chat/'+ userKey +'/" class="item-link item-content" style="text-decoration:none;">' +
                      '<div class="item-media"><img src="assets/img/avatar.png" width="36" height="36"></div>'+
                      '<div class="item-inner" style="padding:5px 15px 5px 0px;margin-left:10px;">'+
                      '<div class="item-title-row"><div class="item-title">'+name+'</div>'+
                      '<div class="item-after"><img src="assets/img/offline.png"></div></div>'+
                      '<div class="item-subtitle">Let\'s Chat with Friends.</div>'+
                      '</div>'+
                      '</a></li>';
                    $$(".friendlist").append(friendStat);
                    myApp.preloader.hide();
                  }
                });
              });
            } else {
              firebase.database().ref("/brand/" + userKey + "/brand_name/").once("value").then(function (nameval) {
                var brandName = nameval.val();
                if(!brandName) {
                  brandName = userKey;
                }
                firebase.database().ref("/presence/" + userKey).on("value", function (onoffstat) {
                  //$$(".friendlist").html("");
                  if(onoffstat.exists()) {
                    if(onoffstat.val().status === "online") {
                      var friendStat = '<li><a href="/srchat/'+ userKey +'/" class="item-link item-content" style="text-decoration:none;">' +
                        '<div class="item-media"><img src="assets/img/avatar.png" width="36" height="36"></div>' +
                        '<div class="item-inner" style="padding:5px 15px 5px 0px;margin-left:10px;">'+
                        '<div class="item-title-row"><div class="item-title">'+brandName+'</div>'+
                        '<div class="item-after"><img src="assets/img/online.png"></div></div>'+
                        '<div class="item-subtitle">Let\'s Chat with Friends.</div>'+
                        '</div>'+
                        '</a></li>';
                      $$(".friendlist").append(friendStat);
                      myApp.preloader.hide();
                    } else {
                      var friendStat = '<li><a href="/srchat/'+ userKey +'/" class="item-link item-content" style="text-decoration:none;">' +
                        '<div class="item-media"><img src="assets/img/avatar.png" width="36" height="36"></div>' +
                        '<div class="item-inner" style="padding:5px 15px 5px 0px;margin-left:10px;">'+
                        '<div class="item-title-row"><div class="item-title">'+brandName+'</div>'+
                        '<div class="item-after"><img src="assets/img/offline.png"></div></div>'+
                        '<div class="item-subtitle">Let\'s Chat with Friends.</div>'+
                        '</div>'+
                        '</a></li>';
                      $$(".friendlist").append(friendStat);
                      myApp.preloader.hide();
                    }
                  } else {
                    var friendStat = '<li><a href="/srchat/'+ userKey +'/" class="item-link item-content" style="text-decoration:none;">' +
                      '<div class="item-media"><img src="assets/img/avatar.png" width="36" height="36"></div>' +
                      '<div class="item-inner" style="padding:5px 15px 5px 0px;margin-left:10px;">'+
                      '<div class="item-title-row"><div class="item-title">'+brandName+'</div>'+
                      '<div class="item-after"><img src="assets/img/offline.png"></div></div>'+
                      '<div class="item-subtitle">Let\'s Chat with Friends.</div>'+
                      '</div>'+
                      '</a></li>';
                    $$(".friendlist").append(friendStat);
                    myApp.preloader.hide();
                  }
                });
              });
            }
          });
        } else {
          myApp.dialog.alert("Yet, you havn\'t intiated chat with anyone.", function(){
              mainView.router.navigate("/srchat/CTPrfPTL0WeRVSFEXJNLA63DzuG2/");
          });
          myApp.preloader.hide();
        }
      },
    }
  },
  {
    path: '/settings/',
    url: './settings.html',
    on: {
        pageInit: function (e, page) {
          setTimeout(function () {
          $('.input-phone').intlInputPhone({
              preferred_country: ['in', 'us', 'gb']
            });
          }, 500);
          var usermobile = window.localStorage.getItem('usermobile');
          var userName = window.localStorage.getItem("username") +" "+window.localStorage.getItem("userlname");
          var userImage = (window.localStorage.getItem("userimage")!="undefined") ? window.localStorage.getItem("userimage") : "assets/img/avatar.png";
          $('.userimage').attr('src', userImage);
          $('.username').html(userName);
          $('.usernum').html(usermobile);
          if(myApp.sheet.get('.sheet-modal').opened) {
            myApp.sheet.close();
            $(".locationform").css("display","none");
          }
          firebase.database().ref('chatfbuser/'+usermobile+'/home').on('value', function(homesnap){
            if(homesnap.exists()) {
              $('.home').html('');
              $('.home').html('<a href="/address/home/" class="item-link item-content">'+
              '<div class="item-media" style="margin:5px -20px 0px 0px;"><i class="fa fa-home fa-lg" style="color:gray;"></i></div>'+
              '<div class="item-inner"><div class="item-title">Home</div><div class="item-subtitle">'+homesnap.val()+'</div></div></a>');
            }
          });
          firebase.database().ref('chatfbuser/'+usermobile+'/work').on('value', function(worksnap){
            if(worksnap.exists()) {
              $('.work').html('');
              $('.work').html('<a href="/address/work/" class="item-link item-content">'+
              '<div class="item-media" style="margin:5px -20px 0px 0px;"><i class="fa fa-briefcase fa-lg" style="color:gray;"></i></div>'+
              '<div class="item-inner"><div class="item-title">Work</div><div class="item-subtitle">'+worksnap.val()+'</div></div></a>');
            }
          });
        },
      }
  },
  {
    path: '/places/:type',
    url: './places.html',
    on: {
      pageInit: function (e, page) {
        var usermobile = window.localStorage.getItem('usermobile');
        if(myApp.sheet.get('.sheet-modal').opened) {
          myApp.sheet.close();
          $(".locationform").css("display","none");
        }
        var params = page.route.params;
        if(params.type == 'settings') {
          $(".placelink").attr("href","/settings/");
          firebase.database().ref('chatfbuser/'+usermobile).once('value').then( function(usersnap){
            if(usersnap.val().home){
              $('.home').html('');
              $('.home').html('<a href="/address/home/" class="item-link item-content">'+
              '<div class="item-media" style="margin:5px -20px 0px 0px;"><i class="fa fa-home fa-lg" style="color:gray;"></i></div>'+
              '<div class="item-inner"><div class="item-title">Home</div><div class="item-subtitle">'+usersnap.val().home+'</div></div></a>');
            }
            if(usersnap.val().work){
              $('.work').html('');
              $('.work').html('<a href="/address/work/" class="item-link item-content">'+
              '<div class="item-media" style="margin:5px -20px 0px 0px;"><i class="fa fa-briefcase fa-lg" style="color:gray;"></i></div>'+
              '<div class="item-inner"><div class="item-title">Work</div><div class="item-subtitle">'+usersnap.val().work+'</div></div></a>');
            }
          });
        } else {
          $(".placelink").attr("href","/");
          $('.home').html('');
          $('.work').html('');
          $('.favorites').css('display', 'none');
          $('.place').html('Choose a Place');
        }
      },
    }
  },
  {
    path: '/address/:type',
    url: './address.html',
    on: {
      pageInit: function (e, page) {
        var usermobile = window.localStorage.getItem('usermobile');
        var params = page.route.params;
        $('.input-clear-button').click();
        $('#add').geocomplete({
          details: "#addaddress",
          types: ["geocode", "establishment"],
        });
        //console.log(params.type);
        if(myApp.sheet.get('.sheet-modal').opened) {
          myApp.sheet.close();
          $(".locationform").css("display","none");
        }
        var prevpage = mainView.router.previousRoute;
        //console.log(prevpage);
        setTimeout(function(){
          $('#add').focus();
          $("#add").geocomplete().bind("geocode:result", function(event, result){
            var stringifyData = JSON.stringify(result);
            var jsonData = JSON.parse(stringifyData);
            var adr_address = jsonData['adr_address'];
            //console.log(adr_address);
            adr_address = '<div>' + adr_address + '</div>';            
            var lat = jsonData['geometry']['location']['lat'];
            var lng = jsonData['geometry']['location']['lng'];
            //var address = jsonData['formatted_address'];
            if($(adr_address).find("span[class^='street-address']").text()) {
              var address = $(adr_address).find("span[class^='street-address']").text() +', '+$(adr_address).find("span[class^='extended-address']").text()+', '+$(adr_address).find("span[class^='locality']").text();
            } else {
              var address = $(adr_address).find("span[class^='extended-address']").text()+', '+$(adr_address).find("span[class^='locality']").text();;
            }
            console.log(address);
            if(params.type == 'home') {
              firebase.database().ref('chatfbuser/'+usermobile).update({
                'home':address,
                'homelat':lat,
                'homelng':lng
              }).then(function(){
                if(prevpage.url == '/' || prevpage.url == '/android_asset/www/index.html') {
                  mainView.router.navigate('/');
                } else {
                  mainView.router.navigate(prevpage.url);
                }
              });
            }
            if(params.type == 'work') {
              firebase.database().ref('chatfbuser/'+usermobile).update({
                'work':address,
                'worklat':lat,
                'worklng':lng
              }).then(function(){
                if(prevpage.url == '/' || prevpage.url == '/android_asset/www/index.html') {
                  mainView.router.navigate('/');
                } else {
                  mainView.router.navigate(prevpage.url);
                }
              });
            }
          });
        }, 500);
      },
    }
  },
  {
    path: '/usershare/',
    url: './usershare.html',
    on: {
        pageInit: function (e, page) {
          console.log("User Share");
          $("#userShare").jsSocials({
            shares: ["facebook", "whatsapp", "email", "twitter", "googleplus", "linkedin",],
            url: 'https://www.socialrecharge.com/cabs',
            text: "Your friend want to chat with you.",
            showLabel: false,
            showCount: false,
            shareIn: "popup",
            on: {
                click: function(e) { console.log(e); },
                mouseenter: function(e) {},
                mouseleave: function(e) {},
            }
          });
        },
      }
  },
  {
    path: '/directride/:mobile',
    url: './directride.html',
    on: {
      pageInit: function (e, page) {
        myApp.preloader.show();
        var usermobile = window.localStorage.getItem('usermobile');
        var pick_lat = '';
        var pick_lng = '';
        var params = page.route.params;
        var driverno = params.mobile;
        console.log("Driver No :", driverno);
        if(myApp.sheet.get('.sheet-modal').opened) {
          myApp.sheet.close();
        }
        var drivers = [];
        var map2 = new GMaps({
          el: '#dirmapcanvas',
          lat: 28.496530,
          lng: 77.088580,
          disableDefaultUI: true,
          clickableIcons: false,
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
        $('#dirpickup_loc').geocomplete({
            details: "#dirpickup",
            types: ["geocode", "establishment"],
        });
        $('#dirdrop_loc').geocomplete({
            details: "#dirdrop",
            types: ["geocode", "establishment"],
        });
        cordova.plugins.locationServices.geolocation.getCurrentPosition(function(position) {
          console.log('Latitude: '+position.coords.latitude+', '+'Longitude: '+position.coords.longitude); 
          var geocoder = new google.maps.Geocoder();
          var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          pick_lat = position.coords.latitude;
          pick_lng = position.coords.longitude;
          myApp.preloader.hide();
          $('#dirlatitude_p').val(pick_lat);
          $('#dirlongitude_p').val(pick_lng);
          $('#dirmapcanvas').css("position","initial");
          map2.setCenter(pick_lat, pick_lng);
          map2.addMarker({
            lat: pick_lat,
            lng: pick_lng,
            title: 'You',
            icon : 'img/user.png'
          });
          firebase.database().ref('sr_driver/'+driverno+'/profile/driver_status').once('value').then(function(driverres){
            if(driverres.val() == "free"){
              drivers.push(driverno);
            }
          });
          map2.addMarker({
            lat: pick_lat,
            lng: pick_lng,
            title: 'Driver Location',
            zoomIn: 10,
            icon : 'img/car.png'
          });
          if (geocoder) {
            geocoder.geocode({ 'latLng': latLng}, function (results, status) {
               if (status == google.maps.GeocoderStatus.OK) {
                 console.log(results[0].formatted_address); 
                 $('#dirpickup_loc').val(results[0].formatted_address);
                 $('#dirpick_add').val(results[0].formatted_address);
                 $('#dirpickup_loc').prop("disabled", true);
                 $('#close_dirpickup').prop("disabled", true);
               } else {
                $('#dirpickup_loc').val('');
                console.log("Geocoding failed: " + status);
               }
            });
          } 
        }, function(error) {
          console.error(error);
        });
        setTimeout(function(){
          myApp.preloader.hide();
          $("#dirpickup_loc").geocomplete().bind("geocode:result", function(event, result){
            var stringifyData = JSON.stringify(result);
            var jsonData = JSON.parse(stringifyData);
            console.log(jsonData['geometry']['location']['lat']);
            pick_lat = jsonData['geometry']['location']['lat'];
            pick_lng = jsonData['geometry']['location']['lng'];

            map2.setCenter(pick_lat, pick_lng);
            map2.addMarker({
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
              console.log("lat : "+lat+", lng : "+lng);
              
              firebase.database().ref('sr_driver/'+key+'/profile/driver_status').once('value').then(function(res){
                // if(res.val() == "free" || res.val() == "a_finish"){
                if(res.val() == "free"){
                  console.log(key);
                  drivers.push(key);
                }
              });
              map2.addMarker({
                lat: lat,
                lng: lng,
                title: 'Driver Location',
                zoomIn: 5,
                icon : 'img/car.png'
              });
            });
          });

          // Use new from http://jsfiddle.net/6LwgQ/2/
          $("#dirdrop_loc").geocomplete().bind("geocode:result", function(event, result){
            // console.log('Geo complete result:', result);
            var stringifyData = JSON.stringify(result);
            // console.log('Geo complete result with stringify:', stringifyData);
            var jsonData = JSON.parse(stringifyData);
            // console.log('Geo complete result with json.parse:', jsonData);
            console.log(jsonData['geometry']['location']['lat']);
            var drop_lat = jsonData['geometry']['location']['lat'];
            var drop_lng = jsonData['geometry']['location']['lng'];
            var drop_add = jsonData['formatted_address'];
            var pick_lat = $('#dirlatitude_p').val();
            var pick_lng = $('#dirlongitude_p').val();
            map2.renderRoute({
              origin: [pick_lat, pick_lng],
              destination: [drop_lat, drop_lng],
              travelMode: 'driving',
              strokeColor: '#131540',
              strokeOpacity: 0.6,
              strokeWeight: 6
            }, {
              //panel: '#dirdirections',
              draggable: true,
              suppressMarkers: true,
              preserveViewport: true
            });
          // });
          // $$(".dirsubmitRide").on("click", function (e) {
            console.log(drivers);
            //myApp.preloader.show();
            var pick_lat = $('#dirlatitude_p').val();
            var pick_lng = $('#dirlongitude_p').val();
            var pick_add = $('#dirpick_add').val();
            var drop_lat = $('#dirlatitude_drop').val();
            var drop_lng = $('#dirlongitude_drop').val();
            var drop_add = $('#dirdrop_add').val();
            var dirpickup_loc = $('#dirpickup_loc').val();
            var dirdrop_loc = $('#dirdrop_loc').val();
            var pick_latlong = pick_lat+","+pick_lng;
            var drop_latlong = drop_lat+","+drop_lng;
            console.log(pick_lat+"  "+pick_lng+"  "+drop_lat+"  "+drop_lng+"<br>"+pick_add+"<br>"+drop_add);
            if(pick_add && drop_add && dirpickup_loc && dirdrop_loc) {
              var dist = getDistance(pick_lat,pick_lng,drop_lat,drop_lng).toFixed(2);
              var distRound = Math.round(dist);
              console.log("distRound : "+distRound);
              if(distRound < 100) {
                console.log("dist : "+dist);
                firebase.database().ref('chatfbuser/'+usermobile+"/rides/1").update({
                  'pick_latlong':pick_latlong,
                  'drop_latlong':drop_latlong,
                  'pickup_address':pick_add,
                  'drop_address':drop_add
                }).then(function(){
                  var newD = JSON.stringify(drivers);
                  $.ajax({
                    url: "https://www.socialrecharge.com/brand/firebase/sr_driver_price.php",
                    type: "POST",
                    data: {driversData:newD, fbid:usermobile},
                    dataType: 'json',
                    cache: false,
                    success: function(result) {
                        if(result){
                          // console.log(result);
                          var data = JSON.parse(result);
                          saveArrMessage('cabs', usermobile, data);
                          window.localStorage.setItem("rideData", result);
                          $('#dirdrop_loc').prop("disabled", false);
                          $('#close_dirpickup').prop("disabled", false);
                          mainView.router.navigate("/");
                        }
                    },
                  });
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
      }
    }
  },
  {
    path: '/cabs/:type',
    url: './cabs.html',
    on: {
      pageInit: function (e, page) {
        $$(".cabs").empty();
        var params = page.route.params;
        var usermobile = window.localStorage.getItem('usermobile');
        myApp.preloader.show();
        var otherend = "cabs";
        otherend2 = "'"+otherend+"'";
        var message = '';
        var messageT = '';
        var msgAttach = '';
        var messages = myApp.messages.create({
          el: '.cabs',
        });
        var myMessagebar = myApp.messagebar.create({
          el: '.messagebar',
          attachments: []
        });
        var dateTime = $.timeago(new Date());
        var otherEndName = otherend;
        var image = "assets/img/tmp/ava4.jpg";
        if(usermobile) {
          firebase.database().ref("/chat/"+usermobile+"/"+otherend+"/messages").off("child_added");
          userName = window.localStorage.getItem("username");
          userImage = window.localStorage.getItem("userimage");
          $$(".cabs").html('');
          firebase.database().ref("/chat/"+usermobile+"/"+otherend)
          .once("value").then(function (chatstat) {
            console.log("chat existance : ", chatstat.exists());
            if(chatstat.exists()) {
              var ref = firebase.database().ref("/chat/" + usermobile + "/" + otherend + "/messages");
              ref.once("value", function (messagesnap) {
                console.log("existance : ", messagesnap.exists());
                ref.limitToLast(50).on("child_added", function (oldmsgsnap) {
                  //console.log(oldmsgsnap.val());
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
                  //ref.off("child_added");
                });
              });
              //firebase.database().ref("/chat/"+usermobile+"/"+otherend+"/messages").off("child_added");
            } else {
              $.ajax({
                url: 'https://www.socialrecharge.com/brand/firebase/sr_directcabs.php',
                //url: 'https://srdirectcabs.herokuapp.com/srchat/direct',
                type: 'POST',
                data: {"action":'direct',"mobile": usermobile,"payload":(payload || '')},
                success: function (data) {
                  if(data) {                    
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
          // firebase.database().ref("srchatcabs/"+usermobile+"/").on("child_changed", function(tripdata){
          //   console.log(tripdata.val());
          //   if(tripdata.val()) {
          //     var messageT = tripdata.val().message;
          //     chatUI(otherend, dateTime, messageT, 'cabs');
          //   }
          //   //firebase.database().ref("srchatcabs/"+usermobile+"/").off("child_added");
          // });
        } else {
          myApp.preloader.hide();
          console.log("Sorry, you have to Sign In for chat with your friend\'s.");
          myApp.loginScreen.open(".login-screen");
        }
      },
    }
  },
  {
    path: '/refer/',
    url: './refer.html',
    on: {
      pageInit: function (e, page) {
        var userNum = window.localStorage.getItem('usermobile');
        if(myApp.sheet.get('.sheet-modal').opened) {
          myApp.sheet.close();
          $(".locationform").css("display","none");
        }
        firebase.database().ref('chatfbuser/'+userNum+'/sharelink').once('value',function(sharelink){
          if(!sharelink.exists()){
            var link = "https://directapp.page.link/?link=https://directcabs.in/ride/?customer="+userNum+"&apn=com.directcabs.scvpl&ibi=com.directcabs.scvpl&isi=1468473753&efr='1'&st=Direct Cabs&sd=Refer a Customer";
            $.ajax({
              url: `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${MAP_API_KEY}`,
              type: "POST",
              data: {longDynamicLink:link},
              dataType: 'application/json',
              success: function(data) {
                console.log(data);
                if(data){
                  console.log("data :", data);
                }
              },
              error: function (textStatus, errorThrown) {
                var result = JSON.parse(textStatus.responseText);
                var shortLink = result.shortLink;
                console.log("shortLink :", result.shortLink);
                if(shortLink) {
                  firebase.database().ref('chatfbuser/'+userNum).update({
                    sharelink: shortLink,
                  });
                }
              }
            });
          }
        });

        $$("#liNum").html('');
        var amount = 0;
        var totalInvitee = 0;
        firebase.database().ref("chatfbuser/"+userNum+"/invitee/").once('value',function(invitesnap){
          if(invitesnap.exists()){
            invitesnap.forEach(function(inviteval){
              if(inviteval.val().refertype == "customer") {
                var number = inviteval.val().invitee;
                var type = inviteval.val().refertype;
                amount = (amount + parseInt(inviteval.val().amount));
                $$('#amountNum').html(amount);
                totalInvitee = (totalInvitee + 1);
                $$('#inviteNum').html(totalInvitee);
                $$("#dataNum").show();
                $$("#liNum").show();
                var inviteData = '<div class="item-content">'+
                      '<div class="item-media">'+
                          '<i class="fa fa-user-circle" aria-hidden="true"></i>'+
                      '</div>'+
                      '<div class="item-inner">'+
                          '<div class="item-title" id="userNum">'+number+' ('+type+')</div>'+
                          '<div class="item-after" id="dateNum">'+inviteval.val().amount+
                          '</div>'+
                      '</div>'+
                  '</div>';
                $$("#liNum").append(inviteData);  
              }
            });
          } else {
            console.log("node doesn't exists");      
            $$('#amountNum').html('0');
            $$('#inviteNum').html('0'); 
          }  
        });

        $$("#inviteuser").on("click", function(e){
          firebase.database().ref('chatfbuser/'+userNum+'/sharelink').once('value',function(sharesnap){
            if(sharesnap.exists()){
              window.plugins.socialsharing.share('Refer a customer', null, null, sharesnap.val());
            }
          });
        });
      }
    }
  },
  {
    path: '/feedback/',
    url: './feedback.html',
    on: {
      pageInit: function (e, page) {
        var userNum = window.localStorage.getItem('usermobile');
        myApp.preloader.show();
        var arrayToDataTable = [['Task', 'Hours per Day']];
        if(myApp.sheet.get('.sheet-modal').opened) {
          myApp.sheet.close();
          $(".locationform").css("display","none");
        }
        firebase.database().ref("chatfbuser/"+userNum+"/ratereason/").once('value',function(ridesnap){
          if(ridesnap.exists()){
            ridesnap.forEach(function(rideval){
              //console.log(rideval.key+" - "+rideval.val());
              var myArray = [];
              myArray.push(rideval.key);
              myArray.push(rideval.val());
              arrayToDataTable.push(myArray);
            })
          }
        });
        setTimeout(function(){
          console.log("myArray :", arrayToDataTable);
          google.charts.load('current', {'packages':['corechart']});
          google.charts.setOnLoadCallback(drawChart);
          function drawChart() {
            // var data = google.visualization.arrayToDataTable([
            //   ['Task', 'Hours per Day'],
            //   ['Cleanliness',     9],
            //   ['Behaviour',      8],
            //   ['Late',  5],
            //   ['Payment', 4],
            //   ['Cancel',    4]
            // ]);
            var data = google.visualization.arrayToDataTable(arrayToDataTable);

            var options = {
              title: 'Activities'
            };

            var chart = new google.visualization.PieChart(document.getElementById('piechart'));

            chart.draw(data, options);
          }
          myApp.preloader.hide();
        }, 1000);
      }
    }
  },
  {
    path: '/trips/',
    //path: '/trips/:pDate/:pEndDate/:refund',
    url: './trips.html',
    on: {
      pageInit: function (e, page) {
        myApp.preloader.show();
        var usermobile = window.localStorage.getItem('usermobile');
        if(myApp.sheet.get('.sheet-modal').opened) {
          myApp.sheet.close();
          $(".locationform").css("display","none");
        }
        var params = page.route.query;
        // if(params.refund) {
        //     $('input[name="fil_refund"]').val(params.refund);
        // } else {
            $('input[name="fil_refund"]').val('');
        //}
        console.log(params.pDate);
        console.log(params.pEndDate);
        if(params.pDate) {
            var pDate = params.pDate;
            var pEndDate = params.pEndDate;
        } else {
            var today = new Date();
            var unix2 = Math.round(today/1000);
            var pEndDate = unix2;
            //today.setMonth(today .getMonth() - 1);
            today.setDate(today.getDate() - 1);
            console.log(today);
            //var unix = today.getTime();
            var unix = Math.round(today/1000);
            var pDate = unix;
        }
        var myDate = new Date(pDate*1000);
        console.log("myDate - "+myDate);
        pDate = pDate*1000;
        pEndDate = pEndDate*1000;

        //$$(".export_pay").attr("onClick","exportData("+pDate+", "+pEndDate+");");
        $$('.triplist').html("");
        var i=0;
        var first_ord = '';
        var last_ord = '';
        firebase.database().ref("chatfbuser/"+usermobile+"/trips").orderByChild('stop_timestamp').startAt(pDate).endAt(pEndDate).once('value', function(tripsnapshot){
          console.log(tripsnapshot.exists());
          if(tripsnapshot.exists())
          {
            tripsnapshot.forEach(function(tripshot){
              firebase.database().ref("chatfbuser/"+usermobile+"/trips/"+tripshot.key+"/requestd_drivers/").once('child_added').then(function(rootSnapshot){
                if(rootSnapshot.exists())
                {
                  var rootObj = rootSnapshot.val();
                  //console.log(rootObj);
                  if(rootObj.additional_fare) {
                    var addFare = '<div class="row">'+
                                      '<div class="col-50 ml-10 item-title">'+rootObj.charge_type+' Charge: </div>'+
                                      '<div class="col-50 item-after">'+rootObj.additional_fare+'</div>'+
                                  '</div>';
                    var totalFare = parseInt(rootObj.updated_fare) + parseInt(rootObj.additional_fare);
                  } else {
                    var addFare = '';
                    var totalFare = rootObj.updated_fare;
                  }
                  var stopAt = rootObj.stopAt;
                  var stopLocArray = stopAt.split(",");
                  var lat = stopLocArray[0];
                  var lng = stopLocArray[1];
                  url = GMaps.staticMapURL({
                    //size: [610, 300],
                    lat: lat,
                    lng: lng
                  });
                  url = url.replace(/^http:\/\//i, 'https://');
                  url += `&key=${MAP_API_KEY}`;
                  $.ajax({                    
                    url: 'https://www.socialrecharge.com/brand/firebase/sr_directcabs.php',
                    type: 'POST',
                    data: {"action":'address',"latlong": stopAt},
                    success: function (result)
                    {
                      var data = JSON.parse(result);
                      //console.log(data);
                      var address = data.results[0].formatted_address;
                      //console.log(address);
                      var template = '<li class="card" style="color:black;">'+
                        '<div class="card-header">Trip ID : '+tripshot.key+'</div>'+
                        '<div class="card-content"><img src="'+url+'" width="100%" height="150"></div>'+
                        '<div class="card-content">'+
                          '<div class="item-content">'+
                            '<div class="item-inner">'+
                              '<div class="row">'+
                                  '<div class="col-50 ml-10 item-title">Total Fare :</div>'+
                                  '<div class="col-50 item-after">'+totalFare+'</div>'+
                              '</div>'+addFare+
                              '<div class="row">'+
                                  '<div class="col-50 ml-10 item-title">Date :</div>'+
                                  '<div class="col-50 item-after">'+rootObj.accept_time+'</div>'+
                              '</div>'+
                              '<div class="row">'+
                                  '<div class="col-50 ml-10 item-title">Status :</div>'+
                                  '<div class="col-50 item-after">'+rootObj.status+' <span style="display:none;">'+rootSnapshot.key+'</span></div>'+
                              '</div>'+
                              // '<div class="row">'+
                              //     '<div class="col-50 ml-10 item-title">Earnings :</div>'+
                              //     '<div class="col-50 item-after">'+rootObj.earnings+' <span style="display:none;">'+rootSnapshot.key+'</span></div>'+
                              // '</div>'+
                            '</div>'+
                          '</div>'+                                  
                        '</div>'+
                        '<div class="card-footer" style="padding: 5px;">'+
                          '<div class="row">'+
                              //'<div class="col-auto">'+
                                  '<div class="ml-5 item-title"><b>Dropped Address :</b></div>'+
                                  '<div class="item-title-row">'+address+'</div>'+
                              //'</div>'+
                          '</div>'+
                        '</div>'+
                      '</li>';
                      $$('.triplist').prepend(template);
                      myApp.preloader.hide();
                    }
                  });
                }
              });
            });
            myApp.preloader.hide();
          } else {
            var template1 = '<li><div class="item-content"><div class="item-inner"><div class="item-title" style="text-align: center; white-space: inherit;">Sorry, yet you havn\'t make any transcation with us.</div></div></div></li>'+
            '<div style="padding:15px;">'+
                '<a href="#" onClick="refreshPayData();" class="button button-raised button-fill button-primary" style="width:100%;">Refresh</a>'+
            '</div>';
            $$('.triplist').prepend(template1);
            myApp.preloader.hide();
          }
        });

        $('#datefrom').click(function()
        {
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth()+1; //January is 0!
            var yyyy = today.getFullYear();
             if(dd<10){
                    dd='0'+dd
                } 
                if(mm<10){
                    mm='0'+mm
                } 
            today = yyyy+'-'+mm+'-'+dd;
            $('input[name="datefrom"]').attr("max", today);
        });
      }
    }
  },
  {
    path: '/tabs-routable/',
    url: './pages/tabs-routable.html',
    tabs: [
      {
        path: '/',
        id: 'tab1',
        content: ' \
        <div class="block"> \
          <p>Tab 1 content</p> \
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ullam enim quia molestiae facilis laudantium voluptates obcaecati officia cum, sit libero commodi. Ratione illo suscipit temporibus sequi iure ad laboriosam accusamus?</p> \
          <p>Saepe explicabo voluptas ducimus provident, doloremque quo totam molestias! Suscipit blanditiis eaque exercitationem praesentium reprehenderit, fuga accusamus possimus sed, sint facilis ratione quod, qui dignissimos voluptas! Aliquam rerum consequuntur deleniti.</p> \
          <p>Totam reprehenderit amet commodi ipsum nam provident doloremque possimus odio itaque, est animi culpa modi consequatur reiciendis corporis libero laudantium sed eveniet unde delectus a maiores nihil dolores? Natus, perferendis.</p> \
        </div> \
        ',
      },
      {
        path: '/tab2/',
        id: 'tab2',
        content: '\
        <div class="block"> \
          <p>Tab 2 content</p> \
          <p>Suscipit, facere quasi atque totam. Repudiandae facilis at optio atque, rem nam, natus ratione cum enim voluptatem suscipit veniam! Repellat, est debitis. Modi nam mollitia explicabo, unde aliquid impedit! Adipisci!</p> \
          <p>Deserunt adipisci tempora asperiores, quo, nisi ex delectus vitae consectetur iste fugiat iusto dolorem autem. Itaque, ipsa voluptas, a assumenda rem, dolorum porro accusantium, officiis veniam nostrum cum cumque impedit.</p> \
          <p>Laborum illum ipsa voluptatibus possimus nesciunt ex consequatur rem, natus ad praesentium rerum libero consectetur temporibus cupiditate atque aspernatur, eaque provident eligendi quaerat ea soluta doloremque. Iure fugit, minima facere.</p> \
        </div> \
        ',
      },
    ],
  },
  {
    path: '/sidepage/',
    url: './pages/sidepage.html',
    fastClicks: false,
    on: {
      pageInit: function(e, page){
        app.fastClicks = false;
        var swiper = app.swiper.create('.swiper-container-sidepage', {
          spaceBetween: 10,
          slidesPerView: 3,
        });
      }
    }
  },
  {
    path: '/dynamicpage/:cat/:id',
    url: './pages/dynamicpage.html',
    on: {
      pageInit: function (e, page){
        //console.log("Page Route Query:",page.route.query);
        //console.log("Page Route Params:",page.route.params);
        var cat = page.route.params.cat;
        var id = page.route.params.id;
        myApp.preloader.show();

        var swiper = myApp.swiper.create('.swiper-container-dynamic', {
          spaceBetween: 2,
          direction: 'vertical',
          preloadImages: false,
          lazy: false,
          autoHeight: false,
          maxHeight: '98%',
        });

        var value = cat;
        var docRef = clientDB.ref("news/"+cat+"/approved");
        var currentUser = firebase.auth().currentUser;
        //console.log("CurrentUser:",currentUser);
        if ((currentUser)){
          var userNum = ((currentUser.phoneNumber).split('+'))[1];
          var userRef = clientDB.ref('enduser/'+userNum);
          userRef.once("value").then(function(doc) {
            if (doc.exists()){
              docRef.orderByKey().startAt(id)
              .once("value").then((catnewssnap)=>{
                console.log("Cat News are:",catnewssnap.val());
                catnewssnap.forEach((newssnap)=>{
                  //console.log("Key :",newssnap.key," Val :",newssnap.val());
                  //if(newssnap.val().status === "Approved"){
                    //console.log("Approved news :",newssnap.val().name);
                    clientDB.ref(cat+'/'+id)
                    .once('value',function(snapshot){
                      if(snapshot.exists()){
                        let valTemp = "'"+value+"'";
                        let docIdTemp = "'"+(newssnap.key)+"'";
                        let num = "'"+userNum+"'";
                        let content1 = (newssnap.val().name).replace(/\'/g,"");
                        let content = "'"+content1+"'";

                        let real = (snapshot.val() ? (snapshot.val().Real ? snapshot.val().Real : 0) : 0);
                        let fake = (snapshot.val() ? (snapshot.val().Fake ? snapshot.val().Fake : 0) : 0);
                        let total = snapshot.val().total;
                        real = Math.round((real > 0) ? ((real * 100)/total) : 0);
                        fake = Math.round((fake > 0) ? ((fake * 100)/total) : 0);

                        let userRef = clientDB.ref('enduser/'+userNum);
                        let voteRef = clientDB.ref('enduser/'+userNum+'/vote/'+newssnap.key);
                        let bookmarkRef = clientDB.ref('enduser/'+userNum+'/bookmarked/'+newssnap.key);
                        voteRef.once("value").then((votesnap)=>{
                          bookmarkRef.once("value").then((bookmarksnap)=>{
                          var bkmrdCol = ((bookmarksnap.exists()) ? ("blue") : ("black"));
                          var realEvent = '';
                          var fakeEvent = '';
                          var sourceUrl = "'"+newssnap.val().sourceurl+"'";
                          var source = '<a href="#" onClick="appBrowser('+sourceUrl+')" class="external"><p style="text-align: left; color: grey; font-size: 12px;">Read more at '+newssnap.val().source+'</p></a>';
                          source = ((newssnap.val().sourceurl) ? source : '');         
                          ((votesnap.exists()) ? ((votesnap.val().real === true) ? (realEvent = 'none') : ((votesnap.val().fake === true) ? (fakeEvent = 'none') : '')) : '');
                          var realChip = "bg-color-green";
                          var fakeChip = "bg-color-red";
                          ((votesnap.exists()) ? ((votesnap.val().real === true) ? (realChip = '') : ((votesnap.val().fake === true) ? (fakeChip = '') : '')) : '');
                          $$(".swiper-dynamic").prepend('<div class="swiper-slide" style="height: 100%;">'+
                            '<div class="card demo-facebook-card" style="height:100%;">'+
                            '<div class="card-content card-content-padding" style="padding:10px;height:90%;">'+
                            '<div class="img-holder">'+
                            '<img src='+newssnap.val().imgBg+' width="100%" style="max-height:160px;" class="swiper-lazy"/>'+
                            '</div>'+
                            '<div class="swiper-lazy-preloader"></div>'+
                            '<p style="text-align: left; color: '+bkmrdCol+';" id='+(newssnap.key)+' onClick="bookmarkIt('+content+','+docIdTemp+','+valTemp+');">'+newssnap.val().name+'</p>'+
                            '<p style="text-align: left; color: grey; font-size: initial; font-family: -webkit-body; font: inherit;">'+newssnap.val().description+'</p>'+
                            source+
                            '</div>'+
                            '<div class="card-footer">'+
                            '<a href="#" style="color: blue; pointer-events: '+realEvent+';" onClick="realCounter('+valTemp+', '+docIdTemp+', '+num+');" id="real'+value+(newssnap.key)+'">'+
                            '<div class="chip">'+
                            '<div class="chip-media '+realChip+'">'+
                            '<i class="icon f7-icons ios-only">check</i>'+
                            '<i class="icon material-icons md-only">check</i>'+
                            '</div>'+
                            '<div class="chip-label">Real ('+real+'%)</div>'+
                            '</div>'+
                            '</a>'+
                            '<a href="#" style="color: red; pointer-events: '+fakeEvent+'" onClick="fakeCounter('+valTemp+', '+docIdTemp+', '+num+');" id="fake'+value+(newssnap.key)+'">'+
                            '<div class="chip">'+
                            '<div class="chip-media '+fakeChip+'">'+
                            '<i class="icon f7-icons ios-only">close</i>'+
                            '<i class="icon material-icons md-only">close</i>'+
                            '</div>'+
                            '<div class="chip-label">Fake ('+fake+'%)</div>'+
                            '</div>'+
                            '</a>'+
                            '</div>'+
                            '<span style="width: -webkit-fill-available;" data-progress='+real+' class="progressbar color-green" id="progressbarreal'+value+(newssnap.key)+'"></span>'+
                            '</div>'+
                            '</div>');
                          // ((votesnap.exists()) ? ((votesnap.val().real === true) ? $$("#fake"+value+newssnap.key+" .chip .chip-media").addClass('bg-color-red') : ((votesnap.val().fake === true) ? $$("#real"+value+newssnap.key+" .chip .chip-media").addClass('bg-color-green') : '')) : '');
                          myApp.progressbar.show('#progressbarreal'+value+(newssnap.key), real, "green");
                          swiper.update();
                          swiper.slideTo(0);
                          myApp.preloader.hide();                  
                        });
                      });
                      }
                    });
                  //}
                });//End newssnap forEach
              });//End catnewssnap once value   
            } else {
              myApp.preloader.hide();
              console.log("Need to login.");
              myApp.router.navigate("/about/", {ignoreCache: true});
              return;
            }
          });
        } else {
          console.log("Need to login.");
          docRef.orderByKey().startAt(id)
          .once("value").then((catnewssnap)=>{
            // console.log("Cat News are:",catnewssnap.val());
            catnewssnap.forEach((newssnap)=>{
              //console.log("Key :",newssnap.key," Val :",newssnap.val());
              //if(newssnap.val().status === "Approved"){
                    clientDB.ref(cat+'/'+id)
                    .once('value',function(snapshot){
                      if(snapshot.exists()){
                        let valTemp = "'"+value+"'";
                        let docIdTemp = "'"+(newssnap.key)+"'";
                        let content1 = (newssnap.val().name).replace(/\'/g,"");
                        let content = "'"+content1+"'";
                        var sourceUrl = "'"+newssnap.val().sourceurl+"'";
                        var source = '<a href="#" onClick="appBrowser('+sourceUrl+')" class="external"><p style="text-align: left; color: grey; font-size: 12px;">Read more at '+newssnap.val().source+'</p></a>';
                        source = ((newssnap.val().sourceurl) ? source : '');
                        let real = (snapshot.val() ? (snapshot.val().Real ? snapshot.val().Real : 0) : 0);
                        let fake = (snapshot.val() ? (snapshot.val().Fake ? snapshot.val().Fake : 0) : 0);
                        let total = snapshot.val().total;
                        real = Math.round((real > 0) ? ((real * 100)/total) : 0);
                        fake = Math.round((fake > 0) ? ((fake * 100)/total) : 0);

                        $$(".swiper-dynamic").prepend('<div class="swiper-slide" style="height: 100%;"><div class="card demo-facebook-card" style="height:90%;"><div class="card-content card-content-padding" style="padding:10px; min-height:380px;"><img src='+newssnap.val().imgBg+' width="100%" style="max-height:160px;" class="swiper-lazy"/><div class="swiper-lazy-preloader"></div><p style="text-align: left; color: black;" id='+(newssnap.key)+' onClick="bookmarkIt('+content+','+docIdTemp+','+valTemp+');">'+newssnap.val().name+'</p><p style="text-align: left; color: grey; font-size: initial; font-family: -webkit-body; font: inherit;">'+newssnap.val().description+'</p>'+source+'</div><div class="card-footer"><a href="#" style="color: blue" onClick="realCounter('+valTemp+', '+docIdTemp+', '+null+');" id="real'+(value)+(newssnap.key)+'"><div class="chip"><div class="chip-media bg-color-green"><i class="icon f7-icons ios-only">check</i><i class="icon material-icons md-only">check</i></div><div class="chip-label">Real ('+real+'%)</div></div></a><a href="#" style="color: red" onClick="fakeCounter('+valTemp+', '+docIdTemp+', '+null+');" id="fake'+(value)+(newssnap.key)+'"><div class="chip"><div class="chip-media bg-color-red"><i class="icon f7-icons ios-only">close</i><i class="icon material-icons md-only">close</i></div><div class="chip-label">Fake ('+fake+'%)</div></div></a></div><span style="width: -webkit-fill-available;" data-progress='+real+' class="progressbar color-green" id="progressbarreal'+value+(newssnap.key)+'"></span></div></div>');
                        myApp.progressbar.show('#progressbarreal'+value+(newssnap.key), real, "green");
                        swiper.update();
                        swiper.slideTo(0);
                        myApp.preloader.hide();
                        //swiper.slideTo(0,0,false);
                      }
                    });
                  //}
                });
              });            
        // });
        }
      }
    }
  },
  // Default route (404 page). MUST BE THE LAST
  {
    path: '(.*)',
    url: './404.html',
  },
];