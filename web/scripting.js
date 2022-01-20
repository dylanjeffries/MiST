// Update Data

function updateData(data) {
  // Keep track of total mission rewards
  var totalReward = 0;

  // Get the div for the missions by faction and empty the div
  var missionsTables = document.getElementById("missions-tables");
  missionsTables.innerHTML = "";
  var div = document.createElement("div");

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
          totalReward += mission_info["reward"]
      }

      div.appendChild(table);

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

      div.appendChild(table);
  }

  // Add div with all tables to missions-tables
  missionsTables.appendChild(div);

  // Set Reward Total
  var totalRewardHeading = document.getElementById("rewards-total");
  totalRewardHeading.innerHTML = `Rewards Total: ${totalReward.toLocaleString("en-us")} cr`;

  // Progress Bar
  var barContainer = document.getElementById("progress-bar");
  var bar = barContainer.getElementsByTagName("div")[0];
  var label = barContainer.getElementsByTagName("p")[0];
  var barRatio = data["player"]["target_kills"] / data["player"]["required_kills"];
  bar.style.width = `${barRatio * 100}%`;
  label.innerHTML = `${data["player"]["target_kills"]} / ${data["player"]["required_kills"]}`;

  // Bounty Rewards
  var targetBounties = document.getElementById("target-bounties");
  targetBounties.innerHTML = `Target Bounties: ${data["player"]["target_total_reward"].toLocaleString("en-us")} cr`;
  var nonTargetBounties = document.getElementById("non-target-bounties");
  nonTargetBounties.innerHTML = `Non-Target Bounties: ${data["player"]["non_target_total_reward"].toLocaleString("en-us")} cr`;
  var totalBounties = document.getElementById("total-bounties");
  var totalBountiesValue = data["player"]["target_total_reward"] + data["player"]["non_target_total_reward"];
  totalBounties.innerHTML = `Total Bounties: ${totalBountiesValue.toLocaleString("en-us")} cr`;
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


// Timer

var timer = new easytimer.Timer();
var timerHoursMode = false;

function updateTimer() {
  if (timerHoursMode) {
      document.getElementById("timerText").innerHTML = `${(timer.getTotalTimeValues().seconds / 3600).toFixed(3)} hours`;
  } else {
      document.getElementById("timerText").innerHTML = timer.getTimeValues().toString();
  }
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
    var is_collapsed = this.nextElementSibling.classList.toggle("collapsed");
    this.lastElementChild.innerHTML = is_collapsed ? "expand_more" : "expand_less";
  }
}


// Page Load
eel.reload();