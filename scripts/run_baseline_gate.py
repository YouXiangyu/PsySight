import subprocess
import sys
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parents[1]
BACKEND_SMOKE = ROOT / "backend" / "scripts" / "smoke_api_baseline.py"
FRONTEND_DIR = ROOT / "frontend"


def run_step(name: str, cmd: list[str], cwd: Path | None = None) -> None:
    print(f"\n=== {name} ===")
    if os.name == "nt" and cmd and cmd[0] == "npm":
        result = subprocess.run(["cmd", "/c", *cmd], cwd=str(cwd) if cwd else None)
    else:
        result = subprocess.run(cmd, cwd=str(cwd) if cwd else None)
    if result.returncode != 0:
        print(f"[FAIL] {name}")
        sys.exit(result.returncode)
    print(f"[PASS] {name}")


def main() -> None:
    run_step("Backend API baseline smoke", [sys.executable, str(BACKEND_SMOKE)])
    run_step("Frontend production build", ["npm", "run", "build"], cwd=FRONTEND_DIR)
    print("\n全部自动门禁通过。")
    print("请继续按 docs/refactor-baseline-gate.md 执行前端关键路径手工冒烟。")


if __name__ == "__main__":
    main()
