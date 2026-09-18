import json, quopri, re, sys, glob, os

kind = sys.argv[1]  # "invite" or "reset"
pattern = sys.argv[2] if len(sys.argv) > 2 else None  # optional email filter

matches = []
for path in glob.glob("tmp-emails/*.json"):
    with open(path, "rb") as f:
        data = json.load(f)
    body = quopri.decodestring(data["body"].encode()).decode("utf-8", "replace")
    marker = "accept-invitation" if kind == "invite" else "reset-password"
    m = re.search(rf"{marker}[?&]token=([0-9a-f]+)", body)
    if not m:
        continue
    if pattern and pattern not in body:
        continue
    matches.append((os.path.getmtime(path), m.group(1)))

if not matches:
    sys.exit(1)
# latest first
matches.sort(reverse=True)
print(matches[0][1])
