var overlay = document.getElementById("overlay");

// Element Shortcuts

function newTextElement(tag, text) {
  var element = document.createElement(tag);
  element.textContent = text;
  return element;
}

function updateProgressBar(id, pct, labelText) {
  var container = document.getElementById(id);
  var [bar] = container.getElementsByTagName("div");
  var [label] = container.getElementsByTagName("p");
  bar.style.width = `${pct}%`;
  label.textContent = labelText;
}


// Update Data

function updateData(data) {
  // Tracking variables through the missions
  var missionsCount = 0;
  var totalReward = 0;
  var missionsComplete = 0;

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
            row.classList.add("green");
            missionsComplete += 1;
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
        row.classList.add("gold");
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

  // Set Missions Tab Extra
  var [missionsExtra] = document.getElementById("missions").getElementsByClassName("tab-extra");
  missionsExtra.textContent = `- ${missionsCount}`;

  // Progress Calculations
  var missionsRatio = missionsComplete / missionsCount;
  var missionsPct = Math.min((missionsRatio * 100).toFixed(1), 100);
  var killsRatio = data["player"]["target_kills"] / data["player"]["required_kills"];
  var killsPct = Math.min((killsRatio * 100).toFixed(1), 100);

  // Progress Bars
  updateProgressBar("missions-progress", missionsPct,
  `${missionsComplete} of ${missionsCount} Missions Completed`)

  updateProgressBar("kills-progress", killsPct,
  `${data["player"]["target_kills"]} of ${data["player"]["required_kills"]} Targets Killed`);

  // Progress Tab Extra
  var [progressExtra] = document.getElementById("progress").getElementsByClassName("tab-extra");
  progressExtra.textContent = `- Missions: ${missionsPct}% - Kills: ${killsPct}%`;

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
  var refreshReminderState = config["refresh-reminder"] ? "(ON)" : "(OFF)";
  document.getElementById("refreshReminderToggle").textContent = `Toggle Refresh Reminder ${refreshReminderState}`;
  var timerReminderState = config["timer-reminder"] ? "(ON)" : "(OFF)";
  document.getElementById("timerReminderToggle").textContent = `Toggle Timer Reminder ${timerReminderState}`;
}
eel.expose(updateConfig);

// Loading Data Overlay

var loading = document.getElementById("loading");
function triggerLoading() {
  overlay.style.display = "block";
  loading.style.display = "block";
}

function disableLoading() {
  overlay.style.display = "none";
  loading.style.display = "none";
}
eel.expose(disableLoading);

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


// Mission Board Refresh Reminder

document.getElementById("refreshReminderToggle").onclick = function () {
  eel.pipe_put("REFRESH_REMINDER_TOGGLE");
}

var refreshReminder = document.getElementById("refreshReminder");
refreshReminder.getElementsByTagName("button")[0].onclick = function () {
  overlay.style.display = "none";
  refreshReminder.style.display = "none";
}

function triggerRefreshReminder() {
  overlay.style.display = "block";
  refreshReminder.style.display = "block";
}
eel.expose(triggerRefreshReminder);

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
  var timerTextHours = `${(timer.getTotalTimeValues().seconds / 3600).toFixed(3)} hours`;
  timerExtra.textContent = `- ${timerText}`;
  document.getElementById("timerText").textContent = timerHoursMode ? timerTextHours : timerText;
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

// Timer Reminder

document.getElementById("timerReminderToggle").onclick = function () {
  eel.pipe_put("TIMER_REMINDER_TOGGLE");
}

var timerStartReminder = document.getElementById("timerStartReminder");

timerStartReminder.getElementsByTagName("button")[0].onclick = function () {
  overlay.style.display = "none";
  timerStartReminder.style.display = "none";
  timer.start();
}

timerStartReminder.getElementsByTagName("button")[1].onclick = function () {
  overlay.style.display = "none";
  timerStartReminder.style.display = "none";
}

function triggerTimerStartReminder() {
  overlay.style.display = "block";
  timerStartReminder.style.display = "block";
}
eel.expose(triggerTimerStartReminder);

var timerPauseReminder = document.getElementById("timerPauseReminder");

timerPauseReminder.getElementsByTagName("button")[0].onclick = function () {
  overlay.style.display = "none";
  timerPauseReminder.style.display = "none";
  timer.pause();
}

timerPauseReminder.getElementsByTagName("button")[1].onclick = function () {
  overlay.style.display = "none";
  timerPauseReminder.style.display = "none";
}

function triggerTimerPauseReminder() {
  overlay.style.display = "block";
  timerPauseReminder.style.display = "block";
}
eel.expose(triggerTimerPauseReminder);


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
triggerLoading();
eel.pipe_put("UPDATE_ALL");