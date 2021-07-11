const socket = io("/"); //socket connection
const videoGrid = document.getElementById('video-grid');
const userDropDown = document.getElementById('myDropdown');
const myVideo = document.createElement('video');
myVideo.muted = true;
let text = $('input');

let grpParticipants = [];
let peers = {},
currentPeer = [];
let cUserPeerID;
let peersArray=[];
let conn;


console.log("organiser:", organiser);
console.log("Current user: ",YourName);

// socket.on("organiser-name", admin=>{
//   organiser = admin;
//   console.log("organiser:", admin);
// })


var peer = new Peer();

let myVideoStream;
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream);
  myVideoStream = stream;

  peer.on('call', call => {
    console.log("answered");

    call.answer(stream);

    const video = document.createElement('video');
    peers[call.peer] = call;
    //for normal calls
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
    //currentPeer = call.peerConnection;

    currentPeer.push(call.peerConnection);
    // Handle when the call finishes
    call.on('close', function() {
      video.remove();
    });
    // use call.close() to finish a call
  });

  socket.on('user-connected', (userId) => { //userconnected so we are now ready to share
    console.log('user ID fetch connection: ' + userId); //video stream
    // peersArray.push(peerDetails);
    // console.log("Peers Array: ",peersArray);
    connectToNewUser(userId, stream); //by this function which call user
  })

});




//if someone tries to join room
peer.on('open', async id => {
  cUserPeerID = id;
  // console.log("Current user: "+id);
  await socket.emit('join-room', ROOM_ID, id, YourName, username);

})

socket.on('user-disconnected', userId => { //userdisconnected so we now ready to stopshare
  if (peers[userId]) {
    peers[userId].close();
  }
  console.log('user ID fetch Disconnect: ' + userId);

});


const connectToNewUser = (userId, stream) => {
  console.log('User-connected :-' + userId);
  let call = peer.call(userId, stream); //we call new user and sended our video stream to him
  //currentPeer = call.peerConnection;

  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream); // Show stream in some video/canvas element.
  })
  call.on('close', () => {
    video.remove()
  })
  //currentPeer = call.peerConnection;
  peers[userId] = call;
  currentPeer.push(call.peerConnection);
  console.log(currentPeer);
}


const addVideoStream = (video, stream) => { //this help to show and append or add video to user side
  video.srcObject = stream;
  video.controls = true;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
}

//to Mute or Unmute Option method
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
  } else {
    setUnmuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setUnmuteButton = () => {
  const html = `<i class="fas fa-microphone"></i>`;
  document.querySelector('.mute-btn').innerHTML = html;
  console.log("You are Unmuted");
}

const setMuteButton = () => {
  const html = `<i class="fas fa-microphone-slash" style="color:#60928e;"></i>`;
  document.querySelector('.mute-btn').innerHTML = html;
  console.log("Muted");
}

//Video ON or OFF
const videoOnOff = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    unsetVideoButton();
  } else {
    setVideoButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setVideoButton = () => {
  const html = `<i class="fas fa-video"></i>`;
  document.querySelector('.video-btn').innerHTML = html;
  console.log("Camera Mode ON");
}

const unsetVideoButton = () => {
  const html = `<i class="fas fa-video-slash" style="color:#60928e;"></i>`;
  document.querySelector('.video-btn').innerHTML = html;
  console.log("Camera Mode OFF");
}

//code for disconnect from client
const disconnectNow = () => {
  window.location = "/chats";
}

//code to share url of roomId
const share = () => {
  var share = document.createElement('input'),
    text = window.location.href;

  console.log(text);
  document.body.appendChild(share);
  share.value = text;
  share.select();
  document.execCommand('copy');
  document.body.removeChild(share);
  alert('Copied');
}

// render previous Chats
socket.emit("loadChat", groupID);

socket.on("render chat", (data) => {
  console.log(data);
  const chats = data;
  $('ul').innerHTML = "";

  chats.forEach(function(chat) {
    let div = document.createElement("div");
    div.innerHTML =`<li class="message">
    <p style="color:#60928e;" class="user-name">${chat.name}</p>
    <p style="color:black;word-break:break-all;" class="user-msg">${chat.message}</p>
    </li>
    <br>`

    $('ul').append(div);
    scrollToBottom();
  });
});


//msg send from user

$('html').keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
    console.log(text.val());
    socket.emit("message", YourName,username, text.val(), groupID,ROOM_ID);
    text.val('')
  }
});

