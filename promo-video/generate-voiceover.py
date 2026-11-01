"""
Generator Voice Over (TTS) Gratis untuk Video Promo ATS CV Builder (25 Detik).

Menggunakan Microsoft Edge Neural TTS (`id-ID-ArdiNeural` / `id-ID-GadisNeural`)
secara gratis tanpa API key, serta memverifikasi durasi tiap file MP3 agar tidak
tumpang-tindih antar scene di Remotion (`src/Composition.tsx`).

Cara menjalankan:
    python generate-voiceover.py
"""

import asyncio
import os
import re
import subprocess
from pathlib import Path
import edge_tts
import imageio_ffmpeg

VOICE = os.environ.get("TTS_VOICE", "id-ID-ArdiNeural")
RATE = os.environ.get("TTS_RATE", "+15%")
PITCH = os.environ.get("TTS_PITCH", "-2Hz")

OUTPUT_DIR = Path(__file__).parent / "public" / "voiceover"

# Naskah ringkas & tajam, selaras dengan teks layar dan batas durasi tiap scene
SCENES = [
    {
        "id": "s1-hook",
        "start_sec": 0.0,
        "max_sec": 2.75,
        "text": "CV bagus pun bisa ditolak sistem.",
    },
    {
        "id": "s2-machine",
        "start_sec": 3.0,
        "max_sec": 3.75,
        "text": "Bukan salahmu. Sistem gagal membaca tabel rumit.",
    },
    {
        "id": "s3-product",
        "start_sec": 7.0,
        "max_sec": 3.75,
        "text": "Dengan ATS CV Builder, ketik dan lihat hasilnya langsung.",
    },
    {
        "id": "s4-multipage",
        "start_sec": 11.0,
        "max_sec": 3.75,
        "text": "CV panjang? Halaman otomatis terpotong rapi.",
    },
    {
        "id": "s5-features",
        "start_sec": 15.0,
        "max_sec": 2.95,
        "text": "Format lengkap, dwibahasa, aman di browser.",
    },
    {
        "id": "s6-score",
        "start_sec": 18.0,
        "max_sec": 2.75,
        "text": "Pantau skor kesiapan ATS secara real-time.",
    },
    {
        "id": "s7-cta",
        "start_sec": 21.0,
        "max_sec": 3.75,
        "text": "Gratis dan open-source. Coba sekarang di GitHub!",
    },
]


def get_audio_duration(file_path: Path) -> float:
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    proc = subprocess.run(
        [ffmpeg_exe, "-i", str(file_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", proc.stderr)
    if not match:
        return 0.0
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


async def generate_scene_audio(scene: dict) -> tuple[Path, float]:
    raw_path = OUTPUT_DIR / f"{scene['id']}_raw.mp3"
    out_path = OUTPUT_DIR / f"{scene['id']}.mp3"

    communicate = edge_tts.Communicate(
        text=scene["text"],
        voice=VOICE,
        rate=RATE,
        pitch=PITCH,
    )
    await communicate.save(str(raw_path))

    # Trim leading/trailing silence so each cue starts crisply on its scene cut
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            str(raw_path),
            "-af",
            "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_silence=0.08:start_threshold=-45dB,areverse",
            str(out_path),
        ],
        capture_output=True,
        check=True,
    )
    raw_path.unlink(missing_ok=True)
    duration = get_audio_duration(out_path)
    return out_path, duration


async def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Generating Indonesian Neural Voiceover ({VOICE}, rate={RATE})...")
    all_fit = True
    for scene in SCENES:
        out_path, duration = await generate_scene_audio(scene)
        fits = duration <= scene["max_sec"]
        status = "OK" if fits else "OVER"
        if not fits:
            all_fit = False
        print(
            f"  [{status}] {out_path.name:<18} | {duration:.2f}s / {scene['max_sec']:.2f}s "
            f"(mulai {scene['start_sec']:04.1f}s) | \"{scene['text']}\""
        )
    if not all_fit:
        raise SystemExit("Ada audio yang melebihi durasi scene!")
    print(f"\nSelesai! Semua 7 file audio pas dengan durasi scene di: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
