function callPython() {
  eel.hello()
}

function addText(text) {
  var div = document.getElementById("content");
  div.innerHTML += "<br>" + text;
}
eel.expose(addText);

function updateMissions(missions) {
  // Keep track of total mission rewards
  var totalReward = 0;

  // Get the div for the missions by faction and empty the div
  var all_missions = document.getElementById("missions-cards");
  all_missions.innerHTML = "";

  // For every mission providing faction and their missions
  for (const [faction_name, faction_info] of Object.entries(missions)) {

      div = document.createElement("div");

      // Create table for individual missions and set title to faction name
      table = document.createElement("table");
      title = table.insertRow().insertCell();
      title.innerHTML = faction_name;
      title.colSpan = 2;

      // Create row for column names
      colnames = table.insertRow();
      colnames.insertCell().innerHTML = "Kills";
      colnames.insertCell().innerHTML = "Credits";
      
      // For every mission from the current faction, create a row
      for (const [mission_id, mission_info] of Object.entries(faction_info["missions"])) {
          row = table.insertRow();
          row.insertCell().innerHTML = mission_info["KillCount"];
          row.insertCell().innerHTML = mission_info["Reward"].toLocaleString("en-us");
          if (mission_info["Completed"]) {
            row.id = "mission-completed"
          }
          totalReward += mission_info["Reward"]
      }

      div.appendChild(table);

      // Create a new table containing the total values from the rows of each column
      table = document.createElement("table");
      row = table.insertRow();
      row.insertCell().innerHTML = faction_info["total_kills"];
      row.insertCell().innerHTML = faction_info["total_credits"].toLocaleString("en-us");
      if (faction_info["is_highest_kills"]) {
          row.id = "highest-kills";
      }

      div.appendChild(table);

      all_missions.appendChild(div);
  }

  // Add Rewards Total to missions-content
  var missions_content = document.getElementById("missions-content");
  missions_content.innerHTML = "";
  rewards_total_h3 = document.createElement("h3");
  rewards_total_h3.innerHTML = "Rewards Total: " + totalReward.toLocaleString("en-us") + " cr";
  missions_content.appendChild(rewards_total_h3);
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