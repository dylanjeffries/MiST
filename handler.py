import os
import glob
from watchdog.events import FileSystemEventHandler


class Handler(FileSystemEventHandler):
    def __init__(self, messages, path):
        self.messages = messages
        self.pointers = {}
        
        # Add the pointer for the latest journal, in case that one is still active
        journals = glob.glob(f"{path}/*.log")
        journals.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        self.latest_journal = None
        if journals:
            self.latest_journal = journals[0]
            with open(self.latest_journal, "r", encoding="utf8") as f:
                line_count = sum(1 for line in f.readlines())
                self.pointers[self.latest_journal] = line_count

    def on_modified(self, event):
        if event.src_path.endswith(".log"):
            self.process_new_journal_lines(event.src_path)
        elif event.src_path.endswith("Status.json"):
            self.process_status(event.src_path)

    def process_new_journal_lines(self, file):
        # Check if the journal is new
        if file not in self.pointers:
            self.latest_journal = file
            self.pointers[file] = 0
        # Read new lines
        with open(file, "r", encoding="utf8") as f:
            for line in f.readlines()[self.pointers[file]:]:
                self.messages.put(line.strip())
                self.pointers[file] += 1

    def process_status(self, file):
        with open(file, "r", encoding="utf8") as f:
            self.messages.put(f.readline())

    def process_latest_journal(self):
        self.process_new_journal_lines(self.latest_journal)


if __name__ == "__main__":
    pass
