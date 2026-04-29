import json
import time
import urllib.parse
from pathlib import Path

import requests
import urllib3

urllib3.disable_warnings()

KEY_ID = "5im3q2kbhw"
TARGETS = ["http://localhost:8080/", "http://127.0.0.1:8080/"]
OUT = Path("outputs/naver_auth_probe.log")


def call(url: str):
    r = requests.get(url, timeout=20, verify=False)
    return r.status_code, r.text.strip()


def main() -> None:
    lines = []
    lines.append(f"time={time.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"key_id={KEY_ID}")
    for uri in TARGETS:
        q1 = urllib.parse.urlencode(
            {
                "ncpClientId": KEY_ID,
                "uri": uri,
                "time": str(int(time.time() * 1000)),
                "callback": "cb",
            }
        )
        u1 = "https://oapi.map.naver.com/v1/validatev3?" + q1
        s1, t1 = call(u1)

        q2 = urllib.parse.urlencode(
            {
                "ncpKeyId": KEY_ID,
                "url": uri,
                "time": str(int(time.time() * 1000)),
                "callback": "cb",
            }
        )
        u2 = "https://oapi.map.naver.com/v3/auth?" + q2
        s2, t2 = call(u2)

        lines.append(f"[uri] {uri}")
        lines.append(f"validatev3(ncpClientId) status={s1}")
        lines.append(t1[:300])
        lines.append(f"auth(ncpKeyId) status={s2}")
        lines.append(t2[:300])
        lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
