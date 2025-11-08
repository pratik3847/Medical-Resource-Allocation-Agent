import json
import time
from pathlib import Path
from typing import Dict, Any
from ..models.schemas import Preferences, PreferenceUpdate, PlanFeedback

PREF_PATH = Path(__file__).resolve().parents[1] / "data" / "preferences.json"


def _ensure_dir():
    PREF_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_preferences() -> Preferences:
    if PREF_PATH.exists():
        try:
            data = json.loads(PREF_PATH.read_text(encoding="utf-8"))
            w = data.get("weights", {})
            return Preferences(
                distance_weight=float(w.get("distance_weight", 0.7)),
                coverage_weight=float(w.get("coverage_weight", 0.3)),
                fairness_weight=float(w.get("fairness_weight", 0.0)),
            )
        except Exception:
            pass
    # defaults
    return Preferences()


def update_preferences(upd: PreferenceUpdate) -> Preferences:
    _ensure_dir()
    current = get_preferences()
    new = Preferences(
        distance_weight=float(upd.distance_weight if upd.distance_weight is not None else current.distance_weight),
        coverage_weight=float(upd.coverage_weight if upd.coverage_weight is not None else current.coverage_weight),
        fairness_weight=float(upd.fairness_weight if upd.fairness_weight is not None else current.fairness_weight),
    )
    state = {
        "weights": {
            "distance_weight": new.distance_weight,
            "coverage_weight": new.coverage_weight,
            "fairness_weight": new.fairness_weight,
        }
    }
    # preserve existing feedback history
    if PREF_PATH.exists():
        try:
            data = json.loads(PREF_PATH.read_text(encoding="utf-8"))
            if isinstance(data.get("feedback_history"), list):
                state["feedback_history"] = data["feedback_history"]
        except Exception:
            pass
    PREF_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")
    return new


def record_feedback(feedback: PlanFeedback) -> Dict[str, Any]:
    _ensure_dir()
    data: Dict[str, Any] = {}
    if PREF_PATH.exists():
        try:
            data = json.loads(PREF_PATH.read_text(encoding="utf-8"))
        except Exception:
            data = {}
    fh = data.get("feedback_history", [])
    fh.append({
        "ts": time.time(),
        "accepted": bool(feedback.accepted),
        "reason": feedback.reason,
        "plan_size": feedback.plan_size,
    })
    data["feedback_history"] = fh
    # Optional: nudge weights slightly based on feedback
    w = data.get("weights", {})
    dist = float(w.get("distance_weight", 0.7))
    cov = float(w.get("coverage_weight", 0.3))
    fair = float(w.get("fairness_weight", 0.0))
    # Simple adaptation: if rejected, reduce distance dominance slightly and increase fairness
    if not feedback.accepted:
        dist = max(0.0, dist - 0.05)
        fair = min(1.0, fair + 0.05)
    else:
        cov = min(1.0, cov + 0.02)
    # re-normalize to sum <= 1 (not strict requirement, but keep stable scale)
    s = dist + cov + fair
    if s > 0:
        dist, cov, fair = dist / s, cov / s, fair / s
    data["weights"] = {
        "distance_weight": dist,
        "coverage_weight": cov,
        "fairness_weight": fair,
    }
    PREF_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data
