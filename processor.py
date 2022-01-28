import eel
import json
import yaml
import math
import time
import copy
import os
import glob
import queue as q
from watchdog.observers import Observer
from tkinter import *
from tkinter import filedialog
from handler import Handler


data_template = {"factions_missions": {},
                "player": {"station": "", "balance": 0, "required_kills": 0, "target_kills": 0, "non_target_kills": 0,
                            "target_total_reward": 0, "non_target_total_reward": 0}}


# Start

def start(pipe):
    # Load Config, Data, and Timer
    config = load_config()
    data = load_data(config)
    load_timer()
    eel.updateData(data)
    eel.updateConfig(config)
    eel.disableLoading()

    # Start the Mission Board Refresh Reminder
    next_mbr_reminder_time = get_next_round_ten_minutes()
    
    # Establish the Journal Handler with a queue to pass through new messages
    messages = q.Queue()
    observer = Observer()
    handler = Handler(messages, config["data-path"])
    observer.schedule(handler, path=config["data-path"], recursive=False)
    observer.start()

    # Process Loop
    while True:
        # Mission Board Refresh Reminder
        if time.time() >= next_mbr_reminder_time:
            next_mbr_reminder_time = get_next_round_ten_minutes()
            if data["player"]["station"] != "" and config["refresh-reminder"]:
                eel.triggerRefreshReminder()

        # Message Processing
        if not messages.empty():
            while not messages.empty():
                try:
                    message = json.loads(messages.get())
                    process_message(message, data, config, handler=handler)
                except json.JSONDecodeError as e:
                    pass

            eel.updateData(data)

        # Front-end Pipe Processing
        while not pipe.empty():
            id, args = pipe.get()
            if id == "UPDATE_ALL":
                eel.updateData(data)
                eel.updateConfig(config)
                eel.disableLoading()
            elif id == "REFRESH_REMINDER_TOGGLE":
                config["refresh-reminder"] = not config["refresh-reminder"]
                save_config(config)
                eel.updateConfig(config)
            elif id == "TIMER_REMINDER_TOGGLE":
                config["timer-reminder"] = not config["timer-reminder"]
                save_config(config)
                eel.updateConfig(config)
            elif id == "SELECT_DATA_PATH":
                root = Tk()
                root.attributes("-topmost", True)
                root.withdraw()
                folder = filedialog.askdirectory(parent=root, title="Select Data Path")
                root.destroy()
                if folder:
                    config["data-path"] = folder
                    save_config(config)
                    observer.unschedule_all()
                    handler = Handler(messages, config["data-path"])
                    observer.schedule(handler, path=config["data-path"], recursive=False)
            elif id == "RELOAD_DATA":
                eel.triggerLoading()
                data = load_data(config)
                eel.updateData(data)
                eel.disableLoading()
            elif id == "RESET_DATA":
                station = data["player"]["station"]
                data = copy.deepcopy(data_template)
                data["player"]["station"] = station
                eel.updateData(data)

        eel.sleep(1)


# Config

def load_config():
    current_path = os.getcwd()
    template = {"data-path": current_path, "refresh-reminder": True, "timer-reminder": True}
    try:
        with open("config.yaml", "r") as f:
            config = template | yaml.load(f, Loader=yaml.FullLoader)
            config = {k: v for k, v in config.items() if k in template}
            return config
    except FileNotFoundError as e:
        return template


def save_config(config):
    with open("config.yaml", "w") as f:
        yaml.dump(config, f)


# Save Timer
def load_timer():
    try:
        with open("timer.save", "r") as f:
            string_values = f.read().split(":")[::-1]
            values = [0] + list(map(int, string_values)) + [0]
            eel.setTimer(values)
        os.remove("timer.save")
    except FileNotFoundError as e:
        pass
            
def save_timer(s):
    with open("timer.save", "w") as f:
        f.write(s)
eel.expose(save_timer)


# Load Data

