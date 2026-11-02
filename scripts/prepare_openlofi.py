import os
import sys
import json
import zipfile
import shutil

ZIP_PATH = r"d:\Study\openlofi.zip"
TARGET_DIR = r"d:\Study\Web Application Development\SFSH\client\public\audio\lofi"

SELECTED_CATEGORIES = {
    "jazzhop": {
        "id": "jazzhop",
        "name": "Lo-Fi Jazz Lounge",
        "genre": "Jazz & Chillhop",
        "desc": "Smoky Rhodes piano, mellow saxophone & smooth swing beats",
        "descVi": "Giai điệu Jazz thư thái, tiếng kèn saxophone êm dịu và nhịp trống chill",
        "icon": "🎷",
        "bpm": "72 BPM",
        "limit": 10,
    },
    "soul-rnb": {
        "id": "soul-rnb",
        "name": "Lo-Fi Soul & R&B",
        "genre": "Soul & Slow Jam",
        "desc": "Deep warm 808 bass, silky keys & late-night room vibes",
        "descVi": "Nhịp R&B ấm áp, âm bass trầm sâu lắng đưa tâm trí vào dòng chảy tập trung",
        "icon": "☕",
        "bpm": "68 BPM",
        "limit": 10,
    },
    "late-night": {
        "id": "late-night",
        "name": "Midnight Synthwave",
        "genre": "Neon & After Hours",
        "desc": "Deep meditative analog synth pads for after-hours study",
        "descVi": "Không gian đêm yên tĩnh, âm thanh synth mơ màng cho những đêm thức muộn",
        "icon": "🌌",
        "bpm": "70 BPM",
        "limit": 10,
    },
    "ambient-lofi": {
        "id": "ambient-lofi",
        "name": "Peaceful Study Piano",
        "genre": "Minimalist Piano & Ambient",
        "desc": "Gentle felt piano chords and soft morning light ambiance",
        "descVi": "Tiếng đàn piano êm đềm, tạo khoảng lặng trong trẻo để ghi nhớ kiến thức",
        "icon": "🎹",
        "bpm": "65 BPM",
        "limit": 10,
    },
    "funk-soul": {
        "id": "funk-soul",
        "name": "Warm Acoustic & Groove",
        "genre": "Funk, Acoustic & Soul",
        "desc": "Delicate fingerpicked strings and warm organic groove",
        "descVi": "Giai điệu acoustic và soul ấm áp, giữ nhịp độ làm việc bền bỉ",
        "icon": "🎸",
        "bpm": "75 BPM",
        "limit": 10,
    },
}

def extract_selected():
    if not os.path.exists(ZIP_PATH):
        print(f"Error: {ZIP_PATH} does not exist yet.")
        return False

    print(f"Opening {ZIP_PATH} (size: {os.path.getsize(ZIP_PATH)} bytes)...")
    try:
        with zipfile.ZipFile(ZIP_PATH, 'r') as z:
            namelist = z.namelist()
            print(f"Total files in zip: {len(namelist)}")

            catalog_data = None
            # Find catalog.json if inside zip
            for n in namelist:
                if n.endswith("catalog.json"):
                    with z.open(n) as f:
                        catalog_data = json.load(f)
                    break

            if not catalog_data:
                # Load catalog from local or fetch
                import urllib.request
                req = urllib.request.urlopen("https://raw.githubusercontent.com/btahir/open-lofi/main/catalog.json")
                catalog_data = json.loads(req.read().decode('utf-8'))

            # Group tracks by category
            tracks_by_cat = {}
            for t in catalog_data.get("tracks", []):
                cat = t.get("category")
                if cat in SELECTED_CATEGORIES:
                    if cat not in tracks_by_cat:
                        tracks_by_cat[cat] = []
                    if len(tracks_by_cat[cat]) < SELECTED_CATEGORIES[cat]["limit"]:
                        tracks_by_cat[cat].append(t)

            # Map filenames in zip
            filename_to_zipmember = {}
            for n in namelist:
                base = os.path.basename(n)
                if base.endswith(".mp3"):
                    filename_to_zipmember[base] = n

            manifest = {}
            for cat_id, info in SELECTED_CATEGORIES.items():
                cat_dir = os.path.join(TARGET_DIR, cat_id)
                os.makedirs(cat_dir, exist_ok=True)

                cat_tracks = tracks_by_cat.get(cat_id, [])
                manifest_tracks = []
                for idx, t in enumerate(cat_tracks):
                    fn = t["filename"]
                    if fn in filename_to_zipmember:
                        zip_entry = filename_to_zipmember[fn]
                        target_file = os.path.join(cat_dir, fn)
                        if not os.path.exists(target_file) or os.path.getsize(target_file) == 0:
                            with z.open(zip_entry) as src, open(target_file, "wb") as dst:
                                shutil.copyfileobj(src, dst)
                        manifest_tracks.append({
                            "id": f"{cat_id}-{idx + 1}",
                            "title": t["title"],
                            "filename": fn,
                            "src": f"/audio/lofi/{cat_id}/{fn}",
                            "category": cat_id,
                        })
                    else:
                        print(f"Warning: {fn} not found in zip")

                manifest[cat_id] = {
                    **info,
                    "tracks": manifest_tracks,
                }
                print(f"Extracted {len(manifest_tracks)} tracks for {cat_id}")

            manifest_path = os.path.join(TARGET_DIR, "manifest.json")
            with open(manifest_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
            print(f"Saved manifest to {manifest_path}")
            return True
    except Exception as e:
        print(f"Error extracting zip: {e}")
        return False

if __name__ == "__main__":
    extract_selected()
