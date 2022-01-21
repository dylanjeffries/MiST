from ctypes import pointer
import os
import glob
from pyparsing import line
from watchdog.events import FileSystemEventHandler


class Listener(FileSystemEventHandler):
    def __init__(self, messages, path):
        self.messages = messages
        self.pointers = {}
        
        # Add the pointer for the latest journal, in case that one is still active
        journals = glob.glob(f"{path}/*.log")
        journals.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        with open(journals[0], "r") as f:
            line_count = sum(1 for line in f.readlines())
            self.pointers[journals[0]] = line_count

    def on_modified(self, event):
        if event.src_path.endswith(".log"):
            self.read_new_lines(event.src_path)
            
    def read_new_lines(self, file):
        self.pointers.setdefault(file, 0)
        with open(file, "r") as f:
            for line in f.readlines()[self.pointers[file]:]:
                self.messages.put(line.strip())
                self.pointers[file] += 1


if __name__ == "__main__":
    pass
