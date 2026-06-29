import urllib.request

base = "http://127.0.0.1:8000"
paths = ["/", "/api/health", "/assets/index-WPvNV1tJ.js", "/assets/index-D3nQEJxc.css"]
for path in paths:
    try:
        r = urllib.request.urlopen(base + path)
        body = r.read()
        print(f"{path} -> {r.status} ({len(body)} bytes)")
    except Exception as e:
        print(f"{path} -> FAIL: {e}")

html = urllib.request.urlopen(base + "/").read().decode()
if "index-" in html:
    start = html.find("/assets/index-")
    end = html.find(".js", start)
    print("JS ref:", html[start : end + 3])