def load_data(config):
    # Get all journals in chronological order
    path = config["data-path"]
    journals = glob.glob(f"{path}/*.log")
    journals.sort(key=lambda x: os.path.getmtime(x), reverse=True)

    # Get a list of journals that contain events relevant to the missions existing at the start of the latest journal
    journals_to_process = []
    existing_missions = set()
    for j in journals:
        if does_journal_contain_missions(j):

            if not journals_to_process:
                existing_missions = get_existing_missions(j)
            
            journals_to_process.append(j)
            accepted_missions = get_accepted_missions(j)
            existing_missions.difference_update(accepted_missions)

            if not existing_missions:
                break

    # Go backwards through the required journals and process their events to get up-to-date data
    data = copy.deepcopy(data_template)
    while journals_to_process:
        journal = journals_to_process.pop(-1)
        process_journal(journal, data, config)

    return data

def does_journal_contain_missions(journal):
    with open(journal, "r", encoding="utf8") as f:
        for line in f.readlines():
            if '"event":"Missions"' in line:
                return True
    return False

def get_existing_missions(journal):
    with open(journal, "r", encoding="utf8") as f:
        for line in f.readlines():
            if '"event":"Missions"' in line:
                line = json.loads(line)
                all_missions = [*line["Active"], *line["Failed"], *line["Complete"]]
                massacre_missions = {x["MissionID"] for x in all_missions if "Mission_Massacre" in x["Name"]}
                return massacre_missions
    return None

def get_accepted_missions(journal):
    accepted_missions = set()
    with open(journal, "r", encoding="utf8") as f:
        for line in f.readlines():
            if '"event":"MissionAccepted"' in line:
                accepted_missions.add(json.loads(line)["MissionID"])
    return accepted_missions

def process_journal(journal, data, config):
    with open(journal, "r", encoding="utf8") as f:
        for line in f.readlines():
            try:
                process_message(json.loads(line), data, config, realtime=False)
            except json.JSONDecodeError as e:
                pass


# Process Messages

def process_message(message, data, config, realtime=True, handler=None):

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
        # Get the provider faction
        faction = get_faction_of_mission(message["MissionID"], data)
        if faction is not None:
            mission = faction["missions"][message["MissionID"]]
            # If mission is being redirected back to its origin station, set mission to complete
            if mission["origin"] == message["NewDestinationStation"]:
                mission["is_complete"] = True

    # Mission Abandoned or Mission Completed
    elif message["event"] == "MissionAbandoned" or message["event"] == "MissionCompleted":
        # Get the provider faction
        faction = get_faction_of_mission(message["MissionID"], data)
        if faction is not None:
            # Remove mission from faction and edit faction info
            mission = faction["missions"].pop(message["MissionID"])
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
        victim_status = get_victim_status(message["VictimFaction"], data)
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
        if realtime and config["timer-reminder"]:
            eel.triggerTimerPauseReminder()

    # Undocked
    elif message["event"] == "Undocked":
        data["player"]["station"] = ""
        if realtime and config["timer-reminder"]:
            eel.triggerTimerStartReminder()

    # Status (Balance Check)
    elif message["event"] == "Status":
        if realtime:
            # Balance check for missed Mission Accepted
            if message.get("Balance", 0) > data["player"]["balance"]:
                handler.process_latest_journal()
                data["player"]["balance"] = message["Balance"]
            # Docked check for missed Docked, Docked Flag in Status compared to Data Docked State
            elif message.get("Flags", 0) % 2 != bool(data["player"]["station"]):
                handler.process_latest_journal()


# Data Getters

def get_victim_status(victim_faction, data):
    for faction in data["factions_missions"].values():
        for mission in faction["missions"].values():
            if mission["target"] == victim_faction:
                return "target"
    return "non_target"


def get_faction_of_mission(mission_id, data):
    for faction in data["factions_missions"].values():
        if mission_id in faction["missions"].keys():
            return faction


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
