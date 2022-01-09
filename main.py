import eel
import processor


if __name__ == "__main__":
    eel.init("web")
    eel.spawn(processor.start)
    eel.start("index.html", mode=None)
