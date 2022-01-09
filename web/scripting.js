function update(data) {
  // Keep track of total mission rewards
  var totalReward = 0;

  // Get the div for the missions by faction and empty the div
  var missionsCards = document.getElementById("missions-cards");
  missionsCards.innerHTML = "";

  // For every mission providing faction and their missions
  for (const [faction_name, faction_info] of Object.entries(data["factions_missions"])) {

      var div = document.createElement("div");

      // Create table for individual missions and set title to faction name
      var table = document.createElement("table");
      var title = table.insertRow().insertCell();
      title.innerHTML = faction_name;
      title.colSpan = 2;

      // Create row for column names
      var colnames = table.insertRow();
      colnames.insertCell().innerHTML = "Kills";
      colnames.insertCell().innerHTML = "Reward";
      
      // For every mission from the current faction, create a row
      for (const [mission_id, mission_info] of Object.entries(faction_info["missions"])) {
          var row = table.insertRow();
          row.insertCell().innerHTML = mission_info["kills"];
          row.insertCell().innerHTML = mission_info["reward"].toLocaleString("en-us");
          if (mission_info["is_complete"]) {
            row.id = "mission-completed"
          }
          totalReward += mission_info["reward"]
      }

      div.appendChild(table);

      // Create a new table containing the total values from the rows of each column
      var table = document.createElement("table");
      var row = table.insertRow();
      row.insertCell().innerHTML = faction_info["total_kills"];
      row.insertCell().innerHTML = faction_info["total_reward"].toLocaleString("en-us");
      if (faction_info["is_highest_kills"]) {
          row.id = "highest-kills";
      }

      div.appendChild(table);

      missionsCards.appendChild(div);
  }

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
eel.expose(update);

// Page load
eel.reload();