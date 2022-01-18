from watchdog.events import FileSystemEventHandler


class Listener(FileSystemEventHandler):
    def __init__(self, messages):
        self.messages = messages
        self.pointers = {}

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
