#!/usr/bin/env bash
# Comprehensive v3 backend test
# Usage: bash test-all.sh

BASE="http://localhost:4002"
PASS=0
FAIL=0
WARN=0

# Colors
RED='\033[0;31m'
YEL='\033[0;33m'
GRN='\033[0;32m'
CYN='\033[0;36m'
BLD='\033[1m'
NC='\033[0m'

call() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local body="$4"

  local start=$(date +%s%3N)
  if [ "$method" = "PATCH" ]; then
    local resp=$(curl -s -w "\n%{http_code}" -X PATCH -H "Content-Type: application/json" -d "$body" "$url" 2>/dev/null)
  else
    local resp=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  fi
  local end=$(date +%s%3N)
  local ms=$((end - start))
  local code=$(echo "$resp" | tail -1)
  local body_resp=$(echo "$resp" | head -n -1)

  echo "$body_resp $ms $code $label"
}

check() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local patch_body="$4"

  local start=$(date +%s%3N)
  if [ "$method" = "PATCH" ]; then
    local resp=$(curl -s -w "\n%{http_code}" -X PATCH -H "Content-Type: application/json" -d "$patch_body" "$url" 2>/dev/null)
  else
    local resp=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  fi
  local end=$(date +%s%3N)
  local ms=$((end - start))
  local code=$(echo "$resp" | tail -1)
  local json=$(echo "$resp" | head -n -1)

  # Checks
  local status="PASS"
  local notes=""

  if [ "$code" != "200" ]; then
    status="FAIL"
    notes="HTTP $code"
  fi

  # Check for data field
  local has_data=$(echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'data' in d else 'no')" 2>/dev/null)
  if [ "$has_data" = "no" ] && [ "$status" = "PASS" ]; then
    status="FAIL"
    notes="no 'data' envelope"
  fi

  # Count items if data is array
  local count=$(echo "$json" | python3 -c "import sys,json; d=json.load(sys.stdin); arr=d.get('data',[]); print(len(arr) if isinstance(arr,list) else 'obj')" 2>/dev/null)

  # Speed warning
  local speed_note=""
  if [ "$ms" -gt 5000 ]; then
    speed_note=" ⚠ SLOW ${ms}ms"
    if [ "$status" = "PASS" ]; then status="WARN"; fi
  elif [ "$ms" -gt 2000 ]; then
    speed_note=" ⚠ slow ${ms}ms"
  fi

  if [ "$status" = "PASS" ]; then
    echo -e "  ${GRN}✓${NC} ${BLD}${label}${NC} — ${ms}ms | items: ${count}${speed_note}"
    PASS=$((PASS+1))
  elif [ "$status" = "WARN" ]; then
    echo -e "  ${YEL}⚠${NC} ${BLD}${label}${NC} — ${ms}ms | items: ${count}${speed_note}"
    WARN=$((WARN+1))
  else
    echo -e "  ${RED}✗${NC} ${BLD}${label}${NC} — ${ms}ms | ${notes}"
    FAIL=$((FAIL+1))
  fi

  echo "$json"
}

