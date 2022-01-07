from json.decoder import JSONDecodeError
import os
import eel
import json
import yaml
import traceback
import queue as q
from datetime import datetime
from watchdog.observers import Observer
from listener import Listener


def get_latest_journal_filename(path):
    journals = [f for f in os.listdir(path) if f.endswith(".log")]
    journals = [f"{path}\\{j}" for j in journals]
    journals.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return journals[0]


faction_missions = {}
progress = {"required_kills": 0, "target_kills": 0, "non_target_kills": 0,
            "target_total_reward": 0, "non_target_total_reward": 0}


@eel.expose
def load():
    eel.updateMissions(faction_missions)
    eel.updateProgress(progress)


def set_highest_kill_count():
    # If faction missions is not empty
    if faction_missions:
        highest_kill_count = 0
        highest_faction_name = ""
        # Find the faction with the highest kill count and set all to False
        for k in faction_missions:
            faction_missions[k]["is_highest_kills"] = False
            if faction_missions[k]["total_kills"] >= highest_kill_count:
                highest_kill_count = faction_missions[k]["total_kills"]
                highest_faction_name = k
        # Set the faction with the highest to True
        faction_missions[highest_faction_name]["is_highest_kills"] = True
        # Set the progress required kills to found highest kills
        progress["required_kills"] = highest_kill_count


def get_all_target_factions():
    target_factions = []
    if faction_missions:
        for faction in faction_missions.values():
            for mission in faction["missions"]:
                target_factions.append(mission["TargetFaction"])

    return target_factions


def process_message(message_json):
    message = json.loads(message_json)

    if message["event"] == "MissionAccepted":
        # Construct missions details containing KillCount and Reward
        details = {k: v for k, v in message.items(
        ) if k in ["KillCount", "Reward", "TargetFaction"]}
        faction_missions.setdefault(message["Faction"], {"missions": [],
                                                         "total_kills": 0,
                                                         "total_credits": 0,
                                                         "is_highest_kills": False})

        faction_missions[message["Faction"]]["missions"].append(details)
        faction_missions[message["Faction"]
                         ]["total_kills"] += details["KillCount"]
        faction_missions[message["Faction"]
                         ]["total_credits"] += details["Reward"]
        set_highest_kill_count()

        # Update front-end
        eel.updateMissions(faction_missions)
        eel.updateProgress(progress)

    elif message["event"] == "Bounty":
        # Victim is a mission target
        if message["VictimFaction"] in get_all_target_factions():
            progress["target_kills"] += 1
            progress["target_total_reward"] += message["TotalReward"]
        # Victim is not a mission target
        else:
            progress["non_target_kills"] += 1
            progress["non_target_total_reward"] += message["TotalReward"]

        # Update front-end
        eel.updateProgress(progress)


def other_thread():
    # Load config
    with open("config.yaml", "r") as f:
        config = yaml.load(f, Loader=yaml.FullLoader)

    # Get latest journal
    journal = get_latest_journal_filename(config["data-path"])

    # Start listening for journal changes
    messages = q.Queue()
    observer = Observer()
    observer.schedule(Listener(journal, messages),
                      path=config["data-path"], recursive=False)
    observer.start()

    # Main loop
    while True:
        while not messages.empty():
            process_message(messages.get())
        eel.sleep(1)


if __name__ == "__main__":
    # Start application
    eel.init("web")
    eel.spawn(other_thread)
    eel.start("index.html")
