"""CSV-based inventory service for hospitals and resources.

Provides load/save, update operations, and reallocation suggestion planning.
"""
from __future__ import annotations
from typing import List, Dict, Tuple
from pathlib import Path
import csv
from ..models.schemas import (
    InventoryRecord,
    UpdateInventoryItem,
    ReallocationRequest,
    TransferPlanItem,
    ReallocationDemand,
)
from ..utils.geo import haversine_km
from .preferences_service import get_preferences
from ..config import get_settings


def _resolve_data_path() -> Path:
    settings = get_settings()
    # First: env-configured path (relative to repo root allowed)
    cfg_path = Path(settings.INVENTORY_CSV_PATH)
    if not cfg_path.is_absolute():
        # assume relative to repo root (two levels up from backend/)
        repo_root = Path(__file__).resolve().parents[2]
        cfg_path = repo_root / cfg_path
    if cfg_path.exists():
        return cfg_path
    # Second: default backend/data/inventory.csv
    default_path = Path(__file__).resolve().parents[1] / "data" / "inventory.csv"
    if default_path.exists():
        return default_path
    # Third: project-root dataset.csv (user-provided)
    dataset_fallback = Path(__file__).resolve().parents[2] / "dataset.csv"
    return dataset_fallback


def _read_records() -> List[InventoryRecord]:
    records: List[InventoryRecord] = []
    DATA_PATH = _resolve_data_path()
    if not DATA_PATH.exists():
        return records
    with DATA_PATH.open("r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = None
        for row in reader:
            # skip empty lines
            if not row or all(not cell.strip() for cell in row):
                continue
            if header is None:
                header = [c.strip() for c in row]
                # if header detected, continue
                continue
            try:
                # Robust parsing for address containing commas: accumulate until lat is parsable
                hospital_id = row[0].strip()
                hospital_name = row[1].strip()
                # find lat position by scanning from index 2
                addr_parts = []
                lat_idx = None
                for i in range(2, len(row)):
                    token = row[i].strip()
                    try:
                        # first token that can be float is lat
                        lat_val = float(token)
                        lat_idx = i
                        break
                    except ValueError:
                        addr_parts.append(token)
                if lat_idx is None or lat_idx + 6 > len(row) + 1:
                    # cannot parse, skip row
                    continue
                address = ", ".join([p for p in addr_parts if p != ""])
                lat = float(row[lat_idx].strip())
                lon = float(row[lat_idx + 1].strip())
                resource_name = row[lat_idx + 2].strip()
                quantity = int(row[lat_idx + 3].strip())
                reserve_min = int(row[lat_idx + 4].strip())
                unit = row[lat_idx + 5].strip() if (lat_idx + 5) < len(row) else "count"

                rec = InventoryRecord(
                    hospital_id=hospital_id,
                    hospital_name=hospital_name,
                    address=address,
                    lat=lat,
                    lon=lon,
                    resource_name=resource_name,
                    quantity=quantity,
                    reserve_min=reserve_min,
                    unit=unit or "count",
                )
                records.append(rec)
            except Exception:
                continue
    return records


def _write_records(records: List[InventoryRecord]) -> None:
    DATA_PATH = _resolve_data_path()
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATA_PATH.open("w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "hospital_id",
            "hospital_name",
            "address",
            "lat",
            "lon",
            "resource_name",
            "quantity",
            "reserve_min",
            "unit",
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow(r.dict())


def get_snapshot() -> List[InventoryRecord]:
    return _read_records()


def apply_updates(updates: List[UpdateInventoryItem]) -> List[InventoryRecord]:
    records = _read_records()
    index: Dict[Tuple[str, str], int] = {}
    for i, r in enumerate(records):
        index[(r.hospital_id, r.resource_name)] = i

    # minimal hospital metadata cache
    hosp_meta: Dict[str, Tuple[str, str, float, float]] = {}
    for r in records:
        hosp_meta[r.hospital_id] = (r.hospital_name, r.address, r.lat, r.lon)

    for upd in updates:
        key = (upd.hospital_id, upd.resource_name)
        if key in index:
            rec = records[index[key]]
            if upd.mode == "delta":
                rec.quantity = max(0, rec.quantity + int(upd.quantity))
            else:
                rec.quantity = max(0, int(upd.quantity))
        else:
            # create new with default metadata if unknown hospital id
            name, addr, lat, lon = hosp_meta.get(upd.hospital_id, (upd.hospital_id, "", 0.0, 0.0))
            rec = InventoryRecord(
                hospital_id=upd.hospital_id,
                hospital_name=name,
                address=addr,
                lat=lat,
                lon=lon,
                resource_name=upd.resource_name,
                quantity=max(0, int(upd.quantity if upd.mode == "set" else upd.quantity)),
                reserve_min=0,
                unit="count",
            )
            records.append(rec)
            index[key] = len(records) - 1

    _write_records(records)
    return records


def suggest_reallocation(req: ReallocationRequest):
    records = _read_records()
    # Build structures
    by_hosp_res: Dict[Tuple[str, str], InventoryRecord] = { (r.hospital_id, r.resource_name): r for r in records }
    hosp_coords: Dict[str, Tuple[float, float]] = { r.hospital_id: (r.lat, r.lon) for r in records }
    # compute deficits and surpluses per resource
    deficits: Dict[str, List[Tuple[str, int]]] = {}
    surpluses: Dict[str, List[Tuple[str, int]]] = {}
    # Start with reserve minima baseline
    for key, r in by_hosp_res.items():
        res = r.resource_name
        available_over_reserve = max(0, r.quantity - r.reserve_min)
        if available_over_reserve > 0:
            surpluses.setdefault(res, []).append((r.hospital_id, available_over_reserve))

    # apply demands -> deficits
    for d in req.demands:
        rec = by_hosp_res.get((d.hospital_id, d.resource_name))
        if rec is None:
            need = d.required_quantity
        else:
            # additional need on top of reserve
            margin = max(0, rec.quantity - rec.reserve_min)
            need = max(0, d.required_quantity - margin)
        if need > 0:
            deficits.setdefault(d.resource_name, []).append((d.hospital_id, need))

    plan: List[TransferPlanItem] = []
    unmet: List[ReallocationDemand] = []
    # summary mapping: hospital -> resource -> before/after/reserve
    summary: Dict[str, Dict[str, Dict[str, float]]] = {}
    for r in records:
        summary.setdefault(r.hospital_id, {}).setdefault(r.resource_name, {"before": r.quantity, "after": r.quantity, "reserve_min": r.reserve_min})

    # For each resource, match deficits from nearest surplus
    for res, needs in deficits.items():
        donors = surpluses.get(res, [])
        if not donors:
            for hosp_id, need in needs:
                unmet.append(ReallocationDemand(hospital_id=hosp_id, resource_name=res, required_quantity=need))
            continue
        # donors as mutable list of [hosp_id, available]
        donor_list = [list(d) for d in donors]
        # Load adaptive preferences
        prefs = get_preferences()
        w_dist = float(prefs.distance_weight)
        w_cov = float(prefs.coverage_weight)
        w_fair = float(prefs.fairness_weight)

        for needy_id, need_qty in needs:
            remaining = need_qty
            # sort donors by adaptive score combining distance, available quantity (coverage), and fairness
            def donor_score(don):
                donor_id = don[0]
                avail = float(don[1])
                dist = haversine_km(
                    hosp_coords.get(needy_id, (0.0, 0.0))[0],
                    hosp_coords.get(needy_id, (0.0, 0.0))[1],
                    hosp_coords.get(donor_id, (0.0, 0.0))[0],
                    hosp_coords.get(donor_id, (0.0, 0.0))[1],
                )
                # fairness penalty prefers donors with higher available surplus (to avoid overburdening small donors)
                fairness_penalty = 1.0 / (avail + 1.0)
                # Lower is better
                return w_dist * dist - w_cov * avail + w_fair * fairness_penalty

            donor_list.sort(key=donor_score)
            for donor in donor_list:
                if remaining <= 0:
                    break
                donor_id, avail = donor[0], int(donor[1])
                if avail <= 0 or donor_id == needy_id:
                    continue
                qty = min(avail, remaining)
                donor[1] = avail - qty
                remaining -= qty
                dist = haversine_km(
                    hosp_coords.get(needy_id, (0.0, 0.0))[0],
                    hosp_coords.get(needy_id, (0.0, 0.0))[1],
                    hosp_coords.get(donor_id, (0.0, 0.0))[0],
                    hosp_coords.get(donor_id, (0.0, 0.0))[1],
                )
                plan.append(TransferPlanItem(resource_name=res, from_hospital_id=donor_id, to_hospital_id=needy_id, quantity=int(qty), distance_km=round(dist, 2)))
                # update summary after
                summary[donor_id][res]["after"] -= qty
                summary[needy_id].setdefault(res, {"before": 0, "after": 0, "reserve_min": 0})
                if (needy_id, res) in by_hosp_res:
                    summary[needy_id][res]["reserve_min"] = by_hosp_res[(needy_id, res)].reserve_min
                summary[needy_id][res]["after"] = summary[needy_id][res].get("after", 0) + qty

            if remaining > 0:
                unmet.append(ReallocationDemand(hospital_id=needy_id, resource_name=res, required_quantity=int(remaining)))

    return plan, unmet, summary
