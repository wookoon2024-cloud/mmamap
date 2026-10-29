#!/usr/bin/env bash
# 보안 업데이트(솔라피 키 서버 이전) 서버 반영 스크립트 — 네이버 클라우드 서버에서 실행
#
# 사용법 (MMAMap 폴더에서):
#   cp web/config.js ~/config.js.bak      # 1) git pull 전에 백업 (pull 하면 config.js 가 지워짐)
#   git pull                               # 2) 최신 코드 받기
#   bash scripts/apply_security_update.sh ~/config.js.bak   # 3) 이 스크립트 실행
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP="${1:-$HOME/config.js.bak}"

if [ ! -f "$BACKUP" ]; then
  echo "[오류] 백업한 config.js 를 찾을 수 없습니다: $BACKUP" >&2
  exit 1
fi

# 1) config.js 복원 — 솔라피 블록과 네이버 secret(key) 줄은 빼고 복원
python3 - "$BACKUP" web/config.js <<'PY'
import re, sys
src, dst = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()
text = re.sub(r"\n\s*solapi:\s*\{[^}]*\},?", "", text)
text = re.sub(r"\n\s*key:\s*\"[^\"]*\",?", "", text)
open(dst, "w", encoding="utf-8").write(text)
print("[OK] web/config.js 복원 (solapi 블록 제거)" if "solapi" not in text else "[경고] solapi 가 남아 있습니다")
PY
chmod 644 web/config.js

# 2) .env 에 솔라피 키 등록 (새로 발급받은 값을 입력, 화면에 표시되지 않음)
touch .env
chmod 600 .env
set_env() {
  local name="$1" value="$2"
  grep -v "^${name}=" .env > .env.tmp || true
  printf '%s=%s\n' "$name" "$value" >> .env.tmp
  mv .env.tmp .env
  chmod 600 .env
}
read -r -s -p "SOLAPI_API_KEY (새 키): " SOLAPI_API_KEY; echo
read -r -s -p "SOLAPI_API_SECRET (새 secret): " SOLAPI_API_SECRET; echo
read -r -p "SOLAPI_FROM (발신번호, 숫자만): " SOLAPI_FROM
set_env SOLAPI_API_KEY "$SOLAPI_API_KEY"
set_env SOLAPI_API_SECRET "$SOLAPI_API_SECRET"
set_env SOLAPI_FROM "$SOLAPI_FROM"
echo "[OK] .env 에 SOLAPI_* 등록"

# 3) server.py 재시작
SERVICE="$(systemctl list-units --type=service --all --no-legend 2>/dev/null | awk '{print $1}' | grep -i -E 'mmamap|mmasv|gunpil|server' | head -1 || true)"
if [ -n "$SERVICE" ]; then
  sudo systemctl restart "$SERVICE"
  echo "[OK] $SERVICE 재시작"
else
  echo "[안내] systemd 서비스를 찾지 못했습니다. 평소 방식대로 server.py 를 재시작해 주세요."
  echo "       실행 중인 프로세스:"
  pgrep -af "server.py" || echo "       (server.py 프로세스 없음)"
fi

# 4) 확인
sleep 2
PORT="${PORT:-8080}"
echo "[확인] config.js 에 solapi 노출 여부:"
if curl -s "http://127.0.0.1:${PORT}/config.js" | grep -qi solapi; then echo "  ✗ 아직 노출됨"; else echo "  ✓ 노출 안 됨"; fi
echo "[확인] /api/send_voice_code 응답 코드 (400 이면 정상):"
curl -s -o /dev/null -w "  %{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"to":"1","code":"x"}' "http://127.0.0.1:${PORT}/api/send_voice_code"
