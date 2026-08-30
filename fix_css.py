with open("reading-mode.css", "r") as f:
    content = f.read()
content = content.replace(".bg-\\\\[#FDFBF7\\\\]", ".bg-\\\\[\\\\#FDFBF7\\\\]")
with open("reading-mode.css", "w") as f:
    f.write(content)
