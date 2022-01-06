from watchdog.events import FileSystemEventHandler


class Listener(FileSystemEventHandler):
    def __init__(self, file, messages):
        self.file = file
        self.messages = messages
        self.line_pointer = 0
        # Start by reading the file for current progress
        self.read_new_lines()

    def on_modified(self, event):
        if event.src_path == self.file:
            self.read_new_lines()

    def read_new_lines(self):
        with open(self.file, "r") as f:
            for line in f.readlines()[self.line_pointer:]:
                self.messages.put(line.strip())
                self.line_pointer += 1


if __name__ == "__main__":
    pass
