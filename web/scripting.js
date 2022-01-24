function newTextElement(tag, text) {
  var element = document.createElement(tag);
  element.textContent = text;
  return element;
}

// Update Data

function updateData(data) {
  // Tracking variables through the missions
  var missionsCount = 0;
  var totalReward = 0;

  // Get the div for the missions by faction and empty the div
  var missionsTables = document.createElement("div");
  missionsTables.id = "missions-tables";
  var innerDiv = document.createElement("div");

  // For every mission providing faction and their missions
  for (const [faction_name, faction_info] of Object.entries(data["factions_missions"])) {

      // Create table for individual missions and set title to faction name
      var table = document.createElement("table");
      var titleCell = table.insertRow().insertCell();
      titleCell.innerHTML = faction_name;
      titleCell.colSpan = 2;

      // Create row for column names
      var colnamesRow = table.insertRow();
      colnamesRow.insertCell().innerHTML = "Kills";
      colnamesRow.insertCell().innerHTML = "Reward";
      
      // For every mission from the current faction, create a row
      for (const [mission_id, mission_info] of Object.entries(faction_info["missions"])) {
          var row = table.insertRow();
          row.insertCell().innerHTML = mission_info["kills"];
          row.insertCell().innerHTML = mission_info["reward"].toLocaleString("en-us");
          if (mission_info["is_complete"]) {
            row.classList.add("lightgreen");
          }
          missionsCount += 1;
          totalReward += mission_info["reward"]
      }

      innerDiv.appendChild(table);

      // Create a new table containing the sum values from the rows of each column
      var table = document.createElement("table");
      table.classList.add("row-2");
      var row = table.insertRow();
      var highestDiff = faction_info["total_kills"] - data["player"]["required_kills"]
      row.insertCell().innerHTML = `${faction_info["total_kills"]} kills ${(highestDiff === 0) ? "" : `(${highestDiff})`}`;
      // row.insertCell().innerHTML = faction_info["total_reward"].toLocaleString("en-us");
      if (faction_info["is_highest_kills"]) {
        row.classList.add("yellow");
      }

      innerDiv.appendChild(table);
  }

  // Add div with all tables to missions-tables
  missionsTables.appendChild(innerDiv);

  // Missions Info
  var rewardPerKill = Math.round(totalReward / data["player"]["required_kills"]);
  var missionsInfo = document.createElement("div");
  missionsInfo.classList.add("info-grid");
  var totalRewardElement = newTextElement("h3", `Total Reward: ${totalReward.toLocaleString("en-us")} cr`);
  var rewardPerKillElement = newTextElement("h3", `Reward per Kill: ${rewardPerKill.toLocaleString("en-us")} cr`);
  missionsInfo.replaceChildren(...[totalRewardElement, rewardPerKillElement]);
  
  // Assemble Missions Content
  var [missionsContent] = document.getElementById("missions").getElementsByClassName("content");
  missionsContent.replaceChildren(...[missionsInfo, missionsTables]);

  // Set Missions Bar Extra
  var [missionsExtra] = document.getElementById("missions").getElementsByClassName("tab-extra");
  missionsExtra.textContent = `- ${missionsCount}`;

  // Progress
  var progressExtra = document.getElementById("progress").getElementsByClassName("tab-extra")[0];
  var barContainer = document.getElementById("progress-bar");
  var bar = barContainer.getElementsByTagName("div")[0];
  var label = barContainer.getElementsByTagName("p")[0];
  var barRatio = data["player"]["target_kills"] / data["player"]["required_kills"];
  var barPct = Math.min((barRatio * 100).toFixed(1), 100);
  progressExtra.textContent = `- ${barPct}%`;
  bar.style.width = `${barPct}%`;
  label.innerHTML = `${data["player"]["target_kills"]} / ${data["player"]["required_kills"]}`;

  // Kills and Bounties
  var allKills = data["player"]["target_kills"] + data["player"]["non_target_kills"];
  var allBounties = data["player"]["target_total_reward"] + data["player"]["non_target_total_reward"];
  var [killsContent] = document.getElementById("kills").getElementsByClassName("content");
  killsContent.replaceChildren(...[
    newTextElement("h3", `Target Kills: ${data["player"]["target_kills"]}`),
    newTextElement("h3", `Target Bounties: ${data["player"]["target_total_reward"].toLocaleString("en-us")} cr`),
    newTextElement("h3", `Non-Target Kills: ${data["player"]["non_target_kills"]}`),
    newTextElement("h3", `Non-Target Bounties: ${data["player"]["non_target_total_reward"].toLocaleString("en-us")} cr`),
    newTextElement("h3", `All Kills: ${allKills}`),
    newTextElement("h3", `All Bounties: ${allBounties.toLocaleString("en-us")} cr`)
  ]);
  var [killsExtra] = document.getElementById("kills").getElementsByClassName("tab-extra");
  killsExtra.textContent = `- ${allKills}`;
}
eel.expose(updateData);

