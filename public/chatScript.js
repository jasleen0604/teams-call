const socket = io();

let participants = [];
let roomID;

let sendButton = document.querySelector(".send-btn");
let ul = document.querySelector(".chatList");
let groupNamesDiv = document.querySelectorAll(".chat-name");
let currentGroup = document.querySelector(".currentGroup");
let groupNames = document.querySelectorAll(".groupNames")
let chatContainer = document.querySelector(".chat-container");
let addGroups = document.querySelector(".chat-add-icon");
// let deleteBtn = document.querySelector(".delete-chat-icon");
let addParticipant = document.querySelector(".add-user-btn");
let startMeeting = document.querySelector(".join-btn");
let getParticipantBtn = document.querySelector(".add-participants");
let participantList = document.querySelector(".participant-list");

let currGrpUsers = [];
let currentGroupId;

let currUser = name;

let firstGroupId=document.querySelector(".currentGroup").getAttribute("data-grpID");
currentGroupId = firstGroupId;
//===============================================================
if(groups.length>0){
  socket.emit("join-group", firstGroupId);
  socket.emit("loadChat", firstGroupId);
}


// load grp chats when a grp name is clicked
for (let i = 0; i < groupNamesDiv.length; i++) {
  groupNamesDiv[i].addEventListener("click", function() {
    currentGroup.innerText = groupNames[i].innerHTML;

    console.log("Group id: ",groupNames[i].getAttribute("data-grpID"));

    currentGroupId=groupNames[i].getAttribute("data-grpID");

    socket.emit("join-group", currentGroupId);
    socket.emit("loadChat", currentGroupId);

  });
}

// this event is fired when any chat needs to be rendered(when a grp is clicked)
socket.on("render chat", (chats, roomId) => {
  console.log(chats);
  roomID = roomId;
  ul.innerHTML = "";

  chats.forEach(function (chat) {

    let div = document.createElement("div");
    // div.style.paddingRight = "60px";

    if (chat.username == username) {
      div.innerHTML = `<li class="right message">
        <p class="user-name">${chat.name}</p>${chat.message}
    </li><br>`
    }
    else {
      div.innerHTML = `<li class="left message">
      <p class="user-name">${chat.name}</p>${chat.message}
  </li><br>`
    }


    ul.append(div);
    scrollToBottom(chatContainer);
  });
});

const scrollToBottom = (node) => {
  node.scrollTop = node.scrollHeight;
}

// add current msg to our UI
socket.on("load-current-message", (sender, msg, userName) => {
  let div = document.createElement("div");

  console.log("username");
  if (username == userName) {
    div.innerHTML = `<li class="right message">
        <p class="user-name">${sender}</p>${msg}
    </li><br>`
    console.log("username");
  } else {
    div.innerHTML = `<li class="left message">
        <p class="user-name">${sender}</p>${msg}
    </li><br>`
  }

  ul.append(div);
  scrollToBottom(chatContainer);
})

//Send message on enter key

$('html').keydown((e) => {
  let inputMessage = document.querySelector(".chat-input");
  if (e.which == 13 && inputMessage.value!="") {
    socket.emit("message", currUser, username, inputMessage.value, currentGroupId, roomID);
    inputMessage.value = "";
  }
})

sendButton.addEventListener("click", function() {
  let inputMessage = document.querySelector(".chat-input");

  if (inputMessage.value != "") {
    console.log(inputMessage.value);
    console.log(currUser);
    socket.emit("message", currUser, username, inputMessage.value, currentGroupId, roomID);
    // console.log(message.value);
  } else {
    console.log("Nothing to send");
  }
  inputMessage.value = "";
})


socket.on("reload", function() {
  ul.innerHTML = "";
})

startMeeting.addEventListener("click", function() {
  socket.emit("join-meeting", currentGroupId);
});

socket.on("meet-link", (link, organiser) => {
  // console.log(link);
  let linkbtn = document.createElement("a");
  linkbtn.setAttribute("href", "/" + currentGroupId + "/" + organiser + "/" + link);
  linkbtn.click();
});

// Get group participants list
getParticipantBtn.addEventListener("click", function () {

  if (participantList.style.display == "block") {
    participantList.style.display = "none";
  }
  else {
    socket.emit("get-participants", currentGroupId);
  }
})

socket.on("get-grpUserList", (grpMembers, admin) => {

  participantList.innerHTML="";
  grpMembers.forEach(function (member) {
    let div = document.createElement("div");
    div.className = "member-details";

    if (member.username == admin) {
      div.innerHTML = `<p class="member-name">${member.name} (Admin)</p>
    <p class="member-username">${member.username}</p>`
    }
    else {
      div.innerHTML = `<p class="member-name">${member.name}</p>
    <p class="member-username">${member.username}</p>`
    }
    participantList.append(div);
  })

  participantList.style.display = "block";

  console.log("Group Members: ", grpMembers);
  console.log(admin);
});
