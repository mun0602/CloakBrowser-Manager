#!/usr/bin/env python3
"""CloakBrowser Manager & Douyin Automation — End-to-End Automated Test Runner.

Runs comprehensive automated verification across all features and reports metrics.
"""

from __future__ import annotations

import sys
import httpx

BASE_URL = "http://127.0.0.1:8080"


class Colors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"


def log_test(name: str, passed: bool, detail: str = ""):
    status = f"{Colors.OKGREEN}✓ PASS{Colors.ENDC}" if passed else f"{Colors.FAIL}✗ FAIL{Colors.ENDC}"
    print(f"  [{status}] {Colors.BOLD}{name}{Colors.ENDC}")
    if detail:
        print(f"         └─ {Colors.OKCYAN}{detail}{Colors.ENDC}")


def run_all_tests():
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}  🚀 CLOAKBROWSER & DOUYIN AUTOMATION — LIVE AUTO TEST SUITE{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

    results: list[tuple[str, bool]] = []
    client = httpx.Client(base_url=BASE_URL, timeout=25.0)

    # 1. Test Server Health & Version Status
    try:
        r = client.get("/api/status")
        passed = r.status_code == 200 and "running_count" in r.json()
        data = r.json()
        log_test(
            "Test 1: Backend Health & Status (/api/status)",
            passed,
            f"OS: {data.get('host_os')}, Runtime: {data.get('runtime_mode')}, Total Profiles: {data.get('profiles_total')}",
        )
        results.append(("Backend Status", passed))
    except Exception as e:
        log_test("Test 1: Backend Health & Status (/api/status)", False, str(e))
        results.append(("Backend Status", False))

    # 2. Test Profile Management (Create Profile)
    p_id = None
    try:
        r = client.post("/api/profiles", json={"name": "AutoTest Live Profile", "platform": "windows"})
        passed = r.status_code in (200, 201) and "id" in r.json()
        p = r.json()
        p_id = p.get("id")
        log_test(
            "Test 2: Profile Creation (/api/profiles)",
            passed,
            f"Created Profile: {p.get('name')} (ID: {p_id[:8]}...)",
        )
        results.append(("Profile Creation", passed))
    except Exception as e:
        log_test("Test 2: Profile Creation (/api/profiles)", False, str(e))
        results.append(("Profile Creation", False))

    # 3. Test Proxy Syntax & Latency Check
    try:
        r = client.post(
            "/api/proxy/check-batch",
            json={"proxies": ["http://user:pass@127.0.0.1:8080", "127.0.0.1:7890"]},
        )
        data = r.json()
        passed = r.status_code == 200 and isinstance(data, list) and len(data) == 2
        log_test(
            "Test 3: Batch Proxy Syntax & GeoIP Parser",
            passed,
            f"Parsed {len(data)} Proxies: [Scheme: {data[0].get('scheme')}, Host: {data[0].get('host')}]",
        )
        results.append(("Proxy Batch Checker", passed))
    except Exception as e:
        log_test("Test 3: Batch Proxy Syntax & GeoIP Parser", False, str(e))
        results.append(("Proxy Batch Checker", False))

    # 4. Test Batch Profile Auto-Generator with Proxy
    try:
        r = client.post(
            "/api/profiles/batch-create-with-proxies",
            json={
                "proxies": ["http://proxy1.test:8080", "http://proxy2.test:8080"],
                "name_prefix": "AutoBatch Live",
                "platform": "windows",
            },
        )
        data = r.json()
        created_count = data.get("created_count", 0)
        passed = r.status_code in (200, 201) and created_count == 2
        log_test(
            "Test 4: Batch Profile Auto-Generator",
            passed,
            f"Spawned {created_count} isolated profiles with dedicated fingerprints",
        )
        results.append(("Batch Profile Generation", passed))
        # Cleanup
        for bp in data.get("profiles", []):
            client.delete(f"/api/profiles/{bp['id']}")
    except Exception as e:
        log_test("Test 4: Batch Profile Auto-Generator", False, str(e))
        results.append(("Batch Profile Generation", False))

    # 5. Test Douyin Account CRUD
    acc_id = None
    if p_id:
        try:
            r = client.post(
                "/api/douyin/accounts",
                json={
                    "profile_id": p_id,
                    "nickname": "AutoLiveNick99",
                    "douyin_id": "dy_live_99",
                    "tags": ["matrix", "autotest"],
                },
            )
            data = r.json()
            passed = r.status_code in (200, 201) and data.get("nickname") == "AutoLiveNick99"
            acc_id = data.get("id")
            log_test(
                "Test 5: Douyin Account Management (/api/douyin/accounts)",
                passed,
                f"Account: {data.get('nickname')} (Douyin ID: {data.get('douyin_id')})",
            )
            results.append(("Account Management", passed))
        except Exception as e:
            log_test("Test 5: Douyin Account Management", False, str(e))
            results.append(("Account Management", False))

    # 6. Test Gemini AI Comment Generation (https://vps.mun-ai.art/v1 - ag/ag-gemini-3.6-flash)
    try:
        r = client.post(
            "/api/douyin/ai/comment",
            json={"video_title": "秋冬时尚大衣穿搭技巧分享", "language": "zh", "style": "positive"},
        )
        data = r.json()
        comment_text = data.get("comment", "")
        passed = r.status_code == 200 and len(comment_text) > 0
        log_test(
            "Test 6: Gemini AI Commenter (ag/ag-gemini-3.6-flash via Gateway)",
            passed,
            f"Generated Authentic Douyin Comment: \"{comment_text}\"",
        )
        results.append(("Gemini AI Commenter", passed))
    except Exception as e:
        log_test("Test 6: Gemini AI Commenter", False, str(e))
        results.append(("Gemini AI Commenter", False))

    # 7. Test 24/7 Automated Cron Scheduler Engine & Calculation
    if p_id:
        try:
            r = client.post(
                "/api/douyin/schedules",
                json={
                    "name": "Daily Golden Hour Auto Schedule",
                    "action_type": "warmup",
                    "profile_ids": [p_id],
                    "config": {
                        "video_count": 6,
                        "min_watch_sec": 6,
                        "max_watch_sec": 12,
                        "min_interact_delay_sec": 2,
                        "max_interact_delay_sec": 5,
                        "like_probability": 0.4,
                    },
                    "schedule_type": "daily_time",
                    "schedule_value": "08:30,12:15,18:30,21:00",
                },
            )
            data = r.json()
            sch_id = data.get("id")
            next_run = data.get("next_run_at")
            passed = r.status_code in (200, 201) and sch_id is not None and next_run is not None
            log_test(
                "Test 7: 24/7 Automated Cron Scheduler Engine",
                passed,
                f"Schedule ID: {sch_id[:8]}... (Next Run: {next_run})",
            )
            results.append(("Cron Scheduler Engine", passed))

            # Toggle test & Cleanup
            if sch_id:
                client.post(f"/api/douyin/schedules/{sch_id}/toggle")
                client.delete(f"/api/douyin/schedules/{sch_id}")
        except Exception as e:
            log_test("Test 7: Cron Scheduler Engine", False, str(e))
            results.append(("Cron Scheduler Engine", False))

    # 8. Test Workflow Template CRUD
    try:
        r = client.post(
            "/api/douyin/workflows",
            json={
                "name": "Quick Warmup Template",
                "action_type": "warmup",
                "config": {"video_count": 4, "min_watch_sec": 5, "max_watch_sec": 10},
            },
        )
        data = r.json()
        wf_id = data.get("id")
        passed = r.status_code in (200, 201) and wf_id is not None
        log_test(
            "Test 8: Workflow Template Matrix (/api/douyin/workflows)",
            passed,
            f"Saved Workflow Template: {data.get('name')} (ID: {wf_id[:8]}...)",
        )
        results.append(("Workflow Templates", passed))
        if wf_id:
            client.delete(f"/api/douyin/workflows/{wf_id}")
    except Exception as e:
        log_test("Test 8: Workflow Template Matrix", False, str(e))
        results.append(("Workflow Templates", False))

    # Cleanup main test profile & account
    if acc_id:
        try:
            client.delete(f"/api/douyin/accounts/{acc_id}")
        except Exception:
            pass
    if p_id:
        try:
            client.delete(f"/api/profiles/{p_id}")
        except Exception:
            pass

    # Print Summary Table
    total = len(results)
    passed_count = sum(1 for _, p in results if p)
    failed_count = total - passed_count

    print(f"\n{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}  📊 AUTO TEST SUMMARY: {passed_count}/{total} PASSED ({passed_count/total*100:.1f}%){Colors.ENDC}")
    if failed_count == 0:
        print(f"{Colors.OKGREEN}{Colors.BOLD}  🎉 ALL {total} AUTOMATED SYSTEM TESTS PASSED PERFECTLY (100%)!{Colors.ENDC}")
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}  ⚠️ {failed_count} TESTS FAILED!{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

    return 0 if failed_count == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
