function callPython() {
  eel.hello()
}

function addText(text) {
  var div = document.getElementById("content");
  div.innerHTML += "<br>" + text;
}
eel.expose(addText);

function updateMissions(missions) {
  // Get the div for the missions by faction and empty the div
  var all_missions = document.getElementById("missions-cards");
  all_missions.innerHTML = "";

  // For every mission providing faction and their missions
  for (const [key, value] of Object.entries(missions)) {

      div = document.createElement("div");

      // Create table for individual missions and set title to faction name
      table = document.createElement("table");
      title = table.insertRow().insertCell();
      title.innerHTML = key;
      title.colSpan = 2;

      // Create row for column names
      colnames = table.insertRow();
      colnames.insertCell().innerHTML = "Kills";
      colnames.insertCell().innerHTML = "Credits";
      
      // For every mission from the current faction, create a row
      value["missions"].forEach(faction_mission => {
          row = table.insertRow();
          row.insertCell().innerHTML = faction_mission["KillCount"];
          row.insertCell().innerHTML = faction_mission["Reward"].toLocaleString("en-us");
      });

      div.appendChild(table);

      // Create a new table containing the total values from the rows of each column
      table = document.createElement("table");
      row = table.insertRow();
      row.insertCell().innerHTML = value["total_kills"];
      row.insertCell().innerHTML = value["total_credits"].toLocaleString("en-us");
      if (value["is_highest_kills"]) {
          row.id = "highest-kills";
      }

      div.appendChild(table);

      all_missions.appendChild(div);
  }
}
eel.expose(updateMissions);

function updateProgress(progress) {
  // Get the div for progress and empty it
  var progress_div = document.getElementById("progress-content");
  progress_div.innerHTML = "";

  // Progress bar
  bar = document.createElement("div");
  bar.id = "progress-bar"
  bar_actual = document.createElement("div");
  bar_actual.style.width = ((progress["target_kills"] / progress["required_kills"]) * 100) + "%";
  bar.appendChild(bar_actual);
  bar_label = document.createElement("p");
  bar_label.innerHTML = progress["target_kills"] + " / " + progress["required_kills"];
  bar.appendChild(bar_label);
  progress_div.appendChild(bar);

  // Bounty rewards
  target_bounties = document.createElement("h3");
  target_bounties.innerHTML = "Target Bounties: " + progress["target_total_reward"].toLocaleString("en-us") + " cr";
  progress_div.appendChild(target_bounties);

  non_target_bounties = document.createElement("h3");
  non_target_bounties.innerHTML = "Non-Target Bounties: " + progress["non_target_total_reward"].toLocaleString("en-us") + " cr";
  progress_div.appendChild(non_target_bounties);

  total_bounties = document.createElement("h3")
  total_bounties_value = progress["non_target_total_reward"] + progress["target_total_reward"];
  total_bounties.innerHTML = "Total Bounties: " + total_bounties_value.toLocaleString("en-us") + " cr";
  progress_div.appendChild(total_bounties)
}
eel.expose(updateProgress);

// Page load
eel.load();