// Update Config

function updateConfig(config) {
  var refreshAlertState = config["refresh-alert"] ? "(ON)" : "(OFF)";
  document.getElementById("refreshAlertToggle").innerHTML = `Toggle Refresh Alert ${refreshAlertState}`;
}
eel.expose(updateConfig);


// Clock

function updateClock() {
  var now = new Date();
  var time = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  document.getElementById("time").innerHTML = time;
  setTimeout(updateClock, 1000); 
}


// Menu

function menuButtonClick(event) {
  event.stopPropagation();
  document.getElementById("menuContent").classList.toggle("menuShow");
}

var menu = document.getElementById("menu");
window.onclick = function(event) {
  if (!menu.contains(event.target)) {
    document.getElementById("menuContent").classList.remove('menuShow');
  }
}


// Select Data Path

document.getElementById("dataPathInput").onclick = function () {
  eel.pipe_put("SELECT_DATA_PATH");
}


// Mission Board Refresh Alert

document.getElementById("refreshAlertToggle").onclick = function () {
  eel.pipe_put("REFRESH_ALERT_TOGGLE");
}

var alertOverlay = document.getElementById("alert");
alertOverlay.getElementsByTagName("button")[0].onclick = function () {
  alertOverlay.style.display = "none";
}

function showAlert() {
  alertOverlay.style.display = "block";
}
eel.expose(showAlert);


// Reset Saved Data

document.getElementById("resetSavedData").onclick = function () {
  eel.pipe_put("RESET_SAVED_DATA");
}


// Timer

var timer = new easytimer.Timer();
var timerHoursMode = false;
var timerExtra = document.getElementById("timer").getElementsByClassName("tab-extra")[0];

function updateTimer() {
  var timerText = timer.getTimeValues().toString();
  var timerTextHours = (timer.getTotalTimeValues().seconds / 3600).toFixed(3);
  timerExtra.innerHTML = `- ${timerText}`;
  document.getElementById("timerText").innerHTML = timerHoursMode ? timerTextHours : timerText;
}

timer.addEventListener('secondsUpdated', function () {
  updateTimer();
});
timer.addEventListener('started', function () {
  updateTimer();
});
timer.addEventListener('reset', function () {
  updateTimer();
});

document.getElementById("timerStart").onclick = function () {
  timer.start();
};

document.getElementById("timerPause").onclick = function () {
  timer.pause();
};

document.getElementById("timerReset").onclick = function () {
  timer.reset();
  timer.stop();
};

document.getElementById("timerText").onclick = function () {
  timerHoursMode = !timerHoursMode;
  updateTimer();
}

// Collapsible Sections
 
var tabs = document.getElementsByClassName("tab");
for (let i = 0; i < tabs.length; i++) {
  tabs[i].onclick = function () {
    for (let extra of this.getElementsByClassName("tab-extra")) {
      extra.classList.toggle("hide");
    }
    var is_collapsed = this.nextElementSibling.classList.toggle("hide");
    this.lastElementChild.innerHTML = is_collapsed ? "expand_more" : "expand_less";
  }
}


// Page Load
eel.pipe_put("UPDATE_ALL");