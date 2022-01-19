import eel
import processor
import queue as q

# Pipe is used to communicate from the front-end to the back-end
pipe = q.Queue()
@eel.expose
def pipe_put(id, *args):
    pipe.put((id, tuple(*args)))

# Instantiates the back-end via processor and the front-end via eel
if __name__ == "__main__":
    eel.init("web")
    eel.spawn(processor.start, pipe)
    eel.start("index.html")