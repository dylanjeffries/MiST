import eel
import json
import yaml
import math
import time
import queue as q
from watchdog.observers import Observer
from listener import Listener


# Start

def start():
    # Load Config
    with open("config.yaml", "r") as f:
        config = yaml.load(f, Loader=yaml.FullLoader)

    # Load Data
    data = load_data()
    eel.update(data)

    # Mission Board Refresh Alert
    next_mbr_alert_time = get_next_round_ten_minutes()
    
    # Listen for new messages
    messages = q.Queue()
    observer = Observer()
    observer.schedule(Listener(messages), path=config["data-path"], recursive=False)
    observer.start()

    # Process Loop
    while True:
        # Mission Board Refresh Alert
        if time.time() >= next_mbr_alert_time:
            next_mbr_alert_time = get_next_round_ten_minutes()
            if data["player"]["station"] != "":
                eel.showAlert()

        # Message Processing
        if not messages.empty():
            while not messages.empty():
                process_message(messages.get(), data)

            save_data(data)
            eel.update(data)

        eel.sleep(1)


# Data

def load_data():
    try:
        with open("data.json", "r") as f:
            return json.loads(f.read())
    except FileNotFoundError as e:
        return {"factions_missions": {},
                "player": {"station": "", "required_kills": 0, "target_kills": 0, "non_target_kills": 0,
                            "target_total_reward": 0, "non_target_total_reward": 0}
        }


def save_data(data):
    with open("data.json", "w") as f:
        json.dump(data, f)


# Front-end

@eel.expose
def reload():
    eel.update(load_data())


# Process Messages

def process_message(message_json, data):
    message = json.loads(message_json)

    # Mission Accepted
    if message["event"] == "MissionAccepted":
        if "Mission_Massacre" in message["Name"]:
            # Get provider faction
            faction = data["factions_missions"].setdefault(message["Faction"], 
                {"name": message["Faction"], "missions": {}, "total_kills": 0, 
                "total_reward": 0, "is_highest_kills": False})
            # Assemble mission info and add mission to faction missions
            mission = {"kills": message["KillCount"], "reward": message["Reward"],
                "target": message["TargetFaction"], "origin": data["player"]["station"],
                "is_complete": False}
            faction["missions"][message["MissionID"]] = mission
            # Recalculate faction info
            faction["total_kills"] += mission["kills"]
            faction["total_reward"] += mission["reward"]
            set_highest_kills(data)

    # Mission Redirected
    elif message["event"] == "MissionRedirected":
        # Get matching mission and provider faction, continue if mission is relevant
        mission, faction = get_mission_and_faction(message["MissionID"], data)
        if mission is not None:
            # If mission is being redirected back to its origin station, set mission to complete
            if mission["origin"] == message["NewDestinationStation"]:
                mission["is_complete"] = True

    # Mission Abandoned or Mission Completed
    elif message["event"] == "MissionAbandoned" or message["event"] == "MissionCompleted":
        # Get matching mission and provider faction, continue if mission is relevant
        mission, faction = get_mission_and_faction(message["MissionID"], data)
        if mission is not None:
            # Remove mission from faction and edit faction info
            faction["missions"].pop(message["MissionID"])
            faction["total_kills"] -= mission["kills"]
            faction["total_reward"] -= mission["reward"]
            set_highest_kills(data)

            # If no missions remain for the provider faction, remove the faction
            if not faction["missions"]:
                data["factions_missions"].pop(faction["name"])

            # If there are no missions left at all, reset target and non target info
            if not data["factions_missions"]:
                data["player"]["target_kills"] = 0
                data["player"]["target_total_reward"] = 0
                data["player"]["non_target_kills"] = 0
                data["player"]["non_target_total_reward"] = 0

    # Bounty
    elif message["event"] == "Bounty":
        # Find whether the victim is a target or a non target
        victim_status = "target" if message["VictimFaction"] in get_all_target_factions(data) else "non_target"
        # Edit player info
        data["player"][f"{victim_status}_kills"] += 1
        data["player"][f"{victim_status}_total_reward"] += message["TotalReward"]

    # Location
    elif message["event"] == "Location":
        if message["Docked"]:
            data["player"]["station"] = message["StationName"]

    # Docked
    elif message["event"] == "Docked":
        data["player"]["station"] = message["StationName"]

    # Undocked
    elif message["event"] == "Undocked":
        data["player"]["station"] = ""


# Data Getters

def get_all_target_factions(data):
    target_factions = []
    for faction in data["factions_missions"].values():
        for mission in faction["missions"].values():
            target_factions.append(mission["target"])
    return target_factions


def get_mission_and_faction(mission_id, data):
    for faction in data["factions_missions"].values():
        if mission_id in faction["missions"].keys():
            return faction["missions"][mission_id], faction


# Data Setters

def set_highest_kills(data):
    if data["factions_missions"]:
        highest_kills = 0
        highest_faction = ""
        # Find the faction with the highest kill count and set all to False
        for k in data["factions_missions"]:
            data["factions_missions"][k]["is_highest_kills"] = False
            if data["factions_missions"][k]["total_kills"] >= highest_kills:
                highest_kills = data["factions_missions"][k]["total_kills"]
                highest_faction = k
        # Set the faction with the highest to True
        data["factions_missions"][highest_faction]["is_highest_kills"] = True
        # Set the player required kills to the found highest kills
        data["player"]["required_kills"] = highest_kills


# Time

def get_next_round_ten_minutes():
    return math.ceil( time.time() / 600 ) * 600