//Print msg in room
socket.on('createMessage', (msg, user) => {
  $('ul').append(`<li class="message">
  <p style="color:#60928e;" class="user-name">${user}</p>
  <p style="color:black;word-break:break-all;" class="user-msg">${msg}</p>
  </li>
  <br>`);
  scrollToBottom();
});


const scrollToBottom = () => {
  var d = $('.main-chat-window');
  d.scrollTop(d.prop("scrollHeight"));
}

//screenShare
const screenshare = () => {
  navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: 'always'
    },
    audio: {
      echoCancellation: true,
      noiseSupprission: true
    }

  }).then(stream => {
    let videoTrack = stream.getVideoTracks()[0];
    videoTrack.onended = function() {
      stopScreenShare();
    }
    for (let x = 0; x < currentPeer.length; x++) {

      let sender = currentPeer[x].getSenders().find(function(s) {
        return s.track.kind == videoTrack.kind;
      })

      sender.replaceTrack(videoTrack);
    }

  })

}

function stopScreenShare() {
  let videoTrack = myVideoStream.getVideoTracks()[0];
  for (let x = 0; x < currentPeer.length; x++) {
    let sender = currentPeer[x].getSenders().find(function(s) {
      return s.track.kind == videoTrack.kind;
    })
    sender.replaceTrack(videoTrack);
  }
}

//raised hand
const raisedHand = () => {
  const sysbol = "&#9995;";
  socket.emit('raise-hand-message', sysbol, YourName);
  unChangeHandLogo();
}

const unChangeHandLogo = () => {
  const html = `<i class="far fa-hand-paper" style="color:red;"></i>
                <span>Raised</span>`;
  document.querySelector('.raisedHand').innerHTML = html;
  console.log("change")
  changeHandLogo();
}

const changeHandLogo = () => {
  setInterval(function() {
    const html = `<i class="far fa-hand-paper" style="color:"white"></i>
                <span>Hand</span>`;
    document.querySelector('.raisedHand').innerHTML = html;
  }, 3000);
}

//kick option
socket.on('remove-User', (userR) => {
  if (cUserPeerID == userR) {
    disconnectNow();
  }
});

const listOfUser = (userlist) => {
  userDropDown.innerHTML = '';
  // while (userDropDown.firstChild) {
  //   userDropDown.removeChild(userDropDown.lastChild);
  // }

  for (var i = 0; i < userlist.length; i++) {
    var x = document.createElement("a");
    var t = document.createTextNode(userlist[i].username == organiser ? `${userlist[i].name} (organiser)` : `${userlist[i].name}`);
    x.appendChild(t);
    userDropDown.append(x);
  }
  const anchors = document.querySelectorAll('a');
  for (let i = 0; i < anchors.length; i++) {
    anchors[i].addEventListener('click', () => {
      console.log(`Link is clicked ${i}`);
      if(username == organiser){
      anchoreUser(userlist[i].uid);
    }
    });
  }
}

const anchoreUser = (userR) => {
  socket.emit('removeUser',userR);
}

const getUsers = () => {
  socket.emit('get-meeting-participants');
}

socket.on('all-users-inRoom', (userI) => {
  console.log("users in the room: ",userI);
  // userlist.splice(0,userlist.length);
  let userlist = [];
  userlist = userI;
  console.log(userlist);
  listOfUser(userlist);
  document.getElementById("myDropdown").classList.toggle("show");
});

console.log("peers", peers);