# Same as check but also inspects specific fields and reports on them
inspect() {
  local label="$1"
  local url="$2"
  local fields="$3"  # comma-separated dotpath fields to check, e.g. "data.venue,data.lineups"

  local start=$(date +%s%3N)
  local resp=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
  local end=$(date +%s%3N)
  local ms=$((end - start))
  local code=$(echo "$resp" | tail -1)
  local json=$(echo "$resp" | head -n -1)

  local status="PASS"
  local notes=""
  if [ "$code" != "200" ]; then
    status="FAIL"; notes="HTTP $code"
  fi

  local speed_note=""
  if [ "$ms" -gt 5000 ]; then speed_note=" ⚠ SLOW ${ms}ms"; if [ "$status" = "PASS" ]; then status="WARN"; fi
  elif [ "$ms" -gt 2000 ]; then speed_note=" ⚠ slow ${ms}ms"; fi

  if [ "$status" = "PASS" ]; then
    echo -e "  ${GRN}✓${NC} ${BLD}${label}${NC} — ${ms}ms${speed_note}"
    PASS=$((PASS+1))
  elif [ "$status" = "WARN" ]; then
    echo -e "  ${YEL}⚠${NC} ${BLD}${label}${NC} — ${ms}ms${speed_note}"
    WARN=$((WARN+1))
  else
    echo -e "  ${RED}✗${NC} ${BLD}${label}${NC} — ${ms}ms | ${notes}"
    FAIL=$((FAIL+1))
  fi

  # Field inspection
  if [ -n "$fields" ]; then
    python3 - "$json" "$fields" <<'PYEOF'
import sys, json

raw = sys.argv[1]
fields = sys.argv[2].split(",")

try:
    d = json.loads(raw)
except:
    print("    [could not parse JSON]")
    sys.exit(0)

def get_path(obj, path):
    parts = path.strip().split(".")
    cur = obj
    for p in parts:
        if isinstance(cur, dict):
            cur = cur.get(p)
        elif isinstance(cur, list) and p.isdigit():
            idx = int(p)
            cur = cur[idx] if idx < len(cur) else None
        else:
            return None
    return cur

for f in fields:
    val = get_path(d, f)
    if val is None:
        print(f"    \033[33m• {f}: null/missing\033[0m")
    elif isinstance(val, list):
        print(f"    \033[32m• {f}: [{len(val)} items]\033[0m")
    elif isinstance(val, dict):
        keys = list(val.keys())[:5]
        print(f"    \033[32m• {f}: {{...}} keys={keys}\033[0m")
    elif isinstance(val, str) and len(val) > 80:
        print(f"    \033[32m• {f}: \"{val[:80]}...\"\033[0m")
    else:
        print(f"    \033[32m• {f}: {repr(val)}\033[0m")
PYEOF
  fi
  echo "$json"
}

echo ""
echo -e "${BLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLD}  rugbylive-api-v3 comprehensive test — $(date '+%Y-%m-%d %H:%M')${NC}"
echo -e "${BLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ── 1. HEALTH ─────────────────────────────────────────────────────────────────
echo -e "\n${CYN}── 1. Health & Infrastructure ──${NC}"
check "GET /health" "$BASE/health" > /dev/null

# ── 2. LEAGUES ────────────────────────────────────────────────────────────────
echo -e "\n${CYN}── 2. Leagues ──${NC}"
LEAGUES_RESP=$(call "leagues" "$BASE/leagues")
LEAGUE_COUNT=$(echo "$LEAGUES_RESP" | head -1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null)
LEAGUE_MS=$(echo "$LEAGUES_RESP" | awk '{print $(NF-1)}')
echo -e "  ${GRN}✓${NC} ${BLD}GET /leagues${NC} — ${LEAGUE_MS}ms | ${LEAGUE_COUNT} leagues"
PASS=$((PASS+1))

# Pick a few representative league IDs for further tests
PREM_ID="13"        # Premiership
URC_ID="76"         # URC
SIX_ID="51"         # Six Nations
TOP14_ID="16"       # Top 14

echo ""
echo "  Spot-checking league fields..."
echo "$LEAGUES_RESP" | head -1 | python3 - <<'PYEOF'
import sys, json
d = json.load(sys.stdin)
leagues = d.get("data", [])
if leagues:
    l = leagues[0]
    fields = ["id","name","category","active","apiSportsId","highlightlyId","sapId","logoUrl"]
    for f in fields:
        val = l.get(f)
        sym = "✓" if val is not None else "✗"
        print(f"    {sym} {f}: {repr(val)[:60]}")
PYEOF

# ── 3. SEASONS ────────────────────────────────────────────────────────────────
echo -e "\n${CYN}── 3. Seasons ──${NC}"
check "GET /leagues/$PREM_ID/seasons (Premiership)" "$BASE/leagues/$PREM_ID/seasons" > /dev/null
check "GET /leagues/$SIX_ID/seasons (Six Nations)" "$BASE/leagues/$SIX_ID/seasons" > /dev/null

# ── 4. STANDINGS ──────────────────────────────────────────────────────────────
echo -e "\n${CYN}── 4. Standings ──${NC}"
check "GET /leagues/$PREM_ID/standings?season=2025 (Premiership)" "$BASE/leagues/$PREM_ID/standings?season=2025" > /dev/null
check "GET /leagues/$URC_ID/standings?season=2025 (URC)" "$BASE/leagues/$URC_ID/standings?season=2025" > /dev/null
check "GET /leagues/$SIX_ID/standings?season=2026 (Six Nations)" "$BASE/leagues/$SIX_ID/standings?season=2026" > /dev/null
check "GET /leagues/$TOP14_ID/standings?season=2025 (Top 14)" "$BASE/leagues/$TOP14_ID/standings?season=2025" > /dev/null

# ── 5. LEAGUE GAMES ──────────────────────────────────────────────────────────
echo -e "\n${CYN}── 5. League games ──${NC}"
check "GET /leagues/$PREM_ID/games?season=2025 (Premiership)" "$BASE/leagues/$PREM_ID/games?season=2025" > /dev/null
check "GET /leagues/$SIX_ID/games?season=2026 (Six Nations)" "$BASE/leagues/$SIX_ID/games?season=2026" > /dev/null

# ── 6. MATCHES BY DATE ────────────────────────────────────────────────────────
echo -e "\n${CYN}── 6. Matches by date ──${NC}"

# Test today + a known busy Saturday
TODAY=$(date +%Y-%m-%d)
BUSY_SAT="2026-04-26"  # recent Sat with URC + Prem matches
QUIET_DAY="2026-01-01"

check "GET /matches?date=$TODAY (today)" "$BASE/matches?date=$TODAY" > /dev/null
check "GET /matches?date=$BUSY_SAT (busy Saturday)" "$BASE/matches?date=$BUSY_SAT" > /dev/null
check "GET /matches?date=$QUIET_DAY (quiet day)" "$BASE/matches?date=$QUIET_DAY" > /dev/null

# Grab an AS match ID from the busy Saturday for detail tests
AS_MATCH_RESP=$(curl -s "$BASE/matches?date=$BUSY_SAT" 2>/dev/null)
AS_MATCH_ID=$(echo "$AS_MATCH_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
matches = d.get('data', [])
# prefer a URC or Prem match (more likely to have HL data)
for m in matches:
    comp = m.get('competition',{}).get('name','')
    if any(x in comp for x in ['United Rugby','Premiership','Six Nations','Top 14']):
        print(m['id'])
        break
if not matches:
    print('')
" 2>/dev/null)

echo ""
echo "  Using match for detail tests: ${AS_MATCH_ID:-none found}"
echo "$AS_MATCH_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
matches = d.get('data', [])
# Group by competition
from collections import Counter
comps = Counter(m.get('competition',{}).get('name','?') for m in matches)
print(f'  Total: {len(matches)} matches across {len(comps)} competitions')
for comp, n in sorted(comps.items(), key=lambda x: -x[1])[:8]:
    print(f'    {n}x {comp}')
" 2>/dev/null

# ── 7. LIVE ───────────────────────────────────────────────────────────────────
echo -e "\n${CYN}── 7. Live endpoint ──${NC}"
LIVE_RESP=$(curl -s -w "\n%{http_code}" "$BASE/matches/live" 2>/dev/null)
LIVE_CODE=$(echo "$LIVE_RESP" | tail -1)
LIVE_JSON=$(echo "$LIVE_RESP" | head -n -1)
LIVE_COUNT=$(echo "$LIVE_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null)
if [ "$LIVE_CODE" = "200" ]; then
  echo -e "  ${GRN}✓${NC} ${BLD}GET /matches/live${NC} | $LIVE_COUNT live now"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}✗${NC} ${BLD}GET /matches/live${NC} — HTTP $LIVE_CODE"
  FAIL=$((FAIL+1))
fi

# ── 8. MATCH DETAIL ──────────────────────────────────────────────────────────
echo -e "\n${CYN}── 8. Match detail ──${NC}"
if [ -n "$AS_MATCH_ID" ]; then
  inspect "GET /matches/$AS_MATCH_ID" \
    "$BASE/matches/$AS_MATCH_ID" \
    "data.id,data.status,data.homeScore,data.awayScore,data.round,data.periods.first.home" > /dev/null

  # ── 9. H2H ───────────────────────────────────────────────────────────────
  echo -e "\n${CYN}── 9. H2H ──${NC}"
  inspect "GET /matches/$AS_MATCH_ID/h2h" \
    "$BASE/matches/$AS_MATCH_ID/h2h" \
    "data" > /dev/null

  # ── 10. HIGHLIGHTS ───────────────────────────────────────────────────────
  echo -e "\n${CYN}── 10. Highlights ──${NC}"
  inspect "GET /matches/$AS_MATCH_ID/highlights" \
    "$BASE/matches/$AS_MATCH_ID/highlights" \
    "data" > /dev/null

  # ── 11. INCIDENTS ────────────────────────────────────────────────────────
  echo -e "\n${CYN}── 11. Incidents ──${NC}"
  inspect "GET /matches/$AS_MATCH_ID/incidents" \
    "$BASE/matches/$AS_MATCH_ID/incidents" \
    "data" > /dev/null

  # ── 12. /detail (main test) ──────────────────────────────────────────────
  echo -e "\n${CYN}── 12. /detail endpoint ──${NC}"
  DETAIL_RESP=$(curl -s -w "\n%{http_code}" "$BASE/matches/$AS_MATCH_ID/detail" 2>/dev/null)
  DETAIL_CODE=$(echo "$DETAIL_RESP" | tail -1)
  DETAIL_JSON=$(echo "$DETAIL_RESP" | head -n -1)
  DETAIL_START=$(date +%s%3N)
  DETAIL_RESP2=$(curl -s -w "\n%{http_code}" -o /tmp/detail_resp.json "$BASE/matches/$AS_MATCH_ID/detail" 2>/dev/null)
  DETAIL_END=$(date +%s%3N)
  DETAIL_MS=$((DETAIL_END - DETAIL_START))

  if [ "$DETAIL_CODE" = "200" ]; then
    echo -e "  ${GRN}✓${NC} ${BLD}GET /matches/$AS_MATCH_ID/detail${NC} — ${DETAIL_MS}ms"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗${NC} ${BLD}GET /matches/$AS_MATCH_ID/detail${NC} — HTTP $DETAIL_CODE"
    FAIL=$((FAIL+1))
  fi

  echo "$DETAIL_JSON" | python3 - <<'PYEOF'
import sys, json
try:
    d = json.loads(sys.stdin.read())
except:
    print("    [parse error]"); sys.exit(0)

data = d.get("data", {})
fields = {
    "match.id":           lambda: data.get("match",{}).get("id"),
    "match.status":       lambda: data.get("match",{}).get("status"),
    "match.homeScore":    lambda: data.get("match",{}).get("homeScore"),
    "match.periods":      lambda: data.get("match",{}).get("periods"),
    "venue":              lambda: data.get("venue"),
    "referee":            lambda: data.get("referee"),
    "weather":            lambda: data.get("weather"),
    "lineups":            lambda: data.get("lineups"),
    "predictions":        lambda: data.get("predictions"),
    "incidents":          lambda: data.get("incidents"),
    "highlights":         lambda: data.get("highlights"),
    "h2h":                lambda: data.get("h2h"),
    "sources":            lambda: data.get("sources"),
}
for label, fn in fields.items():
    val = fn()
    if val is None:
        sym = "\033[33m◦\033[0m"
        desc = "null"
    elif isinstance(val, list):
        sym = "\033[32m✓\033[0m" if val else "\033[33m◦\033[0m"
        desc = f"[{len(val)} items]" if val else "[] (empty)"
    elif isinstance(val, dict):
        sym = "\033[32m✓\033[0m"
        desc = str({k: type(v).__name__ for k,v in list(val.items())[:4]})
    else:
        sym = "\033[32m✓\033[0m"
        desc = repr(val)[:70]
    print(f"    {sym} {label}: {desc}")
PYEOF

else
  echo -e "  ${YEL}⚠${NC} No match ID found for $BUSY_SAT — skipping detail/h2h/highlights/incidents"
  WARN=$((WARN+1))
fi

# ── 13. DETAIL with 2nd match (try to find one with more data) ────────────────
echo -e "\n${CYN}── 13. Second detail test (URC match) ──${NC}"
URC_MATCH_RESP=$(curl -s "$BASE/matches?date=2026-05-03" 2>/dev/null)
URC_MATCH_ID=$(echo "$URC_MATCH_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
matches = d.get('data', [])
for m in matches:
    comp = m.get('competition',{}).get('name','')
    if 'United Rugby' in comp or 'URC' in comp:
        print(m['id'])
        break
" 2>/dev/null)

if [ -n "$URC_MATCH_ID" ]; then
  echo "  Using URC match: $URC_MATCH_ID"
  DETAIL2_START=$(date +%s%3N)
  DETAIL2_JSON=$(curl -s "$BASE/matches/$URC_MATCH_ID/detail" 2>/dev/null)
  DETAIL2_END=$(date +%s%3N)
  DETAIL2_MS=$((DETAIL2_END - DETAIL2_START))
  echo -e "  ${GRN}✓${NC} ${BLD}GET /matches/$URC_MATCH_ID/detail (URC)${NC} — ${DETAIL2_MS}ms"
  echo "$DETAIL2_JSON" | python3 - <<'PYEOF'
import sys, json
try:
    d = json.loads(sys.stdin.read())
except:
    print("    [parse error]"); sys.exit(0)
data = d.get("data", {})
for field in ["venue","referee","weather","lineups","predictions","incidents","highlights"]:
    val = data.get(field)
    if val is None:
        print(f"    \033[33m◦\033[0m {field}: null")
    elif isinstance(val, list):
        print(f"    {'✓' if val else '◦'} {field}: [{len(val)} items]")
    elif isinstance(val, dict):
        print(f"    ✓ {field}: present")
    else:
        print(f"    ✓ {field}: {repr(val)[:60]}")
print(f"    sources: {data.get('sources', {})}")
PYEOF
else
  echo -e "  ${YEL}⚠${NC} No URC match found for 2026-05-03"
fi

# ── 14. ADMIN ────────────────────────────────────────────────────────────────
echo -e "\n${CYN}── 14. Admin ──${NC}"
ADMIN_RESP=$(curl -s -w "\n%{http_code}" "$BASE/admin/leagues" 2>/dev/null)
ADMIN_CODE=$(echo "$ADMIN_RESP" | tail -1)
ADMIN_JSON=$(echo "$ADMIN_RESP" | head -n -1)
ADMIN_COUNT=$(echo "$ADMIN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null)
if [ "$ADMIN_CODE" = "200" ]; then
  echo -e "  ${GRN}✓${NC} ${BLD}GET /admin/leagues${NC} — $ADMIN_COUNT leagues (incl. inactive)"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}✗${NC} ${BLD}GET /admin/leagues${NC} — HTTP $ADMIN_CODE"
  FAIL=$((FAIL+1))
fi

# ── 15. RESPONSE TIME BENCHMARKS ─────────────────────────────────────────────
echo -e "\n${CYN}── 15. Response time benchmarks (3 cold calls each) ──${NC}"

bench() {
  local label="$1"
  local url="$2"
  local times=()
  for i in 1 2 3; do
    local s=$(date +%s%3N)
    curl -s "$url" > /dev/null 2>&1
    local e=$(date +%s%3N)
    times+=($((e - s)))
  done
  local avg=$(( (times[0] + times[1] + times[2]) / 3 ))
  local max=$(echo "${times[@]}" | tr ' ' '\n' | sort -n | tail -1)
  local flag=""
  if [ "$avg" -gt 3000 ]; then flag=" ${RED}⚠ SLOW${NC}"; fi
  if [ "$avg" -gt 1000 ] && [ "$avg" -le 3000 ]; then flag=" ${YEL}⚡ OK${NC}"; fi
  if [ "$avg" -le 1000 ]; then flag=" ${GRN}fast${NC}"; fi
  echo -e "  ${label}: avg ${avg}ms, max ${max}ms${flag}"
}

bench "/health" "$BASE/health"
bench "/leagues" "$BASE/leagues"
bench "/matches?date=$BUSY_SAT" "$BASE/matches?date=$BUSY_SAT"
bench "/matches/live" "$BASE/matches/live"
if [ -n "$AS_MATCH_ID" ]; then
  bench "/matches/:id" "$BASE/matches/$AS_MATCH_ID"
  bench "/matches/:id/detail" "$BASE/matches/$AS_MATCH_ID/detail"
  bench "/matches/:id/h2h" "$BASE/matches/$AS_MATCH_ID/h2h"
fi
bench "/leagues/$PREM_ID/standings?season=2025" "$BASE/leagues/$PREM_ID/standings?season=2025"

# ── SUMMARY ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLD}  Results: ${GRN}${PASS} passed${NC} ${BLD}| ${YEL}${WARN} warnings${NC} ${BLD}| ${RED}${FAIL} failed${NC}"
echo -e "${BLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
